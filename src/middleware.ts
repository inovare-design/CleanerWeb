import NextAuth from "next-auth";
import authConfig from "@/auth.config";
import {
    DEFAULT_LOGIN_REDIRECT,
    DEFAULT_CLIENT_REDIRECT,
    DEFAULT_CLEANER_REDIRECT,
    apiAuthPrefix,
    authRoutes,
    publicRoutes,
} from "@/routes";

const { auth } = NextAuth(authConfig);

export default auth((req) => {
    const { nextUrl } = req;
    const isLoggedIn = !!req.auth;

    const isApiAuthRoute = nextUrl.pathname.startsWith(apiAuthPrefix);
    const isPublicRoute = publicRoutes.includes(nextUrl.pathname);
    const isAuthRoute = authRoutes.includes(nextUrl.pathname);

    if (isApiAuthRoute) {
        return null; // Don't protect API auth routes
    }

    if (isAuthRoute) {
        if (isLoggedIn) {
            const role = req.auth?.user?.role;

            if (role === "ADMIN" || role === "SUPER_ADMIN") {
                return Response.redirect(new URL(DEFAULT_LOGIN_REDIRECT, nextUrl));
            }

            if (role === "CLIENT") {
                return Response.redirect(new URL(DEFAULT_CLIENT_REDIRECT, nextUrl));
            }

            if (role === "CLEANER") {
                return Response.redirect(new URL(DEFAULT_CLEANER_REDIRECT, nextUrl));
            }

            return Response.redirect(new URL(DEFAULT_LOGIN_REDIRECT, nextUrl));
        }
        return null;
    }

    if (!isLoggedIn && !isPublicRoute) {
        return Response.redirect(new URL("/login", nextUrl));
    }

    // Role-based protection for specific paths
    if (isLoggedIn) {
        const role = req.auth?.user?.role;

        if (nextUrl.pathname.startsWith("/admin") && role !== "ADMIN" && role !== "SUPER_ADMIN") {
            return Response.redirect(new URL("/", nextUrl));
        }

        if (nextUrl.pathname.startsWith("/app") && role !== "CLIENT") {
            // Admins por enquanto podem ver o /app para testes
            if (role !== "ADMIN" && role !== "SUPER_ADMIN") {
                return Response.redirect(new URL("/", nextUrl));
            }
        }
    }

    return null;
});

// Optionally, don't invoke Middleware on some paths
// Read more: https://nextjs.org/docs/app/building-your-application/routing/middleware#matcher
export const config = {
    matcher: ["/((?!.+\\.[\\w]+$|_next).*)", "/", "/(api|trpc)(.*)"],
};
