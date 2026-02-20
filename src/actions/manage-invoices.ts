"use server";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function updateInvoiceStatus(invoiceId: string, status: string) {
    const session = await auth();

    if (!session?.user || !["ADMIN", "SUPER_ADMIN"].includes(session.user.role as string)) {
        return { error: "Não autorizado." };
    }

    try {
        await db.invoice.update({
            where: { id: invoiceId },
            data: {
                status,
                paidAt: status === "PAID" ? new Date() : null
            }
        });

        revalidatePath("/admin/finance");
        return { success: "Status da fatura atualizado!" };
    } catch (error) {
        console.error("Erro ao atualizar fatura:", error);
        return { error: "Falha ao atualizar status da fatura." };
    }
}

export async function deleteInvoice(invoiceId: string) {
    const session = await auth();

    if (!session?.user || !["ADMIN", "SUPER_ADMIN"].includes(session.user.role as string)) {
        return { error: "Não autorizado." };
    }

    try {
        // Primeiro desconectamos os agendamentos relacionados
        await db.appointment.updateMany({
            where: { invoiceId },
            data: { invoiceId: null }
        });

        await db.invoice.delete({
            where: { id: invoiceId }
        });

        revalidatePath("/admin/finance");
        return { success: "Fatura removida com sucesso!" };
    } catch (error) {
        console.error("Erro ao deletar fatura:", error);
        return { error: "Falha ao remover fatura." };
    }
}

export async function createManualInvoice(customerId: string, appointmentIds: string[], dueDate: Date) {
    const session = await auth();

    if (!session?.user || !["ADMIN", "SUPER_ADMIN"].includes(session.user.role as string)) {
        return { error: "Não autorizado." };
    }

    try {
        const appointments = await db.appointment.findMany({
            where: { id: { in: appointmentIds }, customerId }
        });

        if (appointments.length === 0) {
            return { error: "Nenhum agendamento válido selecionado." };
        }

        const totalAmount = appointments.reduce((sum: number, apt: any) => sum + Number(apt.price), 0);

        const invoice = await db.invoice.create({
            data: {
                customerId,
                amount: totalAmount,
                dueDate,
                status: "OPEN",
                appointments: {
                    connect: appointments.map((apt: any) => ({ id: apt.id }))
                }
            }
        });

        revalidatePath("/admin/finance");
        return { success: "Fatura gerada com sucesso!", invoiceId: invoice.id };
    } catch (error) {
        console.error("Erro ao criar fatura manual:", error);
        return { error: "Falha ao gerar fatura." };
    }
}
