"use server"

import { cookies } from "next/headers";
import { AUTHENTICATION_COOKIE } from "./auth-cookie";

export async function logout() {
  // Get the mutable cookies instance
  const cookieStore = cookies();
  
  // Delete the authentication cookie
  cookieStore.set(AUTHENTICATION_COOKIE, "", { maxAge: -1 });
}
