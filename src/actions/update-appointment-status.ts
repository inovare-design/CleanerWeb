"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { AppointmentStatus } from "@prisma/client";

export async function updateAppointmentStatus(appointmentId: string, status: AppointmentStatus) {
    try {
        const updateData: any = { status };

        // Se estiver indo para aguardando confirmação, registra o horário da cleaner
        if ((status as string) === "AWAITING_CONFIRMATION") {
            updateData.cleanerConfirmationDate = new Date();
        }

        await db.appointment.update({
            where: { id: appointmentId },
            data: updateData,
        });

        // Se o status for COMPLETED (confirmado manualmente pelo admin/cliente),
        // poderíamos disparar o processamento financeiro aqui, 
        // mas vamos criar uma action separada para maior controle.

        revalidatePath("/admin/appointments");
        revalidatePath("/admin/customers");
        return { success: "Status atualizado com sucesso!" };
    } catch (error) {
        console.error("Erro ao atualizar status:", error);
        return { error: "Erro ao atualizar status." };
    }
}
