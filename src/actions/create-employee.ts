"use server";

import { z } from "zod";
import { db } from "@/lib/db";
import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";

const CreateEmployeeSchema = z.object({
    name: z.string().min(1, "Nome é obrigatório"),
    email: z.string().email("Email inválido"),
    phone: z.string().optional(),
    color: z.string().min(4, "Cor inválida"), // Hex code
});

export async function createEmployee(formData: FormData) {
    const validatedFields = CreateEmployeeSchema.safeParse({
        name: formData.get("name"),
        email: formData.get("email"),
        phone: formData.get("phone"),
        color: formData.get("color"),
    });

    if (!validatedFields.success) {
        return { error: "Campos inválidos. Verifique os dados." };
    }

    const { name, email, phone, color } = validatedFields.data;

    try {
        // Verificar se email já existe
        const existingUser = await db.user.findUnique({
            where: { email },
        });

        if (existingUser) {
            return { error: "Email já cadastrado." };
        }

        const hashedPassword = await bcrypt.hash("mudar123", 10); // Senha padrão

        // Criar Transaction para User + Employee Profile
        await db.$transaction(async (tx: any) => {
            const tenant = await tx.tenant.findFirst(); // Pega o primeiro tenant (MVP)

            if (!tenant) throw new Error("Tenant não encontrado");

            await tx.user.create({
                data: {
                    name,
                    email,
                    password: hashedPassword,
                    role: "CLEANER",
                    tenantId: tenant.id,
                    employeeProfile: {
                        create: {
                            phone,
                            color,
                            tenantId: tenant.id
                        }
                    }
                }
            });
        });

        revalidatePath("/admin/employees");
        return { success: "Funcionário cadastrado com sucesso!" };

    } catch (error) {
        console.error("Erro ao criar funcionário:", error);
        return { error: "Erro interno ao criar funcionário." };
    }
}
