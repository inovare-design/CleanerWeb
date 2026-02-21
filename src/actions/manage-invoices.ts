"use server";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { createMolliePayment } from "@/lib/mollie";

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

export async function generateInvoicePaymentLink(invoiceId: string) {
    const session = await auth();

    if (!session?.user || !["ADMIN", "SUPER_ADMIN"].includes(session.user.role as string)) {
        return { error: "Não autorizado." };
    }

    try {
        const invoice = await db.invoice.findUnique({
            where: { id: invoiceId },
            include: { customer: { include: { tenant: true } } }
        });

        if (!invoice) return { error: "Fatura não encontrada." };
        if (!invoice.customer.tenant.idealId) return { error: "iDEAL não configurado nas definições da empresa." };

        const apiKey = invoice.customer.tenant.idealId;
        const amountStr = Number(invoice.amount).toFixed(2);
        const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";

        // Gerar link no Mollie
        const mollieResponse = await createMolliePayment(
            apiKey,
            amountStr,
            `Fatura #${invoice.id.split("-")[0].toUpperCase()} - ${invoice.customer.user.name}`,
            `${baseUrl}/invoice/${invoice.id}?status=success`,
            `${baseUrl}/api/webhooks/mollie`
        );

        // Atualizar fatura com o link e ID do Mollie
        await db.invoice.update({
            where: { id: invoiceId },
            data: {
                paymentLink: mollieResponse._links.checkout.href,
                mollieId: mollieResponse.id
            }
        });

        revalidatePath("/admin/finance");
        return { success: "Link de pagamento gerado!", link: mollieResponse._links.checkout.href };
    } catch (error: any) {
        console.error("Erro ao gerar link iDEAL:", error);
        return { error: `Erro iDEAL: ${error.message}` };
    }
}
