const ACCESS_TOKEN_COOKIE = "accessToken";

export function getClientAccessToken() {
  if (typeof document === "undefined") return undefined;

  const cookie = document.cookie
    .split("; ")
    .find((item) => item.startsWith(`${ACCESS_TOKEN_COOKIE}=`));

  if (!cookie) return undefined;
  return decodeURIComponent(cookie.slice(ACCESS_TOKEN_COOKIE.length + 1));
}

export function setClientAccessToken(token: string) {
  document.cookie = `${ACCESS_TOKEN_COOKIE}=${encodeURIComponent(token)}; Path=/; Max-Age=${60 * 30}; SameSite=Lax`;
}
