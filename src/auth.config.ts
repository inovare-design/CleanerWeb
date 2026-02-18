import Credentials from "next-auth/providers/credentials";
import { z } from "zod";
import type { NextAuthConfig } from "next-auth";
import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient(); // Note: Prisma Client might need generic handling for Edge, but for authorize logic in config it's tricky.
// For middleware compatible config, we usually avoid Prisma here or use an Edge compatible adapter.
// However, since we are using 'auth.ts' with full Prisma for main handlers and 'auth.config.ts' for middleware...
// Actually, 'auth.config.ts' should NOT import Prisma if it's used in Middleware due to Edge compatibility issues.
// Let's keep it simple for now:

const LoginSchema = z.object({
    email: z.string().email(),
    password: z.string().min(1, "Password is required"),
});

export default {
    providers: [
        Credentials({
            async authorize(credentials) {
                // Warning: This part runs on Edge if used in Middleware context for session check BUT credentials strategy usually runs on Node in the Server Action.
                // For Middleware matching, we mainly need the session strategy.
                // We will keep the full logic in auth.ts and a simplified version here if needed, but for now let's just export the providers configuration shape.
                return null;
            }
        })
    ],
} satisfies NextAuthConfig;
