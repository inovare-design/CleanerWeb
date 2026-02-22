"use server";

import { z } from "zod";
import { db } from "@/lib/db";
import bcrypt from "bcryptjs";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";

const CreateClientSchema = z.object({
    name: z.string().min(1, "Nome é obrigatório"),
    email: z.string().email("Email inválido"),
    phone: z.string().optional(),
    address: z.string().optional(),
    city: z.string().optional(),
    zipCode: z.string().optional(),
    area: z.string().optional(),
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
        city: formData.get("city") || undefined,
        zipCode: formData.get("zipCode") || undefined,
        area: formData.get("area") || undefined,
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

    const { name, email, phone, address, city, zipCode, area, document, birthDate, notes, bedrooms, bathrooms, footage, accessInfo } = validatedFields.data;

    try {
        // Verificar se email já existe
        const existingUser = await db.user.findUnique({
            where: { email },
        });

        if (existingUser) {
            return { error: "Email já cadastrado." };
        }

        const hashedPassword = await bcrypt.hash("password123", 10);

        try {
            const session = await auth();
            const tenantId = session?.user?.tenantId;

            if (!tenantId) {
                return { error: "Tenant não encontrado na sessão. Tente sair e entrar novamente." };
            }

            // Criar Transaction para User + Customer Profile
            const result = await db.$transaction(async (tx: any) => {
                const newUser = await tx.user.create({
                    data: {
                        name,
                        email,
                        password: hashedPassword,
                        role: "CLIENT",
                        tenantId: tenantId,
                        customerProfile: {
                            create: {
                                phone,
                                address,
                                city,
                                zipCode,
                                area,
                                document,
                                birthDate: birthDate ? new Date(birthDate) : null,
                                notes,
                                bedrooms: bedrooms ? parseInt(bedrooms) : null,
                                bathrooms: bathrooms ? parseInt(bathrooms) : null,
                                footage,
                                accessInfo,
                                tenantId: tenantId
                            }
                        }
                    }
                });
                return newUser;
            });

            revalidatePath("/admin/customers");
            revalidatePath("/admin/appointments");
            revalidatePath("/admin/calendar");
            return { success: "Cliente cadastrado!", clientId: result.id };

        } catch (error: any) {
            console.error("Erro ao criar cliente:", error);
            return { error: `Erro: ${error.message || "Erro interno ao criar cliente."}` };
        }
    } catch (outerError: any) {
        console.error("Erro externo:", outerError);
        return { error: "Erro inesperado do servidor." };
    }
}
