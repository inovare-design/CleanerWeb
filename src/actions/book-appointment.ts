"use server";

import { db } from "@/lib/db";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

const BookSchema = z.object({
    serviceId: z.string().min(1, "Selecione um serviço"),
    employeeId: z.string().optional(),
    date: z.string().min(1, "Selecione uma data"),
    time: z.string().min(1, "Selecione um horário"),
    notes: z.string().optional(),
    address: z.string().min(1, "Endereço é obrigatório"),
    warnings: z.string().optional(),
    priorityAreas: z.string().optional(),
    customDuration: z.string().optional(),
    region: z.string().optional()
});

export async function bookAppointment(formData: FormData) {
    const session = await auth();
    if (!session?.user?.id) {
        return { error: "Você precisa estar logado." };
    }

    const rawData = {
        serviceId: formData.get("serviceId"),
        employeeId: formData.get("employeeId"),
        date: formData.get("date"),
        time: formData.get("time"),
        notes: formData.get("notes"),
        address: formData.get("address"),
        warnings: formData.get("warnings"),
        priorityAreas: formData.get("priorityAreas"),
        customDuration: formData.get("customDuration"),
        region: formData.get("region"),
    };

    const validatedFields = BookSchema.safeParse(rawData);

    if (!validatedFields.success) {
        return { error: "Preencha todos os campos obrigatórios." };
    }

    const {
        serviceId,
        employeeId,
        date,
        time,
        notes,
        address,
        warnings,
        priorityAreas,
        customDuration,
        region
    } = validatedFields.data;

    try {
        // 1. Buscar o CustomerProfile do usuário logado
        const user = await db.user.findUnique({
            where: { id: session.user.id },
            include: { customerProfile: true }
        });

        if (!user?.customerProfile) {
            return { error: "Perfil de cliente não encontrado." };
        }

        // 2. Buscar detalhes do serviço (Preço e Duração)
        const service = await db.service.findUnique({
            where: { id: serviceId }
        });

        if (!service) {
            return { error: "Serviço não encontrado." };
        }

        // 3. Calcular StartTime e EndTime
        // Date string: YYYY-MM-DD, Time string: HH:MM
        const startDateTime = new Date(`${date}T${time}:00`);

        // Se houver duração customizada, usa ela (conversão de horas para ms)
        // Caso contrário, usa a duração padrão do serviço (minutos para ms)
        const durationMs = customDuration
            ? parseInt(customDuration) * 60 * 60 * 1000
            : service.durationMin * 60 * 1000;

        const endDateTime = new Date(startDateTime.getTime() + durationMs);

        // 4. Criar Agendamento
        await db.appointment.create({
            data: {
                startTime: startDateTime,
                endTime: endDateTime,
                price: service.price,
                status: "PENDING",
                notes: notes,
                address: address,
                warnings: warnings,
                priorityAreas: priorityAreas,
                customDuration: customDuration ? parseInt(customDuration) : undefined,
                customerId: user.customerProfile.id,
                serviceId: service.id,
                tenantId: user.tenantId!,
                employeeId: employeeId && employeeId !== "any" ? employeeId : undefined
            }
        });

        // 5. Atualizar Perfil do Cliente com a região e endereço se houver algo novo
        await db.customer.update({
            where: { id: user.customerProfile.id },
            data: {
                area: region || undefined,
                address: address || undefined,
            }
        });

        revalidatePath("/app");
        revalidatePath("/app/appointments");
        return { success: "Agendamento solicitado com sucesso!" };

    } catch (error) {
        console.error("Erro ao agendar:", error);
        return { error: "Erro interno no servidor." };
    }
}
