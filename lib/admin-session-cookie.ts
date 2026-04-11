/**
 * Opciono: ADMIN_SESSION_COOKIE_DOMAIN=.aihype-academy.com na Vercelu ako korisnici
 * ponekad idu na www a ponekad na apex — inače je kolačić host-only i ne deli se.
 */
export function adminSessionCookieOpts(): {
  path: string;
  httpOnly: boolean;
  secure: boolean;
  sameSite: "lax";
  domain?: string;
} {
  const isProd = process.env.NODE_ENV === "production";
  const domain = process.env.ADMIN_SESSION_COOKIE_DOMAIN?.trim();
  return {
    httpOnly: true,
    secure: isProd,
    sameSite: "lax",
    path: "/",
    ...(domain ? { domain } : {}),
  };
}
