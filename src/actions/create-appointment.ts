"use server";

import { z } from "zod";
import { db } from "@/lib/db";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";

const CreateAppointmentSchema = z.object({
    customerId: z.string().min(1, "Cliente é obrigatório"),
    serviceId: z.string().min(1, "Serviço é obrigatório"),
    employeeId: z.string().optional(), // Pode ser atribuído depois
    date: z.string().min(1, "Data é obrigatória"),
    time: z.string().min(1, "Hora é obrigatória"),
    address: z.string().min(1, "Endereço é obrigatório"),
    notes: z.string().optional(),
});

export async function createAppointment(formData: FormData) {
    const rawData = {
        customerId: formData.get("customerId"),
        serviceId: formData.get("serviceId"),
        employeeId: formData.get("employeeId") || undefined,
        date: formData.get("date"),
        time: formData.get("time"),
        address: formData.get("address"),
        notes: formData.get("notes") || undefined,
    };

    console.log("Create Appointment Raw Data:", rawData);

    const validatedFields = CreateAppointmentSchema.safeParse(rawData);

    if (!validatedFields.success) {
        console.error("Validation Errors:", validatedFields.error.flatten());
        return { error: `Preencha todos os campos obrigatórios. Erros: ${JSON.stringify(validatedFields.error.flatten().fieldErrors)}` };
    }

    const { customerId, serviceId, employeeId, date, time, address, notes } = validatedFields.data;

    try {
        const session = await auth();
        const tenantId = session?.user?.tenantId;
        if (!tenantId) throw new Error("Tenant não encontrado na sessão");

        // Buscar details do serviço para pegar o preço e duração
        const service = await db.service.findUnique({
            where: { id: serviceId }
        });

        if (!service) return { error: "Serviço não encontrado." };

        // Construir DateTime de Inicio
        const startTime = new Date(`${date}T${time}:00`);

        // Calcular Fim baseado na duração
        const endTime = new Date(startTime.getTime() + service.durationMin * 60000);

        // Buscar customer profile para verificar se existe (poderia pegar endereço de lá se vazio)
        // Mas vamos usar o endereço do form por enquanto.

        await db.appointment.create({
            data: {
                tenantId: tenantId,
                customerId,
                serviceId,
                employeeId: employeeId === "unassigned" ? null : employeeId, // Tratar 'sem funcionário'
                startTime,
                endTime,
                price: service.price, // Usa preço do serviço (podemos permitir override no futuro)
                status: "PENDING",
                address,
                notes
            },
        });

        revalidatePath("/admin/appointments");
        revalidatePath("/admin/calendar");
        return { success: "Agendamento criado com sucesso!" };

    } catch (error: any) {
        console.error("Erro ao criar agendamento:", error);
        return { error: `Erro interno: ${error.message}` };
    }
}
