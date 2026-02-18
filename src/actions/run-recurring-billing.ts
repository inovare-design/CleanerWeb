"use server";

import { db } from "@/lib/db";

// Esta função seria idealmente chamada por uma CRON job diária (ex: Vercel Cron)
export async function runRecurringBillingJob() {
    const today = new Date();
    const currentDay = today.getDate(); // 1-31

    console.log(`Iniciando job de faturamento recorrente para o dia ${currentDay}...`);

    try {
        // 1. Buscar clientes que têm o billingDay de hoje
        const customersToBill = await db.customer.findMany({
            where: {
                billingDay: currentDay,
                active: true,
                frequency: { not: "ONE_TIME" } // Apenas recorrentes
            },
            include: {
                appointments: {
                    where: {
                        status: "COMPLETED",
                        invoiceId: null, // Ainda não faturados
                        clientConfirmationDate: { not: null } // Apenas confirmados (ou auto-confirmados)
                    }
                }
            }
        });

        let invoicesGenerated = 0;

        for (const customer of customersToBill) {
            if (customer.appointments.length === 0) continue;

            // Calcular total
            const totalAmount = customer.appointments.reduce((sum, apt) => {
                return sum + Number(apt.price);
            }, 0);

            // Criar Invoice Consolidada
            const invoice = await db.invoice.create({
                data: {
                    customerId: customer.id,
                    amount: totalAmount,
                    dueDate: today, // Vencimento hoje
                    status: "OPEN",
                    appointments: {
                        connect: customer.appointments.map(apt => ({ id: apt.id }))
                    }
                }
            });

            invoicesGenerated++;
            console.log(`Invoice consolidada gerada para cliente ${customer.userId}: ${invoice.id} (${customer.appointments.length} itens)`);
        }

        return { success: true, invoicesGenerated };

    } catch (error) {
        console.error("Erro no job de faturamento:", error);
        return { error: "Falha ao processar faturamento recorrente." };
    }
}
