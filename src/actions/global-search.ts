"use server";

import { db } from "@/lib/db";
import { auth } from "@/auth";

export async function globalSearch(query: string) {
    const session = await auth();
    if (!session || !session.user.tenantId) {
        throw new Error("Unauthorized");
    }

    if (!query || query.length < 2) return [];

    const tenantId = session.user.tenantId;
    const searchTerm = query.toLowerCase();

    // Perform parallel searches
    const [customers, employees, services, appointments] = await Promise.all([
        db.customer.findMany({
            where: {
                tenantId,
                OR: [
                    { user: { name: { contains: searchTerm, mode: 'insensitive' } } },
                    { user: { email: { contains: searchTerm, mode: 'insensitive' } } },
                    { phone: { contains: searchTerm } }
                ]
            },
            include: { user: true },
            take: 5
        }),
        db.employee.findMany({
            where: {
                tenantId,
                user: { name: { contains: searchTerm, mode: 'insensitive' } }
            },
            include: { user: true },
            take: 5
        }),
        db.service.findMany({
            where: {
                tenantId,
                name: { contains: searchTerm, mode: 'insensitive' }
            },
            take: 5
        }),
        db.appointment.findMany({
            where: {
                tenantId,
                OR: [
                    { customer: { user: { name: { contains: searchTerm, mode: 'insensitive' } } } },
                    { address: { contains: searchTerm, mode: 'insensitive' } }
                ]
            },
            include: {
                customer: { include: { user: true } },
                service: true
            },
            take: 5,
            orderBy: { startTime: 'desc' }
        })
    ]);

    const results: any[] = [];

    customers.forEach((c: any) => results.push({
        id: c.id,
        title: c.user.name,
        subtitle: c.user.email,
        type: "Cliente",
        href: `/admin/customers/${c.id}`
    }));

    employees.forEach((e: any) => results.push({
        id: e.id,
        title: e.user.name,
        subtitle: "Equipe",
        type: "Funcionário",
        href: `/admin/employees/${e.id}`
    }));

    services.forEach((s: any) => results.push({
        id: s.id,
        title: s.name,
        subtitle: `R$ ${s.price}`,
        type: "Serviço",
        href: `/admin/services`
    }));

    appointments.forEach((a: any) => results.push({
        id: a.id,
        title: a.customer.user.name,
        subtitle: `${new Date(a.startTime).toLocaleDateString()} - ${a.service.name}`,
        type: "Agendamento",
        href: `/admin/appointments`
    }));

    return results;
}
