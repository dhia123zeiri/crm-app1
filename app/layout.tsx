// app/layout.tsx
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { CssBaseline } from "@mui/material";

import authenticated from "./auth/authenticated";
import { logout } from "./auth/logout";
import { getCurrentUser, TokenPayload } from "./auth/get-user";
import { headers } from "next/headers";
import Providers from "./providers";
import Header from "./comptable/header/header";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "CRM Comptable",
  description: "Gestion automatisée des obligations comptables",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const headersList = await headers();
  const pathname = headersList.get("x-pathname") || "";

  // Vérifier si c'est une page de formulaire client
  const isClientFormPage = pathname.includes("/client-portal");

  const isAuthenticated = await authenticated();
  const user: TokenPayload | null = isAuthenticated
    ? await getCurrentUser()
    : null;

  return (
    <html lang="en">
      <body className={inter.className}>
        <Providers authenticated={isAuthenticated} user={user}>
          <CssBaseline />
          {!isClientFormPage && <Header user={user} onLogout={logout} />}
          {children}
        </Providers>
      </body>
    </html>
  );
}
