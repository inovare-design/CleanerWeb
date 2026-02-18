"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function updateAppointmentTime(appointmentId: string, newStartTime: Date) {
    if (!appointmentId || !newStartTime) {
        return { error: "Dados inválidos" };
    }

    try {
        // 1. Get current appointment to calculate duration
        const appointment = await db.appointment.findUnique({
            where: { id: appointmentId },
            include: { service: true }
        });

        if (!appointment) return { error: "Agendamento não encontrado" };

        const durationMin = appointment.service.durationMin || 60;
        const newEndTime = new Date(newStartTime.getTime() + durationMin * 60000);

        // 2. Check overlap (Optional but good)
        // For now, let's allow overlapping but maybe warn? 
        // Or strict check? Let's be permissive for "Drag and Drop" flexibility initially.
        // But we should at least check if it's within working hours? No, let admin decide.

        /* 
        const hasConflict = await db.appointment.findFirst({
            where: {
                tenantId: appointment.tenantId,
                employeeId: appointment.employeeId, // Assuming resource doesn't change here, only time? 
                // Wait, if we drag to another resource column, employeeId changes!
                // We need to handle that too.
            }
        });
        */

        // 3. Update
        await db.appointment.update({
            where: { id: appointmentId },
            data: {
                startTime: newStartTime,
                endTime: newEndTime,
                // If we also support changing resource (employee), we need `employeeId` in args.
            }
        });

        revalidatePath("/admin/calendar");
        revalidatePath("/admin/appointments");

        return { success: true };

    } catch (error: any) {
        console.error("Erro ao mover agendamento:", error);
        return { error: "Erro ao atualizar horário" };
    }
}

export async function updateAppointmentResource(appointmentId: string, employeeId: string, newStartTime: Date) {
    if (!appointmentId || !employeeId || !newStartTime) {
        return { error: "Dados inválidos" };
    }

    try {
        const appointment = await db.appointment.findUnique({
            where: { id: appointmentId },
            include: { service: true }
        });

        if (!appointment) return { error: "Agendamento não encontrado" };

        const durationMin = appointment.service.durationMin || 60;
        const newEndTime = new Date(newStartTime.getTime() + durationMin * 60000);

        await db.appointment.update({
            where: { id: appointmentId },
            data: {
                employeeId: employeeId === "unassigned" ? null : employeeId,
                startTime: newStartTime,
                endTime: newEndTime,
            }
        });

        revalidatePath("/admin/calendar");

        return { success: true };

    } catch (error: any) {
        console.error("Erro ao mover agendamento:", error);
        return { error: "Erro ao atualizar recurso" };
    }
}
