const ACCESS_TOKEN_KEY = "sia_edu_access_token";
const REFRESH_TOKEN_KEY = "sia_edu_refresh_token";
const USER_KEY = "sia_edu_user";

export function getStoredAuth() {
  const access = localStorage.getItem(ACCESS_TOKEN_KEY);
  const refresh = localStorage.getItem(REFRESH_TOKEN_KEY);
  const user = localStorage.getItem(USER_KEY);
  return {
    access,
    refresh,
    user: user ? JSON.parse(user) : null,
  };
}

export function setStoredAuth({ access, refresh, user }) {
  if (access) {
    localStorage.setItem(ACCESS_TOKEN_KEY, access);
  }
  if (refresh) {
    localStorage.setItem(REFRESH_TOKEN_KEY, refresh);
  }
  if (user) {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  }
}

export function clearStoredAuth() {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}
