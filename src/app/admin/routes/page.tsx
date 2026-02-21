import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, Clock, User, Briefcase, Navigation } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

export const dynamic = 'force-dynamic';

async function getTodayRoutes(tenantId: string) {
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
            name: emp.user.name,
            color: emp.color,
            latitude: emp.latitude,
            longitude: emp.longitude,
            lastLocationUpdate: emp.lastLocationUpdate
        },
        appointments: emp.appointments
    })).filter((route: any) => route.appointments.length > 0 || route.employee.latitude !== null);
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
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[calc(100vh-250px)]">
                    {/* Lista Lateral de Rotas */}
                    <div className="lg:col-span-4 overflow-y-auto space-y-4 pr-2">
                        {routes.map((route: any, idx: number) => (
                            <Card key={idx} className="border-violet-100 dark:border-violet-900/20 shadow-sm overflow-hidden flex flex-col">
                                <CardHeader className="bg-slate-50 dark:bg-zinc-900/50 border-b p-3">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div
                                                className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-xs shadow-sm"
                                                style={{ backgroundColor: route.employee.color || '#8B5CF6' }}
                                            >
                                                {route.employee.name.substring(0, 2).toUpperCase()}
                                            </div>
                                            <div>
                                                <CardTitle className="text-sm font-bold">{route.employee.name}</CardTitle>
                                                <div className="flex items-center gap-1">
                                                    <div className={cn(
                                                        "h-1.5 w-1.5 rounded-full",
                                                        route.employee.latitude ? "bg-emerald-500 animate-pulse" : "bg-zinc-300"
                                                    )} />
                                                    <span className="text-[9px] uppercase font-bold text-slate-400">
                                                        {route.employee.latitude ? "Localização Ativa" : "Offline"}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="p-0">
                                    <div className="divide-y divide-slate-100 dark:divide-zinc-800">
                                        {route.appointments.map((apt: any, aptIdx: number) => (
                                            <div key={apt.id} className="p-3 hover:bg-slate-50/50 dark:hover:bg-zinc-900/30 transition-colors">
                                                <div className="flex items-center gap-3">
                                                    <div className="text-[10px] font-bold text-slate-400 w-8">
                                                        {format(new Date(apt.startTime), "HH:mm")}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-xs font-bold truncate">{apt.customer.user.name}</p>
                                                        <p className="text-[10px] text-muted-foreground truncate">{apt.service.name}</p>
                                                    </div>
                                                    <Badge className={cn(
                                                        "text-[8px] px-1 h-3.5",
                                                        apt.status === "EN_ROUTE" && "bg-amber-100 text-amber-700",
                                                        apt.status === "IN_PROGRESS" && "bg-emerald-100 text-emerald-700",
                                                        apt.status === "COMPLETED" && "bg-zinc-100 text-zinc-600"
                                                    )}>
                                                        {apt.status === "CONFIRMED" && "Pendente"}
                                                        {apt.status === "EN_ROUTE" && "A Caminho"}
                                                        {apt.status === "IN_PROGRESS" && "Iniciado"}
                                                        {apt.status === "COMPLETED" && "OK"}
                                                    </Badge>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>

                    {/* Area do Mapa (Placeholder) */}
                    <div className="lg:col-span-8 flex flex-col gap-4">
                        <Card className="flex-1 bg-zinc-100 dark:bg-zinc-900 border-2 border-dashed relative overflow-hidden group">
                            <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-8">
                                <div className="w-20 h-20 bg-white dark:bg-zinc-800 rounded-full shadow-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                                    <Navigation className="w-10 h-10 text-blue-600" />
                                </div>
                                <h3 className="text-xl font-bold mb-2">Google Maps em Tempo Real</h3>
                                <p className="text-sm text-muted-foreground max-w-sm">
                                    Integrando com Google Maps para visualização de rotas e ETAs automáticos.
                                </p>
                                <div className="mt-8 grid grid-cols-2 gap-4 w-full max-w-md">
                                    <div className="bg-white dark:bg-zinc-800 p-4 rounded-xl shadow-sm border text-left">
                                        <div className="flex items-center gap-2 mb-2">
                                            <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                                            <span className="text-[10px] font-black uppercase tracking-widest">Ativo Agora</span>
                                        </div>
                                        <p className="text-2xl font-black">{routes.filter((r: any) => r.employee.latitude).length}</p>
                                        <p className="text-xs text-muted-foreground">Staff online</p>
                                    </div>
                                    <div className="bg-white dark:bg-zinc-800 p-4 rounded-xl shadow-sm border text-left">
                                        <div className="flex items-center gap-2 mb-2">
                                            <div className="h-2 w-2 rounded-full bg-blue-500" />
                                            <span className="text-[10px] font-black uppercase tracking-widest">Em Serviço</span>
                                        </div>
                                        <p className="text-2xl font-black">{routes.reduce((acc: number, r: any) => acc + r.appointments.filter((a: any) => a.status === 'IN_PROGRESS').length, 0)}</p>
                                        <p className="text-xs text-muted-foreground">Agendamentos ativos</p>
                                    </div>
                                </div>
                            </div>

                            {/* Decorative generic map pattern */}
                            <div className="absolute inset-0 opacity-[0.03] pointer-events-none select-none">
                                <div className="w-full h-full bg-[url('https://www.google.com/maps/vt/pb=!1m4!1m3!1i1!2i0!3i0!2m3!1e0!2sm!3i420120488!3m8!2spt-BR!3sUS!5e1105!12m4!1e68!2m2!1sset!2sRoadmap!4e0!5m1!1e0!23i4111425')] bg-repeat" />
                            </div>
                        </Card>

                        <div className="flex items-center justify-between text-[11px] font-medium text-muted-foreground px-2">
                            <div className="flex gap-4">
                                <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-emerald-500" /> Staff em deslocamento</span>
                                <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-blue-500" /> Staff trabalhando</span>
                                <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-zinc-300" /> Staff offline</span>
                            </div>
                            <Button variant="outline" size="sm" className="h-7 text-[10px] font-bold uppercase">Configurar API Maps</Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
