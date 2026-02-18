"use server";

import { z } from "zod";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";

const UpdateClientSchema = z.object({
    id: z.string(),
    name: z.string().min(1, "Nome é obrigatório"),
    email: z.string().email("Email inválido"),
    phone: z.string().optional(),
    address: z.string().optional(),
    document: z.string().optional(),
    birthDate: z.string().optional(),
    notes: z.string().optional(),
    bedrooms: z.string().optional(),
    bathrooms: z.string().optional(),
    footage: z.string().optional(),
    accessInfo: z.string().optional(),
    type: z.enum(["PERSONAL", "BUSINESS"]).optional(),
    frequency: z.enum(["ONE_TIME", "WEEKLY", "BIWEEKLY", "MONTHLY"]).optional(),
    frequencyDetails: z.string().optional(),
    billingDay: z.string().optional(),
});

export async function updateClient(formData: FormData) {
    const validatedFields = UpdateClientSchema.safeParse({
        id: formData.get("id"),
        name: formData.get("name"),
        email: formData.get("email"),
        phone: formData.get("phone") || undefined,
        address: formData.get("address") || undefined,
        document: formData.get("document") || undefined,
        birthDate: formData.get("birthDate") || undefined,
        notes: formData.get("notes") || undefined,
        bedrooms: formData.get("bedrooms") || undefined,
        bathrooms: formData.get("bathrooms") || undefined,
        footage: formData.get("footage") || undefined,
        accessInfo: formData.get("accessInfo") || undefined,
        type: formData.get("type") || undefined,
        frequency: formData.get("frequency") || undefined,
        frequencyDetails: formData.get("frequencyDetails") || undefined,
    });

    if (!validatedFields.success) {
        return { error: "Campos inválidos. Verifique os dados." };
    }

    const { id, name, email, phone, address, document, birthDate, notes, bedrooms, bathrooms, footage, accessInfo, type, frequency, frequencyDetails, billingDay } = validatedFields.data;

    try {
        await db.$transaction(async (tx: any) => {
            // Atualizar User
            await tx.user.update({
                where: { id },
                data: {
                    name,
                    email,
                }
            });

            // Atualizar Customer Profile
            // Se não existir, cria. Se existir, atualiza.
            await tx.customer.upsert({
                where: { userId: id },
                create: {
                    userId: id,
                    tenantId: (await tx.tenant.findFirst()).id, // Fallback p/ MVP
                    phone,
                    address,
                    document,
                    birthDate: birthDate ? new Date(birthDate) : null,
                    notes,
                    bedrooms: bedrooms ? parseInt(bedrooms) : null,
                    bathrooms: bathrooms ? parseInt(bathrooms) : null,
                    footage,
                    accessInfo,
                    type: type as any,
                    frequency: frequency as any,
                    frequencyDetails,
                    billingDay: billingDay ? parseInt(billingDay) : null,
                },
                update: {
                    phone,
                    address,
                    document,
                    birthDate: birthDate ? new Date(birthDate) : null,
                    notes,
                    bedrooms: bedrooms ? parseInt(bedrooms) : null,
                    bathrooms: bathrooms ? parseInt(bathrooms) : null,
                    footage,
                    accessInfo,
                    type: type as any,
                    frequency: frequency as any,
                    frequencyDetails,
                    billingDay: billingDay ? parseInt(billingDay) : null,
                }
            });
        });

        revalidatePath(`/admin/customers/${id}`);
        revalidatePath("/admin/customers");
        return { success: "Cliente atualizado com sucesso!" };

    } catch (error: any) {
        console.error("Erro ao atualizar cliente:", error);
        return { error: `Erro: ${error.message || "Erro interno ao atualizar cliente."}` };
    }
}
