"use server";

import { z } from "zod";
import { db } from "@/lib/db";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";

const UpdateAppointmentSchema = z.object({
    id: z.string().min(1),
    customerId: z.string().min(1, "Cliente é obrigatório"),
    serviceId: z.string().min(1, "Serviço é obrigatório"),
    employeeId: z.string().optional(),
    date: z.string().min(1, "Data é obrigatória"),
    time: z.string().min(1, "Hora é obrigatória"),
    address: z.string().min(1, "Endereço é obrigatório"),
    notes: z.string().optional(),
    status: z.enum(["PENDING", "CONFIRMED", "EN_ROUTE", "IN_PROGRESS", "AWAITING_CONFIRMATION", "COMPLETED", "CANCELLED"]).optional(),
});

export async function updateAppointment(formData: FormData) {
    const rawData = {
        id: formData.get("id"),
        customerId: formData.get("customerId"),
        serviceId: formData.get("serviceId"),
        employeeId: formData.get("employeeId") || undefined,
        date: formData.get("date"),
        time: formData.get("time"),
        address: formData.get("address"),
        notes: formData.get("notes") || undefined,
        status: formData.get("status") || undefined,
    };

    const validatedFields = UpdateAppointmentSchema.safeParse(rawData);

    if (!validatedFields.success) {
        console.error("Update Validation Errors:", validatedFields.error.flatten());
        return { error: "Erro na validação dos dados." };
    }

    const { id, customerId, serviceId, employeeId, date, time, address, notes, status } = validatedFields.data;

    try {
        const session = await auth();
        const tenantId = session?.user?.tenantId;
        if (!tenantId) throw new Error("Tenant não encontrado na sessão");

        // Recalculate end time if service changed or time changed
        const service = await db.service.findUnique({
            where: { id: serviceId }
        });

        if (!service) return { error: "Serviço não encontrado." };

        const startTime = new Date(`${date}T${time}:00`);
        const endTime = new Date(startTime.getTime() + service.durationMin * 60000);

        await db.appointment.update({
            where: { id, tenantId: tenantId },
            data: {
                customerId,
                serviceId,
                employeeId: employeeId === "unassigned" ? null : employeeId,
                startTime,
                endTime,
                address,
                notes,
                status: status as any, // Cast validation handled by zod roughly, prisma handles enum
            },
        });

        revalidatePath("/admin/appointments");
        return { success: "Agendamento atualizado com sucesso!" };

    } catch (error) {
        console.error("Erro ao atualizar agendamento:", error);
        return { error: "Erro interno ao atualizar." };
    }
}
