import type { NextAuthConfig } from "next-auth";

// IMPORTANTE: Este arquivo não deve importar Prisma ou bcryptjs
// para que o Middleware (Edge) consiga carregá-lo sem estourar o limite de tamanho.

export default {
    providers: [], // Providers moved to auth.ts to keep middleware lean
} satisfies NextAuthConfig;
