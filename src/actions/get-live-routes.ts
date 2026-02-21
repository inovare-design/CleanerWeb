"use server";

import { db } from "@/lib/db";
import { auth } from "@/auth";

export async function getLiveRoutes() {
    const session = await auth();
    if (!session || !session.user.tenantId) {
        throw new Error("Unauthorized");
    }

    const tenantId = session.user.tenantId;
    const today = new Date();
    const startOfToday = new Date(today.setHours(0, 0, 0, 0));
    const endOfToday = new Date(today.setHours(23, 59, 59, 999));

    const employees = await db.employee.findMany({
        where: { tenantId },
        include: {
            user: true,
            appointments: {
                where: {
                    startTime: {
                        gte: startOfToday,
                        lte: endOfToday
                    },
                    status: { not: 'CANCELLED' }
                },
                include: {
                    customer: { include: { user: true } },
                    service: true
                },
                orderBy: { startTime: 'asc' }
            }
        }
    });

    return employees.map((emp: any) => ({
        employee: {
            id: emp.id,
            name: emp.user?.name || "Desconhecido",
            color: emp.color,
            latitude: emp.latitude,
            longitude: emp.longitude,
            lastLocationUpdate: emp.lastLocationUpdate
        },
        appointments: emp.appointments.map((apt: any) => ({
            id: apt.id,
            startTime: apt.startTime.toISOString(),
            endTime: apt.endTime.toISOString(),
            status: apt.status,
            customerName: apt.customer?.user?.name || "Cliente sem nome",
            serviceName: apt.service?.name || "Serviço sem nome",
            address: apt.address,
        }))
    })).filter((route: any) => route.appointments.length > 0 || route.employee.latitude !== null);
}
