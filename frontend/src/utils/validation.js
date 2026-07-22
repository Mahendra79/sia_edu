// Shared client-side field validators, kept in sync with backend/accounts/serializers.py
// so users see the same friendly errors instantly instead of after a round trip.

export const NAME_REGEX = /^[A-Za-zÀ-ÖØ-öø-ÿ][A-Za-zÀ-ÖØ-öø-ÿ' -]*$/;
export const USERNAME_REGEX = /^[\w.@+-]+$/;
export const PHONE_REGEX = /^[0-9]{10}$/;

export const NAME_INVALID_MESSAGE = "Name can only contain letters, spaces, hyphens, and apostrophes.";
export const USERNAME_INVALID_MESSAGE = "Username can only contain letters, numbers, and @/./+/-/_ characters.";
export const PHONE_INVALID_MESSAGE = "Enter a valid 10-digit phone number.";

export function validateName(value) {
  const trimmed = String(value || "").trim();
  if (!trimmed) return "Name is required.";
  if (!NAME_REGEX.test(trimmed)) return NAME_INVALID_MESSAGE;
  return "";
}

export function validateUsername(value) {
  const trimmed = String(value || "").trim();
  if (!trimmed) return "Username is required.";
  if (!USERNAME_REGEX.test(trimmed)) return USERNAME_INVALID_MESSAGE;
  return "";
}

export function validatePhone(value) {
  const trimmed = String(value || "").trim();
  if (!trimmed) return "Phone number is required.";
  if (!PHONE_REGEX.test(trimmed)) return PHONE_INVALID_MESSAGE;
  return "";
}
