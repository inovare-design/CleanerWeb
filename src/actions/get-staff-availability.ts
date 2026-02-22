"use server";

import { db } from "@/lib/db";
import { auth } from "@/auth";
import { startOfDay, endOfDay, format, parseISO } from "date-fns";

export async function getStaffAvailability(dateStr: string, region: string) {
    const session = await auth();
    if (!session?.user?.tenantId) {
        return { error: "Não autorizado" };
    }

    const tenantId = session.user.tenantId;
    const date = parseISO(dateStr);
    const dayOfWeek = date.getDay().toString(); // "0" for Sunday, "1" for Monday...

    try {
        // 1. Get Scheduling Config for the tenant
        const config = await db.schedulingConfig.findUnique({
            where: { tenantId }
        });

        if (!config) {
            return { error: "Configuração de agendamento não encontrada." };
        }

        const availabilityConfig = JSON.parse(config.availability || "{}");
        const dayRanges = availabilityConfig[dayOfWeek] || [];

        if (dayRanges.length === 0) {
            return { staff: [], message: "Não há expediente neste dia." };
        }

        // 2. Find employees serving this region
        const employees = await db.employee.findMany({
            where: {
                tenantId,
                servedAreas: {
                    has: region
                }
            },
            include: {
                user: {
                    select: {
                        name: true
                    }
                },
                appointments: {
                    where: {
                        startTime: {
                            gte: startOfDay(date),
                            lte: endOfDay(date)
                        },
                        status: {
                            notIn: ["CANCELLED"]
                        }
                    }
                }
            }
        });

        // 3. For each employee, calculate available slots
        // We simulate slots (e.g., every hour or 30 mins)
        // Simplified: Return the workday ranges and existing appointments so the UI can decide
        // OR: Calculate actual available slots for the UI.

        const result = employees.map((emp: any) => {
            const bookedRanges = emp.appointments.map((apt: any) => ({
                start: format(new Date(apt.startTime), "HH:mm"),
                end: format(new Date(apt.endTime), "HH:mm")
            }));

            return {
                id: emp.id,
                name: emp.user.name,
                color: emp.color,
                workday: dayRanges, // [{start: "08:00", end: "18:00"}]
                booked: bookedRanges
            };
        });

        return { staff: result };

    } catch (error) {
        console.error("Error fetching availability:", error);
        return { error: "Erro ao buscar disponibilidade." };
    }
}
