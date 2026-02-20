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
    duration: z.string().optional(),
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
        duration: formData.get("duration") || undefined,
        address: formData.get("address"),
        notes: formData.get("notes") || undefined,
    };

    console.log("Create Appointment Raw Data:", rawData);

    const validatedFields = CreateAppointmentSchema.safeParse(rawData);

    if (!validatedFields.success) {
        console.error("Validation Errors:", validatedFields.error.flatten());
        return { error: `Preencha todos os campos obrigatórios. Erros: ${JSON.stringify(validatedFields.error.flatten().fieldErrors)}` };
    }

    const { customerId, serviceId, employeeId, date, time, duration: durationStr, address, notes } = validatedFields.data;

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

        let endTime: Date;
        let finalPrice = service.price;

        if (durationStr && durationStr !== "") {
            const durationMin = Number(durationStr);

            // Buscar config para validar mínimo (opcional, mas bom ter)
            const config = await db.schedulingConfig.findUnique({ where: { tenantId } });
            const finalDuration = Math.max(durationMin, config?.minDurationMin || 0);

            endTime = new Date(startTime.getTime() + finalDuration * 60000);
            finalPrice = Number(service.price) * (finalDuration / 60);
        } else {
            // Caso contrário, usamos a duração padrão do serviço
            endTime = new Date(startTime.getTime() + service.durationMin * 60000);
        }

        // Buscar customer profile para verificar frequência
        const customer = await db.customer.findUnique({
            where: { id: customerId }
        });

        if (!customer) return { error: "Cliente não encontrado." };

        const appointmentsToCreate = [];
        const baseStartTime = startTime;
        const baseEndTime = endTime;

        // Adicionar o primeiro agendamento (o que foi selecionado)
        appointmentsToCreate.push({
            tenantId: tenantId,
            customerId,
            serviceId,
            employeeId: employeeId === "unassigned" ? null : employeeId,
            startTime: baseStartTime,
            endTime: baseEndTime,
            price: finalPrice,
            status: "PENDING",
            address,
            notes
        });

        // Se for recorrente, gerar mais agendamentos para o mês (próximos 30 dias)
        if (customer.frequency !== 'ONE_TIME') {
            let intervalDays = 0;
            if (customer.frequency === 'WEEKLY') intervalDays = 7;
            if (customer.frequency === 'BIWEEKLY') intervalDays = 14;
            if (customer.frequency === 'MONTHLY') intervalDays = 30; // Aproximado ou poderíamos usar addMonths

            if (intervalDays > 0) {
                // Vamos gerar agendamentos para os próximos 35 dias para garantir que cubra o mês todo
                for (let i = 1; i <= 5; i++) {
                    const nextStart = new Date(baseStartTime.getTime() + (i * intervalDays * 24 * 60 * 60 * 1000));
                    const nextEnd = new Date(baseEndTime.getTime() + (i * intervalDays * 24 * 60 * 60 * 1000));

                    // Limitar a 35 dias do início original
                    if (nextStart.getTime() - baseStartTime.getTime() > 35 * 24 * 60 * 60 * 1000) break;

                    appointmentsToCreate.push({
                        tenantId: tenantId,
                        customerId,
                        serviceId,
                        employeeId: employeeId === "unassigned" ? null : employeeId,
                        startTime: nextStart,
                        endTime: nextEnd,
                        price: finalPrice,
                        status: "PENDING",
                        address,
                        notes
                    });
                }
            }
        }

        // Criar todos os agendamentos de uma vez (ou em loop se preferir transação/createMany)
        // Usando loop simples para compatibilidade e menor risco de erro com createMany em algumas versões do Prisma/Adapter
        for (const aptData of appointmentsToCreate) {
            await db.appointment.create({
                data: aptData
            });
        }

        revalidatePath("/admin/appointments");
        revalidatePath("/admin/calendar");
        return { success: "Agendamento criado com sucesso!" };

    } catch (error: any) {
        console.error("Erro ao criar agendamento:", error);
        return { error: `Erro interno: ${error.message}` };
    }
}
