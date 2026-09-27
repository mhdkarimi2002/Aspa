import { cookies } from "next/headers";

export async function getAccessToken() {
  const cookiesStore = await cookies();
  const accessToken = cookiesStore.get("accessToken")?.value;

  return accessToken;
}
