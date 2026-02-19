"use server";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { Role } from "@prisma/client";
import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";

export async function createAdminUser(formData: FormData) {
    const session = await auth();

    if (!session?.user || (session.user.role as string) !== "SUPER_ADMIN") {
        throw new Error("Unauthorized");
    }

    const tenantId = session.user.tenantId;
    if (!tenantId) throw new Error("Tenant context not found.");

    const name = formData.get("name") as string;
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    const role = formData.get("role") as Role;

    if (!["ADMIN", "SUPER_ADMIN"].includes(role)) {
        throw new Error("Invalid role selection.");
    }

    try {
        const hashedPassword = await bcrypt.hash(password, 10);

        await db.user.create({
            data: {
                name,
                email,
                password: hashedPassword,
                role,
                tenantId
            }
        });

        revalidatePath("/admin/settings");
        return { success: true };
    } catch (error) {
        console.error("Failed to create admin:", error);
        return { success: false, error: "Email already in use or database error." };
    }
}

export async function deleteAdminUser(userId: string) {
    const session = await auth();

    if (!session?.user || (session.user.role as string) !== "SUPER_ADMIN") {
        throw new Error("Unauthorized");
    }

    // Protect against self-deletion
    if (session.user.id === userId) {
        throw new Error("You cannot delete your own account.");
    }

    try {
        await db.user.delete({
            where: { id: userId }
        });

        revalidatePath("/admin/settings");
        return { success: true };
    } catch (error) {
        console.error("Failed to delete admin:", error);
        return { success: false, error: "Failed to delete user." };
    }
}

export async function updateAdminRole(userId: string, newRole: Role) {
    const session = await auth();

    if (!session?.user || (session.user.role as string) !== "SUPER_ADMIN") {
        throw new Error("Unauthorized");
    }

    if (!["ADMIN", "SUPER_ADMIN"].includes(newRole)) {
        throw new Error("Invalid role.");
    }

    try {
        await db.user.update({
            where: { id: userId },
            data: { role: newRole }
        });

        revalidatePath("/admin/settings");
        return { success: true };
    } catch (error) {
        console.error("Failed to update role:", error);
        return { success: false, error: "Failed to update role." };
    }
}

