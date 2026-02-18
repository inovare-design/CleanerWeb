"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function confirmAppointment(appointmentId: string) {
    try {
        const appointment = await db.appointment.findUnique({
            where: { id: appointmentId },
            include: { customer: true }
        });

        if (!appointment) {
            return { error: "Agendamento não encontrado." };
        }

        const now = new Date();

        // 1. Marcar confirmação do cliente
        await db.appointment.update({
            where: { id: appointment.id },
            data: {
                clientConfirmationDate: now,
                status: "COMPLETED" // Garantir que está completo
            }
        });

        // 2. Lógica de Faturamento
        // Se for frequência "ONE_TIME" (Avulso), gera Invoice imediatamente.
        if (appointment.customer.frequency === "ONE_TIME") {
            await generateInvoiceForAppointment(appointment);
        } else {
            // Se for recorrente, não faz nada agora. 
            // O "Billing Job" (cron) rodará no dia de cobrança (billingDay) do cliente.
            console.log(`Agendamento ${appointmentId} confirmado. Faturamento será processado no dia ${appointment.customer.billingDay}.`);
        }

        revalidatePath(`/admin/appointments`);
        revalidatePath(`/admin/customers/${appointment.customer.userId}`);

        return { success: true };

    } catch (error) {
        console.error("Erro ao confirmar agendamento:", error);
        return { error: "Erro ao confirmar agendamento." };
    }
}

// Função auxiliar (pode ser movida para um arquivo separado de services)
async function generateInvoiceForAppointment(appointment: any) {
    // Verificar se já existe invoice
    if (appointment.invoiceId) return;

    // Criar Invoice
    const invoice = await db.invoice.create({
        data: {
            customerId: appointment.customerId,
            amount: appointment.price,
            dueDate: new Date(), // Vence hoje (imediato)
            status: "OPEN",
            appointments: {
                connect: { id: appointment.id }
            }
        }
    });

    // Atualizar agendamento com ID da invoice
    await db.appointment.update({
        where: { id: appointment.id },
        data: { invoiceId: invoice.id }
    });

    console.log(`Invoice gerada para agendamento ${appointment.id}: ${invoice.id}`);

    // TODO: Disparar integração de pagamento (Stripe/Pagar.me) aqui.
}
