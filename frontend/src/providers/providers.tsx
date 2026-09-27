"use client";
import { QueryClientProvider } from "@tanstack/react-query";
import React from "react";
import { getQueryClient } from "./browser-query-client";
import { Toaster } from "react-hot-toast";
import { AuthHydrator } from "./auth-hydrator";

const Providers = ({ children }: { children: React.ReactNode }) => {
  const queryClient = getQueryClient();

  return (
    <QueryClientProvider client={queryClient}>
      <AuthHydrator />
      {children}
      <Toaster position="top-center" />
    </QueryClientProvider>
  );
};

export default Providers;
