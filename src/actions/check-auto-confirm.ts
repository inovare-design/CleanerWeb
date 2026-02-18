"use server";

import { db } from "@/lib/db";
import { subHours } from "date-fns";
import { revalidatePath } from "next/cache";

export async function checkAutoConfirmAppointments(tenantId: string) {
    if (!tenantId) return { error: "Tenant ID obrigatório" };

    try {
        // Data limite: agora - 3 horas
        const cutOffTime = subHours(new Date(), 3);

        // Buscar agendamentos PENDENTES criados antes do limite
        // Nota: Assumindo que queremos confirmar agendamentos criados há mais de 3h
        // Se a lógica for "3h antes do início", mudaria a query.

        // Vamos assumir a lógica: "Se criado há mais de 3h e ainda pendente -> Confirma"
        const appointmentsToConfirm = await db.appointment.findMany({
            where: {
                tenantId,
                status: "PENDING",
                createdAt: {
                    lt: cutOffTime
                }
            }
        });

        if (appointmentsToConfirm.length === 0) {
            return { message: "Nenhum agendamento para confirmar." };
        }

        const count = appointmentsToConfirm.length;

        // Atualizar todos para CONFIRMED
        await db.appointment.updateMany({
            where: {
                tenantId,
                status: "PENDING",
                createdAt: {
                    lt: cutOffTime
                }
            },
            data: {
                status: "CONFIRMED"
            }
        });

        revalidatePath("/admin/appointments");
        return { success: true, count, message: `${count} agendamentos confirmados automaticamente.` };

    } catch (error: any) {
        console.error("Erro no auto-confirm:", error);
        return { error: `Erro ao processar: ${error.message}` };
    }
}
