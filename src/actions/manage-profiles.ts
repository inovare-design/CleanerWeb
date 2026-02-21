"use server";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function createPermissionProfile(formData: FormData) {
    const session = await auth();
    if (!session?.user?.tenantId || (session.user.role as string) !== "SUPER_ADMIN") {
        return { error: "Não autorizado." };
    }

    const name = formData.get("name") as string;
    const description = formData.get("description") as string;
    const type = formData.get("type") as "ADMIN" | "STAFF";
    const permissions = formData.getAll("permissions") as string[];

    if (!name) return { error: "O nome é obrigatório." };

    try {
        await db.permissionProfile.create({
            data: {
                name,
                description,
                type,
                permissions,
                tenantId: session.user.tenantId,
            }
        });

        revalidatePath("/admin/settings");
        return { success: "Perfil criado com sucesso!" };
    } catch (error) {
        console.error("Create Profile Error:", error);
        return { error: "Erro ao criar perfil. Verifique se o nome já existe." };
    }
}

export async function updatePermissionProfile(id: string, formData: FormData) {
    const session = await auth();
    if (!session?.user?.tenantId || (session.user.role as string) !== "SUPER_ADMIN") {
        return { error: "Não autorizado." };
    }

    const name = formData.get("name") as string;
    const description = formData.get("description") as string;
    const permissions = formData.getAll("permissions") as string[];

    if (!name) return { error: "O nome é obrigatório." };

    try {
        await db.permissionProfile.update({
            where: { id },
            data: {
                name,
                description,
                permissions,
            }
        });

        revalidatePath("/admin/settings");
        return { success: "Perfil atualizado com sucesso!" };
    } catch (error) {
        console.error("Update Profile Error:", error);
        return { error: "Erro ao atualizar perfil." };
    }
}

export async function deletePermissionProfile(id: string) {
    const session = await auth();
    if (!session?.user?.tenantId || (session.user.role as string) !== "SUPER_ADMIN") {
        return { error: "Não autorizado." };
    }

    try {
        const usersCount = await db.user.count({
            where: { profileId: id }
        });

        if (usersCount > 0) {
            return { error: "Este perfil não pode ser excluído pois existem usuários vinculados a ele." };
        }

        await db.permissionProfile.delete({
            where: { id }
        });

        revalidatePath("/admin/settings");
        return { success: "Perfil excluído com sucesso!" };
    } catch (error) {
        console.error("Delete Profile Error:", error);
        return { error: "Erro ao excluir perfil." };
    }
}
