import type { NextAuthConfig } from "next-auth";

// IMPORTANTE: Este arquivo não deve importar Prisma ou bcryptjs
// para que o Middleware (Edge) consiga carregá-lo sem estourar o limite de tamanho.

export default {
    providers: [], // Providers moved to auth.ts to keep middleware lean
    callbacks: {
        async session({ token, session }) {
            if (token.sub && session.user) {
                session.user.id = token.sub;
            }

            if (token.role && session.user) {
                // @ts-ignore
                session.user.role = token.role;
            }

            if (token.tenantId && session.user) {
                // @ts-ignore
                session.user.tenantId = token.tenantId;
            }

            return session;
        },
        async jwt({ token, user, profile }) {
            // Se for o momento do login, o 'user' estará presente
            if (user) {
                // @ts-ignore
                token.role = user.role;
                // @ts-ignore
                token.tenantId = user.tenantId;
            }
            return token;
        }
    }
} satisfies NextAuthConfig;
