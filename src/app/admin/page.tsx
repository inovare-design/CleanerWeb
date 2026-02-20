import { auth } from "@/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Calendar, DollarSign, Users, Activity, ShieldAlert, BadgeCheck } from "lucide-react";
import { db } from "@/lib/db";
import { startOfDay, endOfDay, startOfMonth, endOfMonth, subMonths, format, subDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { RevenueChart } from "@/components/dashboard-charts";
import { CreateServiceModal } from "@/components/modals/create-service-modal";

/**
 * Busca dados reais do banco para o Admin.
 * Otimizado com Promise.all para performance.
 */
async function getDashboardData(tenantId: string) {
    const today = new Date();
    const startOfToday = startOfDay(today);
    const endOfToday = endOfDay(today);
    const startOfThisMonth = startOfMonth(today);
    const endOfThisMonth = endOfMonth(today);
    const startOfLastMonth = startOfMonth(subMonths(today, 1));
    const endOfLastMonth = endOfMonth(subMonths(today, 1));
    const sevenDaysAgo = subDays(today, 7);

    const [
        appointmentsToday,
        pendingToday,
        cancelledToday,
        monthlyRevenueResult,
        lastMonthRevenueResult,
        activeClients,
        newCustomersThisWeek,
        totalCleaners,
        cleanersWithAppointmentsToday,
        recentAppointments,
        totalAppointmentsEver
    ] = await Promise.all([
        db.appointment.count({
            where: { tenantId, startTime: { gte: startOfToday, lte: endOfToday } },
        }),
        db.appointment.count({
            where: { tenantId, status: "PENDING", startTime: { gte: startOfToday, lte: endOfToday } },
        }),
        db.appointment.count({
            where: { tenantId, status: "CANCELLED", startTime: { gte: startOfToday, lte: endOfToday } },
        }),
        db.appointment.aggregate({
            where: { tenantId, status: "COMPLETED", startTime: { gte: startOfThisMonth, lte: endOfThisMonth } },
            _sum: { price: true },
        }),
        db.appointment.aggregate({
            where: { tenantId, status: "COMPLETED", startTime: { gte: startOfLastMonth, lte: endOfLastMonth } },
            _sum: { price: true },
        }),
        db.customer.count({
            where: { tenantId, active: true },
        }),
        db.customer.count({
            where: {
                tenantId,
                user: {
                    createdAt: { gte: sevenDaysAgo }
                }
            },
        }),
        db.employee.count({
            where: { tenantId },
        }),
        db.employee.count({
            where: {
                tenantId,
                appointments: {
                    some: {
                        startTime: { gte: startOfToday, lte: endOfToday }
                    }
                }
            },
        }),
        db.appointment.findMany({
            where: { tenantId },
            take: 5,
            orderBy: { startTime: 'desc' },
            include: {
                customer: { include: { user: true } },
                service: true,
            },
        }),
        db.appointment.count({
            where: { tenantId },
        })
    ]);

    const monthlyRevenue = Number(monthlyRevenueResult._sum.price || 0);
    const lastMonthRevenue = Number(lastMonthRevenueResult._sum.price || 0);
    const revenueGrowth = lastMonthRevenue > 0
        ? ((monthlyRevenue - lastMonthRevenue) / lastMonthRevenue) * 100
        : (monthlyRevenue > 0 ? 100 : 0);

    // Dados do gráfico dos últimos 6 meses
    const chartPromises = [];
    for (let i = 5; i >= 0; i--) {
        const monthDate = subMonths(today, i);
        chartPromises.push(
            db.appointment.aggregate({
                where: {
                    tenantId,
                    status: "COMPLETED",
                    startTime: { gte: startOfMonth(monthDate), lte: endOfMonth(monthDate) },
                },
                _sum: { price: true },
            }).then((rev: { _sum: { price: number | null } }) => ({
                label: format(monthDate, "MMM", { locale: ptBR }),
                value: Number(rev._sum.price || 0),
            }))
        );
    }
    const chartData = await Promise.all(chartPromises);

    return {
        appointmentsToday,
        pendingToday,
        cancelledToday,
        monthlyRevenue,
        revenueGrowth,
        activeClients,
        newCustomersThisWeek,
        totalCleaners,
        cleanersOnlineToday: cleanersWithAppointmentsToday,
        recentAppointments,
        chartData,
        totalAppointmentsEver
    };
}

export default async function AdminDashboardPage() {
    const session = await auth();
    const tenantId = session?.user?.tenantId;

    if (!tenantId) {
        return (
            <div className="p-8">
                <Card className="border-red-200 bg-red-50">
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-2 text-red-600 font-bold">
                            <ShieldAlert className="w-5 h-5" />
                            Sessão expirada ou Tenant não configurado.
                        </div>
                        <p className="text-sm text-red-500 mt-1">Por favor, saia e entre novamente no sistema.</p>
                    </CardContent>
                </Card>
            </div>
        );
    }

    try {
        const data = await getDashboardData(tenantId);

        const getStatusColor = (status: string) => {
            switch (status) {
                case "CONFIRMED": return "text-emerald-500 bg-emerald-50 dark:bg-emerald-950/30";
                case "PENDING": return "text-amber-500 bg-amber-50 dark:bg-amber-950/30";
                case "COMPLETED": return "text-blue-500 bg-blue-50 dark:bg-blue-950/30";
                case "CANCELLED": return "text-red-500 bg-red-50 dark:bg-red-950/30";
                default: return "text-gray-500 bg-gray-50 dark:bg-zinc-800";
            }
        };

        return (
            <div className="p-8 space-y-8 animate-in fade-in duration-500">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-4xl font-black tracking-tight text-zinc-900 dark:text-zinc-100 italic uppercase">Dashboard</h1>
                        <p className="text-muted-foreground mt-1">
                            Bem-vindo ao centro de comando, <span className="font-bold text-zinc-800 dark:text-zinc-200">{session?.user?.name || "Admin"}</span>! 👋
                        </p>
                    </div>

                    {/* Quick Actions */}
                    <div className="flex items-center gap-2">
                        <CreateServiceModal />
                        <Button variant="outline" className="text-xs font-bold border-zinc-200 dark:border-zinc-800" asChild>
                            <Link href="/admin/appointments">Agendamentos</Link>
                        </Button>
                        <Button variant="outline" className="text-xs font-bold border-zinc-200 dark:border-zinc-800" asChild>
                            <Link href="/admin/employees">Equipe</Link>
                        </Button>
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <Card className="shadow-sm border-0 bg-white dark:bg-zinc-900 ring-1 ring-zinc-200 dark:ring-zinc-800 relative overflow-hidden group">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-xs font-black uppercase tracking-[0.15em] text-muted-foreground">Agendamentos Hoje</CardTitle>
                            <Calendar className="h-4 w-4 text-violet-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-black">{data.appointmentsToday}</div>
                            <p className="text-[10px] font-medium text-muted-foreground mt-1">
                                {data.cancelledToday > 0 ? `+${data.cancelledToday} cancelados` : "Tudo em dia!"}
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="shadow-sm border-0 bg-white dark:bg-zinc-900 ring-1 ring-zinc-200 dark:ring-zinc-800 relative overflow-hidden group">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-xs font-black uppercase tracking-[0.15em] text-muted-foreground">Receita Mensal</CardTitle>
                            <DollarSign className="h-4 w-4 text-emerald-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-black">
                                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(data.monthlyRevenue)}
                            </div>
                            <p className="text-[10px] font-medium text-muted-foreground mt-1">
                                {data.revenueGrowth > 0 ? `+${data.revenueGrowth.toFixed(1)}% em relação ao mês anterior` : "0% de crescimento"}
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="shadow-sm border-0 bg-white dark:bg-zinc-900 ring-1 ring-zinc-200 dark:ring-zinc-800 relative overflow-hidden group">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-xs font-black uppercase tracking-[0.15em] text-muted-foreground">Clientes Ativos</CardTitle>
                            <Users className="h-4 w-4 text-orange-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-black">+{data.activeClients}</div>
                            <p className="text-[10px] font-medium text-muted-foreground mt-1">+{data.newCustomersThisWeek} novos esta semana</p>
                        </CardContent>
                    </Card>

                    <Card className="shadow-sm border-0 bg-white dark:bg-zinc-900 ring-1 ring-zinc-200 dark:ring-zinc-800 relative overflow-hidden group">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-xs font-black uppercase tracking-[0.15em] text-muted-foreground">Cleaners Online</CardTitle>
                            <Activity className="h-4 w-4 text-blue-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-black">{data.cleanersOnlineToday}</div>
                            <p className="text-[10px] font-medium text-muted-foreground mt-1">de {data.totalCleaners} registrados</p>
                        </CardContent>
                    </Card>
                </div>

                {/* Charts & Recent Activities */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                    <Card className="col-span-4 shadow-sm border-0 bg-white dark:bg-zinc-900 ring-1 ring-zinc-200 dark:ring-zinc-800">
                        <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle className="text-lg font-bold">Visão Geral</CardTitle>
                        </CardHeader>
                        <CardContent className="h-[300px] pt-10">
                            <RevenueChart data={data.chartData} />
                        </CardContent>
                    </Card>

                    <Card className="col-span-3 shadow-sm border-0 bg-white dark:bg-zinc-900 ring-1 ring-zinc-200 dark:ring-zinc-800 flex flex-col">
                        <CardHeader>
                            <CardTitle className="text-lg font-bold">Últimos Agendamentos</CardTitle>
                        </CardHeader>
                        <CardContent className="flex-1">
                            <div className="space-y-6">
                                {data.recentAppointments.length > 0 ? (
                                    data.recentAppointments.map((apt: any) => (
                                        <div key={apt.id} className="flex items-center group hover:bg-zinc-50 dark:hover:bg-zinc-800/50 p-2 rounded-lg transition-colors cursor-default">
                                            <div className="space-y-1">
                                                <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100 group-hover:text-blue-600 transition-colors">{apt.customer.user.name}</p>
                                                <p className="text-[10px] font-medium text-muted-foreground uppercase flex items-center gap-1">
                                                    <span className="text-blue-500 font-bold">{apt.service.name}</span>
                                                    <span className="opacity-30">•</span>
                                                    {format(apt.startTime, "dd MMM, HH:mm", { locale: ptBR })}
                                                </p>
                                            </div>
                                            <div className={`ml-auto text-[10px] font-black px-2 py-0.5 rounded-full ring-1 ring-inset ${getStatusColor(apt.status).replace('bg-emerald-50', 'ring-emerald-500/20 bg-emerald-50/50').replace('bg-amber-50', 'ring-amber-500/20 bg-amber-50/50').replace('bg-blue-50', 'ring-blue-500/20 bg-blue-50/50').replace('bg-red-50', 'ring-red-500/20 bg-red-50/50')}`}>
                                                {apt.status === "CONFIRMED" ? "Confirmado" :
                                                    apt.status === "PENDING" ? "Pendente" :
                                                        apt.status === "COMPLETED" ? "Concluído" :
                                                            apt.status === "CANCELLED" ? "Cancelado" : apt.status}
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-center py-12 text-muted-foreground">
                                        <Activity className="w-8 h-8 mx-auto mb-2 opacity-20" />
                                        <p className="text-sm">Nenhum agendamento recente.</p>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                        <div className="p-4 border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/30">
                            <Button variant="ghost" className="w-full text-xs font-bold text-zinc-500 hover:text-zinc-900" asChild>
                                <Link href="/admin/appointments">Ver histórico completo</Link>
                            </Button>
                        </div>
                    </Card>
                </div>

                {/* Technical Information Section (PROVE it's real data) */}
                <Card className="border-dashed border-2 bg-zinc-50 dark:bg-zinc-950/50 opacity-40 hover:opacity-100 transition-opacity">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-xs font-bold flex items-center gap-2 uppercase tracking-widest text-zinc-500">
                            <BadgeCheck className="w-4 h-4" />
                            Informações do Sistema (Modo Debug)
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="text-[10px] font-mono text-zinc-500 space-y-1">
                        <p>Tenant Ativo: <span className="text-zinc-900 dark:text-zinc-200 font-bold">{tenantId}</span></p>
                        <p>Total Histórico de Agendamentos: <span className="text-zinc-900 dark:text-zinc-200 font-bold">{data.totalAppointmentsEver}</span></p>
                        <p>Última Consulta DB: <span className="text-zinc-900 dark:text-zinc-200 font-bold">{new Date().toLocaleString('pt-BR')}</span></p>
                        <p className="italic mt-2">* Estes dados são extraídos em tempo real do banco de dados PostgreSQL/Prisma.</p>
                    </CardContent>
                </Card>
            </div>
        );
    } catch (error: any) {
        console.error("Dashboard Error:", error);
        return (
            <div className="p-8">
                <Card className="border-red-200 bg-red-50 ring-1 ring-red-200 shadow-sm">
                    <CardHeader>
                        <CardTitle className="text-red-600 flex items-center gap-2 italic uppercase font-black">
                            <ShieldAlert className="w-5 h-5" />
                            Erro ao Carregar Dashboard
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="p-4 bg-white/50 rounded-lg border border-red-100 font-mono text-[10px] text-red-800 break-all">
                            {error?.message || "Erro interno desconhecido no servidor (500)"}
                        </div>
                        <p className="text-sm text-red-500 font-medium leading-relaxed">
                            Isso geralmente ocorre por falha na conexão com o banco de dados Supabase ou erro no processamento das métricas em tempo real.
                        </p>
                    </CardContent>
                </Card>
            </div>
        );
    }
}
