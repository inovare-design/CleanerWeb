"use server";

import { db } from "@/lib/db";
import { sendAppointmentNotification } from "@/lib/notifications";
import { addDays, startOfDay, endOfDay } from "date-fns";

export async function runDailyReminders() {
    try {
        const tomorrow = addDays(new Date(), 1);
        const start = startOfDay(tomorrow);
        const end = endOfDay(tomorrow);

        // Encontrar agendamentos confirmados para amanhã
        const upcomingAppointments = await db.appointment.findMany({
            where: {
                startTime: {
                    gte: start,
                    lte: end
                },
                status: "CONFIRMED"
            },
            select: { id: true }
        });

        let sent = 0;
        for (const apt of upcomingAppointments) {
            const result = await sendAppointmentNotification(apt.id, "DAY_BEFORE");
            if (result.success) sent++;
        }

        return { success: true, count: sent };
    } catch (error) {
        console.error("Erro ao rodar lembretes diários:", error);
        return { error: "Falha ao processar lembretes." };
    }
}
