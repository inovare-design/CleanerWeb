import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { CreateAppointmentModal } from "@/components/modals/create-appointment-modal";
import { SchedulingConfigModal } from "@/components/modals/scheduling-config-modal";
import { Button } from "@/components/ui/button";
import { AppointmentsTable } from "@/components/appointments-table";

// Forçamos renderização dinâmica para sempre ter dados frescos, 
// mas a interação (filtros/sort) será instantânea no client.
export const dynamic = 'force-dynamic';

async function getData(tenantId: string) {
    // Buscar Agendamentos (Todos para filtro no client)
    const appointments = await db.appointment.findMany({
        where: { tenantId },
        include: {
            customer: { include: { user: true } },
            employee: { include: { user: true } },
            service: true
        },
        orderBy: { startTime: 'desc' }
    });

    // Formatar appointments para remover Decimais (evitar erro de serialização)
    const formattedAppointments = appointments.map((apt: any) => ({
        ...apt,
        price: Number(apt.price),
        tipPrice: Number(apt.tipPrice),
        service: {
            ...apt.service,
            price: Number(apt.service.price)
        }
    }));

    // Buscar dados para o Modal de Criação (Dropdowns)
    const rawClients = await db.user.findMany({
        where: { role: "CLIENT", tenantId },
        include: { customerProfile: true },
        orderBy: { name: 'asc' }
    });

    // Modificando para usar o ID do perfil de cliente (customerId), não o ID do usuário
    const formattedClients = rawClients.map((u: any) => ({
        id: u.customerProfile?.id || u.id,
        name: u.name,
        email: u.email,
        customerProfile: u.customerProfile
    }));

    const services = await db.service.findMany({
        where: { tenantId },
        orderBy: { name: 'asc' }
    });

    const formattedServices = services.map((s: any) => ({
        ...s,
        price: Number(s.price)
    }));

    const employees = await db.user.findMany({
        where: { role: "CLEANER", tenantId },
        include: { employeeProfile: true },
        orderBy: { name: 'asc' }
    });

    const schedulingConfig = await db.schedulingConfig.findUnique({
        where: { tenantId }
    });

    const formattedConfig = schedulingConfig ? {
        ...schedulingConfig,
        rateNormal: Number(schedulingConfig.rateNormal),
        rateNormal2: Number(schedulingConfig.rateNormal2),
        rateUrgent: Number(schedulingConfig.rateUrgent),
    } : null;

    return {
        appointments: formattedAppointments,
        clients: formattedClients,
        services: formattedServices,
        employees,
        schedulingConfig: formattedConfig
    };
}

export default async function AppointmentsPage() {
    const session = await auth();
    if (!session) redirect("/login");

    const tenantId = session.user.tenantId;
    if (!tenantId) return <div className="p-8">Erro: Usuário sem tenant vinculado.</div>;

    try {
        const { appointments, clients, services, employees, schedulingConfig } = await getData(tenantId);

        return (
            <div className="p-8 space-y-8 h-full flex flex-col animate-in fade-in duration-500">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-3xl font-bold tracking-tight">Agendamentos</h2>
                        <p className="text-muted-foreground">
                            Gerencie as ordens de serviço e cronograma.
                        </p>
                    </div>
                    <div className="flex items-center space-x-2">
                        <SchedulingConfigModal initialConfig={schedulingConfig} />
                        <CreateAppointmentModal
                            clients={clients}
                            services={services}
                            employees={employees}
                            minDuration={schedulingConfig?.minDurationMin || 60}
                        />
                        <form action={async () => {
                            "use server";
                            const { checkAutoConfirmAppointments } = await import("@/actions/check-auto-confirm");
                            if (session?.user?.tenantId) {
                                await checkAutoConfirmAppointments(session.user.tenantId);
                            }
                        }}>
                            <Button variant="outline" size="sm" type="submit">
                                Check Auto-Confirm
                            </Button>
                        </form>
                    </div>
                </div>

                <AppointmentsTable
                    initialAppointments={appointments}
                    clients={clients}
                    services={services}
                    employees={employees}
                />
            </div>
        );
    } catch (error: any) {
        console.error("Appointments Page Error:", error);
        return (
            <div className="p-8">
                <div className="bg-red-50 border border-red-200 p-6 rounded-xl">
                    <h3 className="text-red-800 font-bold mb-2">Erro ao carregar agendamentos</h3>
                    <p className="text-red-600 text-sm">{error?.message || "Erro desconhecido"}</p>
                </div>
            </div>
        );
    }
}

