"use server";

import { db } from "@/lib/db";
import { subHours } from "date-fns";
import { revalidatePath } from "next/cache";
import { processConfirmedAppointment } from "./process-confirmed-appointment";

export async function checkAutoConfirmAppointments(tenantId: string) {
    if (!tenantId) return { error: "Tenant ID obrigatório" };

    try {
        // Limite: 3 horas atrás
        const cutOffTime = subHours(new Date(), 3);

        // Buscar agendamentos que estão AGUARDANDO CONFIRMAÇÃO
        // e que foram finalizados pela cleaner há mais de 3 horas.
        const appointmentsToAutoConfirm = await db.appointment.findMany({
            where: {
                tenantId,
                status: "AWAITING_CONFIRMATION",
                cleanerConfirmationDate: {
                    lt: cutOffTime
                }
            }
        });

        if (appointmentsToAutoConfirm.length === 0) {
            return { message: "Nenhum agendamento pendente de auto-confirmação." };
        }

        let processedCount = 0;

        // Processar cada um usando a nossa nova action financeira
        for (const apt of appointmentsToAutoConfirm) {
            const result = await processConfirmedAppointment(apt.id);
            if (result.success) {
                processedCount++;
            }
        }

        revalidatePath("/admin/appointments");
        revalidatePath("/admin/finance");

        return {
            success: true,
            count: processedCount,
            message: `${processedCount} agendamentos confirmados automaticamente após 3h.`
        };

    } catch (error: any) {
        console.error("Erro no auto-confirm:", error);
        return { error: `Erro ao processar auto-confirmação: ${error.message}` };
    }
}
