"use server";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";

/**
 * Cancel an appointment. Enforces 24h cancellation policy.
 */
export async function cancelAppointment(appointmentId: string) {
    const session = await auth();
    if (!session?.user?.id) return { error: "Não autenticado." };

    const user = await db.user.findUnique({
        where: { id: session.user.id },
        include: { customerProfile: true }
    });

    if (!user?.customerProfile) return { error: "Perfil de cliente não encontrado." };

    const appointment = await db.appointment.findUnique({
        where: { id: appointmentId }
    });

    if (!appointment || appointment.customerId !== user.customerProfile.id) {
        return { error: "Agendamento não encontrado." };
    }

    if (appointment.status === "CANCELLED") {
        return { error: "Este agendamento já foi cancelado." };
    }

    if (appointment.status === "COMPLETED") {
        return { error: "Não é possível cancelar um serviço já concluído." };
    }

    // 24h rule check
    const now = new Date();
    const hoursUntilStart = (appointment.startTime.getTime() - now.getTime()) / (1000 * 60 * 60);

    if (hoursUntilStart < 24) {
        return {
            error: "POLICY_VIOLATION",
            message: "Não é possível cancelar com menos de 24 horas de antecedência. Para cancelamentos urgentes, entre em contato diretamente com nossa equipe."
        };
    }

    await db.appointment.update({
        where: { id: appointmentId },
        data: { status: "CANCELLED" }
    });

    revalidatePath("/app");
    revalidatePath("/app/appointments");
    revalidatePath(`/app/appointments/${appointmentId}`);
    return { success: "Agendamento cancelado com sucesso." };
}

/**
 * Reschedule an appointment to a new date and time.
 */
export async function rescheduleAppointment(
    appointmentId: string,
    newDate: string,
    newTime: string
) {
    const session = await auth();
    if (!session?.user?.id) return { error: "Não autenticado." };

    const user = await db.user.findUnique({
        where: { id: session.user.id },
        include: { customerProfile: true }
    });

    if (!user?.customerProfile) return { error: "Perfil de cliente não encontrado." };

    const appointment = await db.appointment.findUnique({
        where: { id: appointmentId },
        include: { service: true }
    });

    if (!appointment || appointment.customerId !== user.customerProfile.id) {
        return { error: "Agendamento não encontrado." };
    }

    if (["CANCELLED", "COMPLETED", "IN_PROGRESS", "EN_ROUTE"].includes(appointment.status)) {
        return { error: "Não é possível reagendar este serviço no estado atual." };
    }

    // Calculate new times
    const newStartTime = new Date(`${newDate}T${newTime}:00`);
    const durationMs = appointment.customDuration
        ? appointment.customDuration * 60 * 60 * 1000
        : appointment.service.durationMin * 60 * 1000;
    const newEndTime = new Date(newStartTime.getTime() + durationMs);

    if (newStartTime <= new Date()) {
        return { error: "A nova data deve ser no futuro." };
    }

    await db.appointment.update({
        where: { id: appointmentId },
        data: {
            startTime: newStartTime,
            endTime: newEndTime,
            status: "PENDING" // Reset to pending after reschedule
        }
    });

    revalidatePath("/app");
    revalidatePath("/app/appointments");
    revalidatePath(`/app/appointments/${appointmentId}`);
    return { success: "Agendamento reagendado com sucesso! Aguardando nova confirmação." };
}

/**
 * Update client-provided notes and images for an appointment.
 */
export async function updateClientDetails(
    appointmentId: string,
    clientNotes: string,
    clientImages: string[]
) {
    const session = await auth();
    if (!session?.user?.id) return { error: "Não autenticado." };

    const user = await db.user.findUnique({
        where: { id: session.user.id },
        include: { customerProfile: true }
    });

    if (!user?.customerProfile) return { error: "Perfil de cliente não encontrado." };

    const appointment = await db.appointment.findUnique({
        where: { id: appointmentId }
    });

    if (!appointment || appointment.customerId !== user.customerProfile.id) {
        return { error: "Agendamento não encontrado." };
    }

    if (["CANCELLED", "COMPLETED"].includes(appointment.status)) {
        return { error: "Não é possível alterar detalhes de um serviço finalizado." };
    }

    await db.appointment.update({
        where: { id: appointmentId },
        data: {
            clientNotes,
            clientImages
        }
    });

    revalidatePath(`/app/appointments/${appointmentId}`);
    return { success: "Detalhes atualizados com sucesso!" };
}
