import Credentials from "next-auth/providers/credentials";
import type { NextAuthConfig } from "next-auth";

// IMPORTANTE: Este arquivo não deve importar Prisma ou bcryptjs
// para que o Middleware (Edge) consiga carregá-lo sem estourar o limite de tamanho.

export default {
    providers: [
        Credentials({
            async authorize() {
                return null; // A lógica real fica no auth.ts
            }
        })
    ],
} satisfies NextAuthConfig;
