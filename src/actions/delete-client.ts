"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function deleteClient(customerId: string) {
    try {
        // Find the user associated with the customer
        const customer = await db.customer.findUnique({
            where: { id: customerId },
            select: { userId: true }
        });

        if (!customer) {
            return { error: "Cliente não encontrado." };
        }

        // Delete the user (this will cascade delete the customer profile if configured, 
        // otherwise we delete both in a transaction)
        await db.$transaction([
            db.appointment.deleteMany({ where: { customerId } }),
            db.customer.delete({ where: { id: customerId } }),
            db.user.delete({ where: { id: customer.userId } }),
        ]);

        revalidatePath("/admin/customers");
        return { success: "Cliente excluído com sucesso!" };

    } catch (error) {
        console.error("Erro ao excluir cliente:", error);
        return { error: "Erro ao excluir cliente. Verifique se existem agendamentos vinculados." };
    }
}
