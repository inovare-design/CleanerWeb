"use server";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const UpdateEmployeeProfileSchema = z.object({
    userId: z.string().uuid(),
    phone: z.string().optional(),
    color: z.string().min(4).max(7), // Hex code
    servedAreas: z.string().optional(),
});

export async function updateEmployeeProfile(formData: FormData) {
    const session = await auth();

    if (!session?.user || !["ADMIN", "SUPER_ADMIN"].includes(session.user.role as string)) {
        return { error: "Não autorizado." };
    }

    const validatedFields = UpdateEmployeeProfileSchema.safeParse({
        userId: formData.get("userId"),
        phone: formData.get("phone"),
        color: formData.get("color"),
        servedAreas: formData.get("servedAreas"),
    });

    if (!validatedFields.success) {
        return { error: "Campos inválidos." };
    }

    const { userId, phone, color, servedAreas } = validatedFields.data;

    try {
        await db.employee.update({
            where: { userId },
            data: {
                phone,
                color,
                servedAreas: servedAreas ? servedAreas.split(',').map(s => s.trim()).filter(Boolean) : [],
            }
        });

        revalidatePath(`/admin/employees/${userId}`);
        revalidatePath("/admin/employees");

        return { success: "Perfil atualizado com sucesso!" };
    } catch (error) {
        console.error("Erro ao atualizar perfil:", error);
        return { error: "Falha ao atualizar perfil." };
    }
}
