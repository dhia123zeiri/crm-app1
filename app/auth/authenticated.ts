// auth/authenticated.ts
import { cookies } from "next/headers";
import { AUTHENTICATION_COOKIE } from "./auth-cookie";

export default async function authenticated(){
    try {
        const cookieStore = await cookies();
        const authCookie = cookieStore.get(AUTHENTICATION_COOKIE)?.value;

        console.log("🍪 All cookies:", cookieStore.getAll());
        console.log("🔑 Auth cookie:", authCookie);
        console.log("✅ Is authenticated:", !!authCookie);

        return !!authCookie;
    } catch (error) {
        console.error("❌ Error checking authentication:", error);
        return false;
    }
}