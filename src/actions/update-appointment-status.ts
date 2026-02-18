"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { AppointmentStatus } from "@prisma/client";

export async function updateAppointmentStatus(appointmentId: string, status: AppointmentStatus) {
    try {
        await db.appointment.update({
            where: { id: appointmentId },
            data: { status },
        });

        revalidatePath("/admin/appointments");
        return { success: "Status atualizado com sucesso!" };
    } catch (error) {
        console.error("Erro ao atualizar status:", error);
        return { error: "Erro ao atualizar status." };
    }
}
