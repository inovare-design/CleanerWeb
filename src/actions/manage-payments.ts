"use server";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const CreatePaymentSchema = z.object({
    employeeId: z.string().uuid(),
    amount: z.coerce.number().positive(),
    type: z.enum(["SALARY", "TIP", "BONUS"]),
    notes: z.string().optional(),
});

export async function createEmployeePayment(formData: FormData) {
    const session = await auth();

    if (!session?.user || !["ADMIN", "SUPER_ADMIN"].includes(session.user.role as string)) {
        return { error: "Não autorizado." };
    }

    const tenantId = session.user.tenantId;
    if (!tenantId) return { error: "Tenant context missing." };

    const validatedFields = CreatePaymentSchema.safeParse({
        employeeId: formData.get("employeeId"),
        amount: formData.get("amount"),
        type: formData.get("type"),
        notes: formData.get("notes"),
    });

    if (!validatedFields.success) {
        return { error: "Campos inválidos." };
    }

    const { employeeId, amount, type, notes } = validatedFields.data;

    try {
        await db.employeePayment.create({
            data: {
                employeeId,
                amount,
                type,
                notes,
                tenantId,
            }
        });

        revalidatePath(`/admin/employees/${employeeId}`);
        return { success: "Pagamento registrado com sucesso!" };
    } catch (error) {
        console.error("Erro ao registrar pagamento:", error);
        return { error: "Falha ao registrar pagamento." };
    }
}
