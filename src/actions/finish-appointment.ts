"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function finishAppointment(appointmentId: string, proofImages: string[], notes?: string) {
    try {
        const appointment = await db.appointment.findUnique({
            where: { id: appointmentId }
        });

        if (!appointment) return { error: "Agendamento não encontrado." };

        // Combinar notas antigas com as novas notas de finalização se existirem
        const finalNotes = notes
            ? `${appointment.notes || ""}\n\n[Finalização]: ${notes}`.trim()
            : appointment.notes;

        await db.appointment.update({
            where: { id: appointmentId },
            data: {
                status: "AWAITING_CONFIRMATION",
                cleanerConfirmationDate: new Date(),
                proofImages: proofImages,
                notes: finalNotes
            }
        });

        revalidatePath("/admin/appointments");
        revalidatePath("/admin/finance");

        return { success: true };

    } catch (error: any) {
        console.error("Erro ao finalizar agendamento:", error);
        return { error: `Erro ao finalizar: ${error.message}` };
    }
}
