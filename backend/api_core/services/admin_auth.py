import base64
import hashlib
import hmac
import json
import secrets
import time


PASSWORD_ITERATIONS = 100000
TOKEN_HOURS = 12


def random_hex(bytes_length=16):
    return secrets.token_hex(bytes_length)


def hash_password(password, salt_hex, iterations=PASSWORD_ITERATIONS):
    salt = bytes.fromhex(salt_hex)

    result = hashlib.pbkdf2_hmac(
        "sha256",
        password.encode("utf-8"),
        salt,
        iterations,
        dklen=32,
    )

    return result.hex()


def verify_password(password, salt_hex, password_hash, iterations=PASSWORD_ITERATIONS):
    attempt = hash_password(password, salt_hex, iterations)
    return hmac.compare_digest(attempt, password_hash)


def _b64url_encode(value):
    return base64.urlsafe_b64encode(value).decode("ascii").rstrip("=")


def _b64url_decode(value):
    padding = "=" * (-len(value) % 4)
    return base64.urlsafe_b64decode(value + padding)


def _sign(password_hash, payload):
    secret = bytes.fromhex(password_hash)

    return hmac.new(
        secret,
        payload.encode("utf-8"),
        hashlib.sha256,
    ).hexdigest()


def create_session_token(password_hash, hours=TOKEN_HOURS):
    payload_data = {
        "exp": int((time.time() + hours * 3600) * 1000),
        "jti": random_hex(8),
    }

    payload_json = json.dumps(
        payload_data,
        separators=(",", ":"),
    )

    payload = _b64url_encode(payload_json.encode("utf-8"))
    signature = _sign(password_hash, payload)

    return f"{payload}.{signature}"


def verify_session_token(token, password_hash):
    if not isinstance(token, str) or len(token) > 500:
        return False

    try:
        parts = token.split(".")
        if len(parts) != 2:
            return False

        payload, signature = parts

        expected_signature = _sign(password_hash, payload)

        if not hmac.compare_digest(expected_signature, signature):
            return False

        decoded = _b64url_decode(payload)
        data = json.loads(decoded.decode("utf-8"))

        expiration = data.get("exp")

        if isinstance(expiration, bool) or not isinstance(expiration, (int, float)):
            return False

        return expiration > time.time() * 1000

    except (ValueError, TypeError, KeyError, UnicodeDecodeError, json.JSONDecodeError):
        return False
