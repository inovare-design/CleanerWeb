"use server";

import { z } from "zod";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";

const CreateServiceSchema = z.object({
    name: z.string().min(1, "Nome é obrigatório"),
    description: z.string().optional(),
    price: z.string().transform((val) => Number(val.replace(",", "."))), // Aceita vírgula
    durationMin: z.coerce.number().min(1, "Duração deve ser maior que 0"),
});

export async function createService(formData: FormData) {
    const rawData = {
        name: formData.get("name"),
        description: formData.get("description"),
        price: formData.get("price"),
        durationMin: formData.get("durationMin"),
    };

    const validatedFields = CreateServiceSchema.safeParse(rawData);

    if (!validatedFields.success) {
        return { error: "Campos inválidos. Verifique preço e duração." };
    }

    const { name, description, price, durationMin } = validatedFields.data;

    try {
        const tenant = await db.tenant.findFirst(); // MVP: Single tenant logic for now
        if (!tenant) throw new Error("Tenant não encontrado");

        await db.service.create({
            data: {
                name,
                description,
                price,
                durationMin,
                tenantId: tenant.id,
            },
        });

        revalidatePath("/admin/services");
        return { success: "Serviço criado com sucesso!" };

    } catch (error) {
        console.error("Erro ao criar serviço:", error);
        return { error: "Erro interno ao criar serviço." };
    }
}
