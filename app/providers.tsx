// app/providers.tsx
"use client";

import { AppRouterCacheProvider } from "@mui/material-nextjs/v13-appRouter";
import { ReactNode } from "react";
import { AuthContext } from "./auth/auth-context";
import { TokenPayload } from "./auth/get-user";
import { UserContext } from "./auth/user-context";

interface ProviderProps {
  children: ReactNode; // Changé de ReactElement[] à ReactNode
  authenticated: boolean;
  user: TokenPayload | null;
}

export default function Providers({
  children,
  authenticated,
  user,
}: ProviderProps) {
  return (
    <AppRouterCacheProvider>
      <AuthContext.Provider value={authenticated}>
        <UserContext.Provider value={user}>{children}</UserContext.Provider>
      </AuthContext.Provider>
    </AppRouterCacheProvider>
  );
}
