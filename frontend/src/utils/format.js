export function formatCurrency(value, currency = "USD") {
  const amount = Number(value || 0);
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  }).format(amount);
}

export function formatDate(value) {
  if (!value) {
    return "-";
  }
  return new Date(value).toLocaleString();
}
