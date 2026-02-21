import { Role } from "@prisma/client";
import NextAuth, { DefaultSession } from "next-auth";

export type ExtendedUser = DefaultSession["user"] & {
    role: Role;
    tenantId: string | null;
    tenantSlug?: string;
    profileId?: string | null;
};

declare module "next-auth" {
    interface Session {
        user: ExtendedUser;
    }
}

declare module "next-auth/jwt" {
    interface JWT {
        role: Role;
        tenantId: string | null;
        tenantSlug?: string;
        profileId?: string | null;
    }
}
