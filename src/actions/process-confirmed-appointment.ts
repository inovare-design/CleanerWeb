"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";

/**
 * Esta função é chamada quando um serviço é "Efetivado" 
 * (seja por confirmação manual do cliente ou auto-confirmação após 3h)
 */
export async function processConfirmedAppointment(appointmentId: string) {
    try {
        // 1. Buscar o agendamento com dados do cliente
        const appointment = await db.appointment.findUnique({
            where: { id: appointmentId },
            include: {
                customer: true,
                service: true
            }
        });

        if (!appointment) return { error: "Agendamento não encontrado." };

        // 2. Atualizar status para COMPLETED e marcar data de confirmação se ainda não tiver
        await db.appointment.update({
            where: { id: appointmentId },
            data: {
                status: "COMPLETED",
                clientConfirmationDate: appointment.clientConfirmationDate || new Date()
            }
        });

        const customer = appointment.customer;

        // 3. Lógica Financeira diferenciada
        if (customer.frequency === "ONE_TIME") {
            // CENÁRIO AVULSO: Gerar cobrança imediata e marcar como PAGA
            // (Assumindo que em um mundo real aqui haveria integração com gateway)
            await db.invoice.create({
                data: {
                    customerId: customer.id,
                    amount: Number(appointment.price),
                    status: "PAID",
                    paidAt: new Date(),
                    dueDate: new Date(),
                    appointments: {
                        connect: { id: appointment.id }
                    }
                }
            });
            console.log(`Faturamento Avulso: Invoice PAGA gerada para agendamento ${appointmentId}`);
        } else {
            // CENÁRIO RECORRENTE: Apenas garantimos que o agendamento está COMPLETED
            // O job de faturamento recorrente (run-recurring-billing.ts) cuidará do resto
            console.log(`Faturamento Recorrente: Agendamento ${appointmentId} validado para próximo ciclo.`);
        }

        revalidatePath("/admin/finance");
        revalidatePath("/admin/appointments");
        revalidatePath(`/admin/customers/${customer.userId}`);

        return { success: true };

    } catch (error: any) {
        console.error("Erro ao processar confirmação financeira:", error);
        return { error: `Erro financeiro: ${error.message}` };
    }
}
