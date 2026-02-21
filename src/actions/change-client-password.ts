"use server";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import bcrypt from "bcryptjs";

export async function changeClientPassword(formData: FormData) {
    const session = await auth();
    if (!session?.user?.id) return { error: "Não autenticado." };

    const currentPassword = formData.get("currentPassword") as string;
    const newPassword = formData.get("newPassword") as string;
    const confirmPassword = formData.get("confirmPassword") as string;

    if (!currentPassword || !newPassword || !confirmPassword) {
        return { error: "Preencha todos os campos." };
    }

    if (newPassword.length < 6) {
        return { error: "A nova senha deve ter pelo menos 6 caracteres." };
    }

    if (newPassword !== confirmPassword) {
        return { error: "As senhas não coincidem." };
    }

    try {
        const user = await db.user.findUnique({
            where: { id: session.user.id },
            select: { password: true }
        });

        if (!user?.password) return { error: "Usuário não encontrado." };

        const passwordMatch = await bcrypt.compare(currentPassword, user.password);
        if (!passwordMatch) {
            return { error: "Senha atual incorreta." };
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        await db.user.update({
            where: { id: session.user.id },
            data: { password: hashedPassword }
        });

        return { success: "Senha alterada com sucesso!" };
    } catch (error) {
        console.error("Erro ao alterar senha:", error);
        return { error: "Erro ao alterar senha." };
    }
}
