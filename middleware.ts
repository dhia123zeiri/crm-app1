import { NextRequest, NextResponse } from "next/server";
import authenticated from "./app/auth/authenticated";
import { unauthenticatedRoutes } from "./app/common/constants/routes";

export async function middleware(request: NextRequest) {
  const auth = await authenticated();

  // Ajouter le pathname dans les headers pour que le layout puisse l'utiliser
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-pathname', request.nextUrl.pathname);

  // Vérifier si c'est une route de formulaire client (pas besoin d'authentification)
  const isClientFormRoute = request.nextUrl.pathname.includes('/client-portal/');

  // Si c'est une route de formulaire client, laisser passer sans vérification d'auth
  if (isClientFormRoute) {
    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
  }

  // Logique d'authentification existante pour les autres routes
  if (
    !auth &&
    !unauthenticatedRoutes.some((route) =>
      request.nextUrl.pathname.startsWith(route.path)
    )
  ) {
    return NextResponse.redirect(new URL("/auth/login", request.url));
  }

  // Continuer avec les headers mis à jour
  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|.*\\.png$).*)"],
};