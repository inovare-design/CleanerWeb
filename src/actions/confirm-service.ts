"use server";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { processConfirmedAppointment } from "./process-confirmed-appointment";

export async function confirmService(formData: FormData) {
    const session = await auth();
    if (!session?.user?.id) return { error: "Não autenticado." };

    const appointmentId = formData.get("appointmentId") as string;
    const rating = parseInt(formData.get("rating") as string);
    const comment = (formData.get("comment") as string) || null;

    if (!appointmentId || !rating || rating < 1 || rating > 5) {
        return { error: "Dados inválidos." };
    }

    try {
        const user = await db.user.findUnique({
            where: { id: session.user.id },
            include: { customerProfile: true }
        });

        if (!user?.customerProfile) return { error: "Perfil não encontrado." };

        const appointment = await db.appointment.findUnique({
            where: { id: appointmentId },
            include: { employee: true }
        });

        if (!appointment) return { error: "Agendamento não encontrado." };
        if (appointment.customerId !== user.customerProfile.id) return { error: "Sem permissão." };
        if (appointment.status !== "AWAITING_CONFIRMATION" && appointment.status !== "COMPLETED") {
            return { error: "Este agendamento não está aguardando confirmação." };
        }

        // Create feedback
        if (appointment.employeeId) {
            await db.feedback.create({
                data: {
                    appointmentId,
                    fromUserId: session.user.id,
                    toEmployeeId: appointment.employeeId,
                    rating,
                    comment,
                    type: "CLIENT_TO_EMPLOYEE",
                    tenantId: appointment.tenantId,
                }
            });
        }

        // Update appointment status to COMPLETED + set confirmation date
        await db.appointment.update({
            where: { id: appointmentId },
            data: {
                status: "COMPLETED",
                clientConfirmationDate: new Date(),
            }
        });

        // Trigger invoicing logic (ONE_TIME = immediate invoice, Recurring = marked for billing job)
        await processConfirmedAppointment(appointmentId);

        revalidatePath(`/app/appointments/${appointmentId}`);
        revalidatePath("/app/appointments");
        revalidatePath("/app/invoices");
        return { success: "Serviço confirmado com sucesso! Obrigado pela avaliação." };
    } catch (error) {
        console.error("Erro ao confirmar serviço:", error);
        return { error: "Erro ao confirmar serviço." };
    }
}
