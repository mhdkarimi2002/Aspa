import { useQuery } from "@tanstack/react-query";
import { z } from "zod";
import { apiUrl } from "./runtime";
import { request } from "./client";
const health = z.object({ status: z.literal("ok") });
export function useHealth() {
  return useQuery({
    queryKey: ["health", apiUrl],
    queryFn: async ({ signal }) =>
      health.parse(await request(apiUrl, "/health", signal)),
    staleTime: 30000,
    networkMode: "always",
    retry: false,
  });
}
