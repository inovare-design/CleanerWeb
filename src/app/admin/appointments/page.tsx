import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, MoreHorizontal, Calendar as CalendarIcon, MapPin, User, CheckCircle, Clock, XCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { db } from "@/lib/db";
import { CreateAppointmentModal } from "@/components/modals/create-appointment-modal";
import { SchedulingConfigModal } from "@/components/modals/scheduling-config-modal";
import { AppointmentActions } from "@/components/appointment-actions";

// Tipos auxiliares
import { AppointmentStatus } from "@prisma/client";

export const dynamic = 'force-dynamic';

async function getData(query: string, tenantId: string, sort: string = 'date', order: string = 'desc') {
    // Validar order
    const validOrder: 'asc' | 'desc' = order === 'asc' ? 'asc' : 'desc';

    // Definir ordenação do Prisma
    let orderBy: any = { startTime: validOrder };

    if (sort === 'customer') {
        orderBy = { customer: { user: { name: validOrder } } };
    } else if (sort === 'service') {
        orderBy = { service: { name: validOrder } };
    } else if (sort === 'employee') {
        orderBy = { employee: { user: { name: validOrder } } };
    } else if (sort === 'status') {
        orderBy = { status: validOrder };
    }

    // Buscar Agendamentos
    const appointments = await db.appointment.findMany({
        where: {
            tenantId,
            OR: [
                { customer: { user: { name: { contains: query, mode: 'insensitive' } } } },
                { service: { name: { contains: query, mode: 'insensitive' } } }
            ]
        },
        include: {
            customer: { include: { user: true } },
            employee: { include: { user: true } },
            service: true
        },
        orderBy
    });

    // Formatar appointments para remover Decimais (evitar erro de serialização no Client Component)
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
    const clients = await db.user.findMany({
        where: {
            role: "CLIENT",
            tenantId
        },
        include: { customerProfile: true },
        orderBy: { name: 'asc' }
    });

    const services = await db.service.findMany({
        where: { tenantId },
        orderBy: { name: 'asc' }
    });

    // Converter Decimal para number para passar ao Client Component
    const formattedServices = services.map((s: any) => ({
        ...s,
        price: Number(s.price)
    }));

    const employees = await db.user.findMany({
        where: {
            role: "CLEANER",
            tenantId
        },
        include: { employeeProfile: true },
        orderBy: { name: 'asc' }
    });

    const schedulingConfig = await db.schedulingConfig.findUnique({
        where: { tenantId }
    });

    // Converter decimais do config
    const formattedConfig = schedulingConfig ? {
        ...schedulingConfig,
        rateNormal: Number(schedulingConfig.rateNormal),
        rateNormal2: Number(schedulingConfig.rateNormal2),
        rateUrgent: Number(schedulingConfig.rateUrgent),
    } : null;

    return {
        appointments: formattedAppointments,
        clients,
        services: formattedServices,
        employees,
        schedulingConfig: formattedConfig
    };
}

const getStatusBadge = (status: AppointmentStatus) => {
    switch (status) {
        case "PENDING":
            return <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded-full flex items-center w-fit"><Clock className="w-3 h-3 mr-1" /> Pendente</span>;
        case "CONFIRMED":
            return <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full flex items-center w-fit"><CheckCircle className="w-3 h-3 mr-1" /> Confirmado</span>;
        case "COMPLETED":
            return <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full flex items-center w-fit"><CheckCircle className="w-3 h-3 mr-1" /> Concluído</span>;
        case "CANCELLED":
            return <span className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full flex items-center w-fit"><XCircle className="w-3 h-3 mr-1" /> Cancelado</span>;
        default:
            return <span className="bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded-full">{status}</span>;
    }
};

export default async function AppointmentsPage(props: {
    searchParams?: Promise<{
        q?: string;
        sort?: string;
        order?: string;
    }>;
}) {
    const session = await auth();
    if (!session) redirect("/login");

    const searchParams = await props.searchParams;
    const query = searchParams?.q || "";
    const sort = searchParams?.sort || "date";
    const order = searchParams?.order || "desc";

    // Garantir tenantId (fallback ou erro se não tiver)
    const tenantId = session.user.tenantId;
    if (!tenantId) return <div>Erro: Usuário sem tenant vinculado.</div>;

    try {
        const { appointments, clients, services, employees, schedulingConfig } = await getData(query, tenantId, sort, order);

        const getSortLink = (column: string) => {
            const nextOrder = (sort === column && order === 'asc') ? 'desc' : 'asc';
            const params = new URLSearchParams();
            if (query) params.set('q', query);
            params.set('sort', column);
            params.set('order', nextOrder);
            return `?${params.toString()}`;
        };

        const SortIndicator = ({ column }: { column: string }) => {
            if (sort !== column) return <Search className="w-3 h-3 ml-1 opacity-0 group-hover:opacity-50 inline" />;
            return order === 'asc' ? <Clock className="w-3 h-3 ml-1 inline text-blue-600" /> : <Clock className="w-3 h-3 ml-1 inline text-blue-600 rotate-180 transition-transform" />;
        };

        return (
            <div className="p-8 space-y-8 h-full flex flex-col">
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

                <Card className="flex-1 overflow-hidden flex flex-col border-violet-100 dark:border-violet-900/20">
                    <CardHeader className="border-b space-y-4 md:space-y-0 md:flex-row md:items-center md:justify-between p-6">
                        <div className="space-y-1.5">
                            <CardTitle>Agenda de Serviços</CardTitle>
                            <CardDescription>
                                {appointments.length} agendamentos registrados.
                            </CardDescription>
                        </div>
                        <div className="flex items-center space-x-2 w-full md:w-auto">
                            <form className="relative flex items-center gap-2">
                                <div className="relative">
                                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        name="q"
                                        defaultValue={searchParams?.q}
                                        className="pl-9 w-[250px]"
                                        placeholder="Buscar cliente ou serviço..."
                                    />
                                </div>
                                {sort !== 'date' && <input type="hidden" name="sort" value={sort} />}
                                {order !== 'desc' && <input type="hidden" name="order" value={order} />}
                                {(query || sort !== 'date' || order !== 'desc') && (
                                    <Button variant="ghost" size="sm" asChild className="text-xs h-9">
                                        <Link href="/admin/appointments">Limpar</Link>
                                    </Button>
                                )}
                            </form>
                        </div>
                    </CardHeader>
                    <CardContent className="p-0 flex-1 overflow-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="group cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors">
                                        <Link href={getSortLink('date')} className="flex items-center w-full h-full py-3">
                                            Data / Hora <SortIndicator column="date" />
                                        </Link>
                                    </TableHead>
                                    <TableHead className="group cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors">
                                        <Link href={getSortLink('customer')} className="flex items-center w-full h-full py-3">
                                            Cliente <SortIndicator column="customer" />
                                        </Link>
                                    </TableHead>
                                    <TableHead className="group cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors">
                                        <Link href={getSortLink('service')} className="flex items-center w-full h-full py-3">
                                            Serviço <SortIndicator column="service" />
                                        </Link>
                                    </TableHead>
                                    <TableHead className="group cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors">
                                        <Link href={getSortLink('employee')} className="flex items-center w-full h-full py-3">
                                            Funcionário <SortIndicator column="employee" />
                                        </Link>
                                    </TableHead>
                                    <TableHead className="group cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors">
                                        <Link href={getSortLink('status')} className="flex items-center w-full h-full py-3">
                                            Status <SortIndicator column="status" />
                                        </Link>
                                    </TableHead>
                                    <TableHead className="w-[80px]"></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {appointments.map((apt: any) => (
                                    <TableRow key={apt.id}>
                                        <TableCell>
                                            <div className="flex flex-col text-sm">
                                                <span className="font-medium flex items-center">
                                                    <CalendarIcon className="w-3 h-3 mr-1 text-muted-foreground" />
                                                    {new Date(apt.startTime).toLocaleDateString()}
                                                </span>
                                                <span className="text-xs text-muted-foreground ml-4">
                                                    {new Date(apt.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-col">
                                                <span className="font-medium">{apt.customer.user.name ?? "Cliente Desconhecido"}</span>
                                                <span className="text-xs text-muted-foreground flex items-center mt-0.5 truncate max-w-[150px]" title={apt.address}>
                                                    <MapPin className="w-3 h-3 mr-1" /> {apt.address}
                                                </span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <span className="text-sm">
                                                {apt.service.name}
                                            </span>
                                        </TableCell>
                                        <TableCell>
                                            {apt.employee ? (
                                                <div className="flex items-center">
                                                    <div
                                                        className="h-2 w-2 rounded-full mr-2"
                                                        style={{ backgroundColor: apt.employee.color || '#000' }}
                                                    />
                                                    <span className="text-sm">{apt.employee.user.name}</span>
                                                </div>
                                            ) : (
                                                <span className="text-xs text-muted-foreground italic">Não atribuído</span>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            {getStatusBadge(apt.status)}
                                        </TableCell>
                                        <TableCell>
                                            <AppointmentActions
                                                appointment={{
                                                    ...apt,
                                                    price: Number(apt.price),
                                                    service: {
                                                        ...apt.service,
                                                        price: Number(apt.service.price)
                                                    }
                                                }}
                                                clients={clients}
                                                services={services}
                                                employees={employees}
                                            />
                                        </TableCell>
                                    </TableRow>
                                ))}
                                {appointments.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={6} className="h-24 text-center">
                                            Nenhum agendamento encontrado.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>
        );
    } catch (error: any) {
        console.error("Appointments Page Error:", error);
        return (
            <div className="p-8">
                <Card className="border-red-200 bg-red-50">
                    <CardHeader>
                        <CardTitle className="text-red-600 italic font-black uppercase tracking-tight">Erro ao carregar agendamentos</CardTitle>
                        <CardDescription>Ocorreu um problema ao recuperar os dados da agenda.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="p-4 bg-white rounded border border-red-100 font-mono text-xs break-all text-red-800">
                            {error?.message || "Erro desconhecido"}
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }
}
