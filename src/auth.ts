import NextAuth from "next-auth"
import { PrismaAdapter } from "@auth/prisma-adapter"
import { PrismaClient } from "@prisma/client"
import Credentials from "next-auth/providers/credentials"
import bcrypt from "bcryptjs"
import { z } from "zod"
import authConfig from "./auth.config"

const prisma = new PrismaClient()

const LoginSchema = z.object({
    email: z.string().email(),
    password: z.string().min(1, "Password is required"),
});

export const {
    handlers,
    auth,
    signIn,
    signOut,
} = NextAuth({
    adapter: PrismaAdapter(prisma),
    session: { strategy: "jwt" },
    pages: {
        signIn: "/login",
    },
    ...authConfig,
    providers: [
        Credentials({
            async authorize(credentials) {
                const validatedFields = LoginSchema.safeParse(credentials);

                if (validatedFields.success) {
                    const { email, password } = validatedFields.data;

                    const user = await prisma.user.findUnique({
                        where: { email }
                    });

                    if (!user || !user.password) return null;

                    const passwordsMatch = await bcrypt.compare(
                        password,
                        user.password
                    );

                    if (passwordsMatch) return user;
                }

                return null;
            }
        })
    ],
    callbacks: {
        async session({ token, session }) {
            if (token.sub && session.user) {
                session.user.id = token.sub;
            }

            if (token.role && session.user) {
                session.user.role = token.role as any;
            }

            if (token.tenantId && session.user) {
                session.user.tenantId = token.tenantId as any;
            }

            if (token.profileId && session.user) {
                session.user.profileId = token.profileId as any;
            }

            if (token.tenantSlug && session.user) {
                session.user.tenantSlug = token.tenantSlug as any;
            }

            return session;
        },
        async jwt({ token }) {
            if (!token.sub) return token;

            const existingUser = await prisma.user.findUnique({
                where: { id: token.sub },
                include: { tenant: true }
            }) as any;

            if (!existingUser) return token;

            token.role = existingUser.role;
            token.tenantId = existingUser.tenantId;
            token.profileId = existingUser.profileId;
            token.tenantSlug = existingUser.tenant?.slug;

            return token;
        }
    }
})
