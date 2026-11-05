const KEY = "vm_admin_token";

export function getToken() {
  if (typeof window === "undefined") return "";
  return window.localStorage.getItem(KEY) || "";
}

export function setToken(token) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY, token);
}

export function clearToken() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(KEY);
}

export function isUnauthorized(result) {
  return !result || result.ok === false || result.valid === false;
}