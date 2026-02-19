"use server";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const CreateFeedbackSchema = z.object({
    toEmployeeId: z.string().uuid(),
    appointmentId: z.string().uuid().optional(),
    rating: z.coerce.number().min(1).max(5),
    comment: z.string().optional(),
    type: z.enum(["CLIENT_TO_EMPLOYEE", "TEAMMATE_RATING"]),
});

export async function submitFeedback(formData: FormData) {
    const session = await auth();

    if (!session?.user) {
        return { error: "Não autorizado." };
    }

    const tenantId = session.user.tenantId;
    if (!tenantId) return { error: "Tenant context missing." };

    const validatedFields = CreateFeedbackSchema.safeParse({
        toEmployeeId: formData.get("toEmployeeId"),
        appointmentId: formData.get("appointmentId") || undefined,
        rating: formData.get("rating"),
        comment: formData.get("comment"),
        type: formData.get("type"),
    });

    if (!validatedFields.success) {
        return { error: "Campos inválidos." };
    }

    const { toEmployeeId, appointmentId, rating, comment, type } = validatedFields.data;

    try {
        await db.feedback.create({
            data: {
                toEmployeeId,
                appointmentId,
                fromUserId: session.user.id as string,
                rating,
                comment,
                type,
                tenantId,
            }
        });

        revalidatePath(`/admin/employees/${toEmployeeId}`);
        return { success: "Avaliação enviada com sucesso!" };
    } catch (error) {
        console.error("Erro ao enviar avaliação:", error);
        return { error: "Falha ao enviar avaliação." };
    }
}
