import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Clock, User, Briefcase } from "lucide-react";
import { format } from "date-fns";

export const dynamic = 'force-dynamic';

async function getTodayRoutes(tenantId: string) {
    const today = new Date();
    const startOfToday = new Date(today.setHours(0, 0, 0, 0));
    const endOfToday = new Date(today.setHours(23, 59, 59, 999));

    const appointments = await db.appointment.findMany({
        where: {
            tenantId,
            startTime: {
                gte: startOfToday,
                lte: endOfToday
            },
            status: {
                not: 'CANCELLED'
            }
        },
        include: {
            customer: { include: { user: true } },
            employee: { include: { user: true } },
            service: true
        },
        orderBy: {
            startTime: 'asc'
        }
    });

    // Agrupar por funcionário
    const routesByEmployee: Record<string, any> = {};

    appointments.forEach((apt: any) => {
        const empId = apt.employeeId || "unassigned";
        if (!routesByEmployee[empId]) {
            routesByEmployee[empId] = {
                employee: apt.employee || { user: { name: "Não Atribuído" } },
                appointments: []
            };
        }
        routesByEmployee[empId].appointments.push(apt);
    });

    return Object.values(routesByEmployee);
}

export default async function RoutesPage() {
    const session = await auth();
    if (!session) redirect("/login");

    const tenantId = session.user.tenantId;
    if (!tenantId) return <div className="p-8">Erro: Usuário sem tenant vinculado.</div>;

    const routes = await getTodayRoutes(tenantId);

    return (
        <div className="p-8 space-y-8 h-full flex flex-col animate-in fade-in duration-500">
            <div>
                <h2 className="text-3xl font-bold tracking-tight">Rotas em Tempo Real</h2>
                <p className="text-muted-foreground">
                    Logística e sequência de atendimentos para hoje, {format(new Date(), "dd/MM/yyyy")}.
                </p>
            </div>

            {routes.length === 0 ? (
                <Card className="border-dashed">
                    <CardContent className="flex flex-col items-center justify-center p-12 text-muted-foreground">
                        <MapPin className="w-12 h-12 mb-4 opacity-20" />
                        <p>Nenhum agendamento para as rotas de hoje.</p>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {routes.map((route: any, idx: number) => (
                        <Card key={idx} className="border-violet-100 dark:border-violet-900/20 shadow-sm overflow-hidden flex flex-col">
                            <CardHeader className="bg-slate-50 dark:bg-zinc-900/50 border-b p-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div
                                            className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-sm"
                                            style={{ backgroundColor: route.employee.employeeProfile?.color || '#8B5CF6' }}
                                        >
                                            {route.employee.user.name.substring(0, 2).toUpperCase()}
                                        </div>
                                        <div>
                                            <CardTitle className="text-sm font-bold">{route.employee.user.name}</CardTitle>
                                            <CardDescription className="text-[10px] uppercase font-semibold text-slate-500">
                                                {route.appointments.length} ATENDIMENTOS
                                            </CardDescription>
                                        </div>
                                    </div>
                                    <Badge variant="outline" className="bg-white dark:bg-zinc-950 font-bold">
                                        FILA {idx + 1}
                                    </Badge>
                                </div>
                            </CardHeader>
                            <CardContent className="p-0 flex-1">
                                <div className="relative">
                                    {/* Vertical Line */}
                                    <div className="absolute left-7 top-0 bottom-0 w-0.5 bg-slate-200 dark:bg-zinc-800 z-0" />

                                    <div className="divide-y divide-slate-100 dark:divide-zinc-800">
                                        {route.appointments.map((apt: any, aptIdx: number) => (
                                            <div key={apt.id} className="p-4 relative z-10 hover:bg-slate-50/50 dark:hover:bg-zinc-900/30 transition-colors">
                                                <div className="flex items-start gap-4">
                                                    <div className="flex flex-col items-center gap-1">
                                                        <div className="w-6 h-6 rounded-full bg-white dark:bg-zinc-950 border-2 border-slate-300 dark:border-zinc-700 flex items-center justify-center text-[10px] font-bold shadow-sm">
                                                            {aptIdx + 1}
                                                        </div>
                                                        <span className="text-[9px] font-bold text-slate-500 bg-slate-100 dark:bg-zinc-800 px-1 rounded">
                                                            {format(new Date(apt.startTime), "HH:mm")}
                                                        </span>
                                                    </div>
                                                    <div className="flex-1 space-y-2">
                                                        <div className="flex items-start justify-between">
                                                            <div>
                                                                <p className="text-sm font-bold leading-tight">{apt.customer.user.name}</p>
                                                                <p className="text-[11px] text-muted-foreground">{apt.service.name}</p>
                                                            </div>
                                                            {apt.customer?.frequency && apt.customer.frequency !== 'ONE_TIME' && (
                                                                <Badge variant="outline" className="h-4 text-[9px] px-1 bg-blue-50 text-blue-600 border-blue-100 uppercase">Fixo</Badge>
                                                            )}
                                                        </div>
                                                        <div className="flex items-center text-[11px] text-slate-600 dark:text-slate-400 gap-1 mt-1">
                                                            <MapPin className="w-3 h-3 text-red-400" />
                                                            <span className="truncate max-w-[180px]" title={apt.address}>{apt.address}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
