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
