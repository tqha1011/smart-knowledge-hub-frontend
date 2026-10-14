export function redirectToLogin(demoExpired = false): void {
  window.location.href = demoExpired ? "/login?demo=expired" : "/login";
}
