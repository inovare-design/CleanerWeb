import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { CalendarShell } from "@/components/calendar/calendar-shell";

export const metadata = {
    title: "Calendário da Equipe | CleanRoute",
    description: "Gerencie a programação da equipe.",
};

async function getData(tenantId: string) {
    // 1. Fetch Appointments (Maybe limit range in future, currently fetching all active/pending for simplicity in demo)
    // Ideally we would accept ?month=... params to filter DB query.
    const appointments = await db.appointment.findMany({
        where: {
            tenantId,
            status: { not: "CANCELLED" }
        },
        include: {
            customer: { include: { user: true } },
            service: true,
            employee: { include: { user: true } }
        }
    });

    // 2. Fetch Employees
    const employeesData = await db.employee.findMany({
        where: { tenantId },
        include: { user: true }
    });

    const employees = employeesData.map((e: any) => ({
        id: e.id,
        name: e.user?.name || "Funcionário", // Use user.name
        color: e.color || "#8b5cf6"
    }));

    const formattedAppointments = appointments.map(apt => ({
        ...apt,
        price: Number(apt.price),
        service: { ...apt.service, price: Number(apt.service.price) }
    }));

    return { appointments: formattedAppointments, employees };
}

export default async function CalendarPage() {
    const session = await auth();
    if (!session) redirect("/login");
    const tenantId = session.user.tenantId;
    if (!tenantId) return <div>Erro: Tenant não encontrado.</div>;

    const { appointments, employees } = await getData(tenantId);

    const clients = await db.customer.findMany({
        where: { tenantId },
        include: {
            user: true,
        }
    });
    const services = await db.service.findMany({
        where: { tenantId }
    });

    const formattedServices = services.map((s: any) => ({
        id: s.id,
        name: s.name,
        price: Number(s.price)
    }));

    // Transform clients for the modal (needs name/email flatten if needed, or component handles it)
    // The modal expects: { id, name, email, customerProfile }
    const formattedClients = clients.map((c: any) => ({
        id: c.id,
        name: c.user.name,
        email: c.user.email,
        customerProfile: c // The customer object itself IS the profile data
    }));

    return (
        <div className="h-[calc(100vh-4rem)] p-4">
            <CalendarShell
                appointments={appointments}
                employees={employees}
                clients={formattedClients}
                services={formattedServices}
            />
        </div>
    );
}
