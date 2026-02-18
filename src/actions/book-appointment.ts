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
    };

    const validatedFields = BookSchema.safeParse(rawData);

    if (!validatedFields.success) {
        return { error: "Preencha todos os campos obrigatórios." };
    }

    const { serviceId, employeeId, date, time, notes, address } = validatedFields.data;

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
        const endDateTime = new Date(startDateTime.getTime() + service.durationMin * 60000);

        // 4. Criar Agendamento
        await db.appointment.create({
            data: {
                startTime: startDateTime,
                endTime: endDateTime,
                price: service.price,
                status: "PENDING",
                notes: notes,
                address: address, // Usa o endereço do form (pode vir pré-preenchido do perfil)
                customerId: user.customerProfile.id,
                serviceId: service.id,
                tenantId: user.tenantId!, // Assumindo tenant vinculado ao usuário
                employeeId: employeeId && employeeId !== "any" ? employeeId : undefined
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
