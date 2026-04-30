export function isAuthenticated() {
  return Boolean(window.localStorage.getItem("hr_token"));
}
