"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function toggleClientStatus(customerId: string, currentStatus: boolean) {
    try {
        const customer = await db.customer.update({
            where: { id: customerId },
            data: { active: !currentStatus },
            select: { userId: true, active: true },
        });

        revalidatePath(`/admin/customers/${customer.userId}`);
        revalidatePath("/admin/customers");
        return { success: "Status atualizado!", newStatus: customer.active };

    } catch (error) {
        console.error("Erro ao atualizar status:", error);
        return { error: "Erro interno." };
    }
}
