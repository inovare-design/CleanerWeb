"use server";

import { db } from "@/lib/db";

/**
 * Busca o último funcionário que atendeu este cliente para sugerir como preferencial.
 */
export async function getPreferredEmployee(customerId: string) {
    try {
        const lastAppointment = await db.appointment.findFirst({
            where: {
                customerId,
                status: "COMPLETED",
                employeeId: { not: null }
            },
            orderBy: {
                startTime: "desc"
            },
            select: {
                employeeId: true
            }
        });

        return { employeeId: lastAppointment?.employeeId || null };
    } catch (error) {
        console.error("Erro ao buscar funcionário preferencial:", error);
        return { employeeId: null };
    }
}
