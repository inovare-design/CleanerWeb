"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { AppointmentStatus } from "@prisma/client";
import { sendAppointmentNotification } from "@/lib/notifications";

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

        revalidatePath("/admin/appointments");
        revalidatePath("/admin/customers");

        // Disparar notificações de status
        if ((status as string) === "EN_ROUTE") {
            sendAppointmentNotification(appointmentId, "EN_ROUTE");
        } else if ((status as string) === "IN_PROGRESS") {
            sendAppointmentNotification(appointmentId, "STARTED");
        } else if ((status as string) === "COMPLETED") {
            sendAppointmentNotification(appointmentId, "FINISHED");
        }

        return { success: "Status atualizado com sucesso!" };
    } catch (error) {
        console.error("Erro ao atualizar status:", error);
        return { error: "Erro ao atualizar status." };
    }
}
