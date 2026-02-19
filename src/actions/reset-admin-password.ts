"use server";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";

export async function resetAdminPassword(userId: string, newPassword: string) {
    const session = await auth();

    if (!session?.user || (session.user.role as string) !== "SUPER_ADMIN") {
        throw new Error("Unauthorized");
    }

    try {
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        await db.user.update({
            where: { id: userId },
            data: {
                password: hashedPassword
            }
        });

        revalidatePath("/admin/settings");
        return { success: true };
    } catch (error) {
        console.error("Failed to reset password:", error);
        return { success: false, error: "Failed to reset password." };
    }
}
