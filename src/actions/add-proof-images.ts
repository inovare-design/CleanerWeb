"use server";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function addProofImages(appointmentId: string, imageUrls: string[]) {
    const session = await auth();
    if (!session?.user?.id) return { error: "Não autenticado." };

    if (!appointmentId || !imageUrls.length) {
        return { error: "Dados inválidos." };
    }

    try {
        const appointment = await db.appointment.findUnique({
            where: { id: appointmentId },
            select: { proofImages: true, employeeId: true }
        });

        if (!appointment) return { error: "Agendamento não encontrado." };

        // Verify the user is the assigned employee
        const employee = await db.employee.findUnique({
            where: { userId: session.user.id }
        });

        if (!employee || employee.id !== appointment.employeeId) {
            return { error: "Sem permissão." };
        }

        // Append new images to existing ones
        await db.appointment.update({
            where: { id: appointmentId },
            data: {
                proofImages: [...appointment.proofImages, ...imageUrls]
            }
        });

        revalidatePath("/cleaner");
        revalidatePath(`/app/appointments/${appointmentId}`);
        return { success: "Fotos adicionadas com sucesso!" };
    } catch (error) {
        console.error("Erro ao adicionar fotos:", error);
        return { error: "Erro ao adicionar fotos." };
    }
}
