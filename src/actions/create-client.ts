"use server";

import { z } from "zod";
import { db } from "@/lib/db";
import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";

const CreateClientSchema = z.object({
    name: z.string().min(1, "Nome é obrigatório"),
    email: z.string().email("Email inválido"),
    phone: z.string().optional(),
    address: z.string().optional(),
    document: z.string().optional(),
    birthDate: z.string().optional(), // Recebe como string do form
    notes: z.string().optional(),
    // Property Details
    bedrooms: z.string().optional(),
    bathrooms: z.string().optional(),
    footage: z.string().optional(),
    accessInfo: z.string().optional(),
});

export async function createClient(formData: FormData) {
    const validatedFields = CreateClientSchema.safeParse({
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
    });

    if (!validatedFields.success) {
        return { error: "Campos inválidos. Verifique os dados." };
    }

    const { name, email, phone, address, document, birthDate, notes, bedrooms, bathrooms, footage, accessInfo } = validatedFields.data;

    try {
        // Verificar se email já existe
        const existingUser = await db.user.findUnique({
            where: { email },
        });

        if (existingUser) {
            return { error: "Email já cadastrado." };
        }

        const hashedPassword = await bcrypt.hash("mudar123", 10); // Senha padrão inicial

        // Criar Transaction para User + Customer Profile
        const result = await db.$transaction(async (tx: any) => {
            const tenant = await tx.tenant.findFirst(); // Pega o primeiro tenant (MVP)

            if (!tenant) throw new Error("Tenant não encontrado");

            const newUser = await tx.user.create({
                data: {
                    name,
                    email,
                    password: hashedPassword,
                    role: "CLIENT",
                    tenantId: tenant.id,
                    customerProfile: {
                        create: {
                            phone,
                            address,
                            // user: undefined removed
                            document,
                            birthDate: birthDate ? new Date(birthDate) : null,
                            notes,
                            // Property Details
                            bedrooms: bedrooms ? parseInt(bedrooms) : null,
                            bathrooms: bathrooms ? parseInt(bathrooms) : null,
                            footage,
                            accessInfo,
                            tenantId: tenant.id
                        }
                    }
                }
            });
            return newUser;
        });

        revalidatePath("/admin/customers");
        return { success: "Cliente cadastrado!", clientId: result.id };

    } catch (error: any) {
        console.error("Erro ao criar cliente:", error);
        return { error: `Erro: ${error.message || "Erro interno ao criar cliente."}` };
    }
}
