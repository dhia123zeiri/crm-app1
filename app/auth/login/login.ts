"use server";

import { jwtDecode } from "jwt-decode";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { FormResponse} from "@/app/common/interfaces/form-error.interface";

import { getErrorMessage } from "@/app/common/util/errors";
import { AUTHENTICATION_COOKIE } from "../auth-cookie";
import { getCurrentUser, Role } from "../get-user";
import { red } from "@mui/material/colors";
import { API_URL } from "@/app/common/constants/api";

export default async function login(_prevState: FormResponse, formData: FormData) {
  const res = await fetch(`${API_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(Object.fromEntries(formData)),
  });

  const parsedRes = await res.json();
  if (!res.ok) {
    return { error: getErrorMessage(parsedRes) };
  }

  await setAuthCookie(res);

  const userData = await getCurrentUser()
   if (userData) {
        // Redirect based on role
        redirectBasedOnRole(userData.role)
    }
}

const setAuthCookie = async (response: Response) => {
  const setCookieHeader = response.headers.get("Set-Cookie");
  if (setCookieHeader) {
    const token = setCookieHeader.split(";")[0].split("=")[1];
    const cookieStore = await cookies();
    cookieStore.set({
      name: AUTHENTICATION_COOKIE,
      value: token,
      secure: true,
      httpOnly: true,
      expires: new Date(jwtDecode(token).exp! * 1000),
    });
  }
};

const redirectBasedOnRole = (role: Role) => {
    switch (role) {
      case Role.CLIENT:
        redirect('/client/dashboard')
        break
      case Role.COMPTABLE:
        redirect('/comptable/dashboard')
        break
      case Role.ADMIN:
        redirect('/admin/dashboard')
        break
      default:
        redirect('/')
}
}
