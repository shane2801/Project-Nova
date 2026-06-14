export function isAuthEnabled(): boolean {
  return process.env.EVOLVE_AUTH_MODE === "enabled";
}

export const JWT_COOKIE = "evolve_session";
export const DEV_COOKIE = "evolve_user_id"; // legacy dev-mode cookie