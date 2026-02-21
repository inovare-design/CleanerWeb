import { db } from "@/lib/db";
import { NextResponse } from "next/server";
import { getMolliePayment } from "@/lib/mollie";

export async function POST(req: Request) {
    try {
        const formData = await req.formData();
        const paymentId = formData.get("id") as string;

        if (!paymentId) {
            return new Response("Missing ID", { status: 400 });
        }

        // 1. Encontrar a fatura pelo mollieId
        const invoice = await db.invoice.findFirst({
            where: { mollieId: paymentId },
            include: { customer: { include: { tenant: true } } }
        });

        if (!invoice || !invoice.customer.tenant.idealId) {
            return new Response("Invoice or API key not found", { status: 404 });
        }

        // 2. Verificar status real no Mollie
        const molliePayment = await getMolliePayment(
            invoice.customer.tenant.idealId,
            paymentId
        );

        // 3. Se pago, atualizar banco de dados
        if (molliePayment.status === "paid") {
            await db.invoice.update({
                where: { id: invoice.id },
                data: {
                    status: "PAID",
                    paidAt: new Date()
                }
            });
            console.log(`Webhook: Fatura ${invoice.id} marcada como PAGA.`);
        }

        return new Response("OK", { status: 200 });
    } catch (error) {
        console.error("Webhook Error:", error);
        return new Response("Error", { status: 500 });
    }
}
