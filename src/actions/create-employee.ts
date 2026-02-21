"use server";

import { auth } from "@/auth";
import { z } from "zod";
import { db } from "@/lib/db";
import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";

const CreateEmployeeSchema = z.object({
    name: z.string().min(1, "Nome é obrigatório"),
    email: z.string().email("Email inválido"),
    password: z.string().min(6, "Senha deve ter pelo menos 6 caracteres"),
    phone: z.string().optional(),
    color: z.string().min(4, "Cor inválida"), // Hex code
});

export async function createEmployee(formData: FormData) {
    const session = await auth();

    if (!session?.user || !["ADMIN", "SUPER_ADMIN"].includes(session.user.role as string)) {
        throw new Error("Unauthorized");
    }

    const tenantId = session.user.tenantId;
    if (!tenantId) throw new Error("Tenant context not found.");

    const validatedFields = CreateEmployeeSchema.safeParse({
        name: formData.get("name"),
        email: formData.get("email"),
        password: formData.get("password"),
        phone: formData.get("phone"),
        color: formData.get("color"),
    });

    if (!validatedFields.success) {
        const errors = validatedFields.error.flatten().fieldErrors;
        const firstError = Object.values(errors).flat()[0];
        return { error: firstError || "Campos inválidos. Verifique os dados." };
    }

    const { name, email, password, phone, color } = validatedFields.data;
    const profileId = formData.get("profileId") as string;

    try {
        const existingUser = await db.user.findUnique({
            where: { email },
        });

        if (existingUser) {
            return { error: "Email já cadastrado." };
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        await db.user.create({
            data: {
                name,
                email,
                password: hashedPassword,
                role: "CLEANER",
                tenantId: tenantId,
                profileId: profileId === "DEFAULT" ? null : profileId,
                employeeProfile: {
                    create: {
                        phone,
                        color,
                        tenantId: tenantId
                    }
                }
            }
        });

        revalidatePath("/admin/employees");
        return { success: "Funcionário cadastrado com sucesso!" };

    } catch (error) {
        console.error("Erro ao criar funcionário:", error);
        return { error: "Erro interno ao criar funcionário." };
    }
}
