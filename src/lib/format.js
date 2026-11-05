const currency = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  maximumFractionDigits: 0,
});

const decimal = new Intl.NumberFormat("pt-BR");

export function brl(value) {
  return currency.format(Number(value) || 0);
}

export function km(value) {
  return `${decimal.format(Number(value) || 0)} km`;
}

export function onlyDigits(value) {
  return String(value || "").replace(/\D/g, "");
}

export function whatsappLink(phone, message) {
  const digits = onlyDigits(phone);
  if (!digits) return null;
  const withCountry = digits.length <= 11 ? `55${digits}` : digits;
  return `https://wa.me/${withCountry}?text=${encodeURIComponent(message || "")}`;
}

export function carName(vehicle) {
  if (!vehicle) return "";
  return [vehicle.brand, vehicle.model].filter(Boolean).join(" ");
}

export function vehicleTitle(vehicle) {
  if (!vehicle) return "";
  return [vehicle.brand, vehicle.model, vehicle.version].filter(Boolean).join(" ");
}

export function leadMessage(vehicle) {
  const parts = [carName(vehicle)];
  if (vehicle?.year_model) parts.push(`ano ${vehicle.year_model}`);
  return `Olá! Tenho interesse no ${parts.join(", ")} anunciado no site. Poderia me passar mais informações?`;
}

export function formatPhone(value) {
  const digits = onlyDigits(value);
  if (digits.length === 11) return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  if (digits.length === 10) return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  return value || "—";
}

export function formatDate(value) {
  if (!value) return "—";
  return new Date(value).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "America/Sao_Paulo",
  });
}