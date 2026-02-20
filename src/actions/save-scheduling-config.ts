"use server";

import { db } from "@/lib/db";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";

export async function saveSchedulingConfig(formData: FormData) {
    const session = await auth();
    if (!session || (session.user.role !== "ADMIN" && session.user.role !== "SUPER_ADMIN")) {
        return { error: "Não autorizado." };
    }

    try {
        const tenantId = session.user.tenantId;
        if (!tenantId) return { error: "Tenant não encontrado." };

        const availability = formData.get("availability") as string;
        const holidays = formData.get("holidays") as string;
        const rateNormal = formData.get("rateNormal");
        const rateNormal2 = formData.get("rateNormal2");
        const rateUrgent = formData.get("rateUrgent");
        const minDurationMin = formData.get("minDurationMin");

        const config = await db.schedulingConfig.upsert({
            where: { tenantId },
            create: {
                tenantId,
                availability,
                holidays,
                rateNormal: Number(rateNormal),
                rateNormal2: Number(rateNormal2),
                rateUrgent: Number(rateUrgent),
                minDurationMin: Number(minDurationMin),
            },
            update: {
                availability,
                holidays,
                rateNormal: Number(rateNormal),
                rateNormal2: Number(rateNormal2),
                rateUrgent: Number(rateUrgent),
                minDurationMin: Number(minDurationMin),
            }
        });

        revalidatePath("/admin/appointments");
        return { success: "Configurações salvas!" };

    } catch (error) {
        console.error("Erro ao salvar config:", error);
        return { error: "Erro ao salvar configurações." };
    }
}
