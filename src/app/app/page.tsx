import { auth } from "@/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, MapPin, ArrowRight, Star, Clock, PlusCircle, CheckCircle2, History, Users } from "lucide-react";
import Link from "next/link";
import { db } from "@/lib/db";

/**
 * Busca dados específicos do cliente para o dashboard.
 * Otimizado para buscar estatísticas e o próximo agendamento simultaneamente.
 */
async function getClientData(userId: string) {
    const userWithCustomer = await db.user.findUnique({
        where: { id: userId },
        include: { customerProfile: true }
    });

    if (!userWithCustomer?.customerProfile) return null;

    const customerId = userWithCustomer.customerProfile.id;

    // Executamos as consultas em paralelo para carregar o dashboard mais rápido
    const [upcomingAppointments, totalAppointments, totalInvestedResult] = await Promise.all([
        // 1. Busca TODOS os agendamentos futuros (confirmados ou pendentes)
        db.appointment.findMany({
            where: {
                customerId,
                startTime: { gte: new Date() },
                status: { in: ['PENDING', 'CONFIRMED'] }
            },
            include: { service: true, employee: { include: { user: true } } },
            orderBy: { startTime: 'asc' }
        }),
        // 2. Conta todos os agendamentos já feitos por este cliente
        db.appointment.count({
            where: { customerId }
        }),
        // 3. Soma o valor total investido apenas em serviços concluídos
        db.appointment.aggregate({
            where: { customerId, status: "COMPLETED" },
            _sum: { price: true }
        })
    ]);

    const totalInvested = Number(totalInvestedResult._sum.price || 0);

    return {
        upcomingAppointments,
        userName: userWithCustomer.name,
        totalAppointments,
        totalInvested
    };
}

export default async function ClientDashboard() {
    const session = await auth();
    if (!session?.user?.id) return null;

    const data = await getClientData(session.user.id);

    return (
        <div className="space-y-6">
            {/* Welcome Section */}
            <section className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                    <h1 className="text-3xl font-bold tracking-tight text-zinc-900 border-b-2 border-primary w-fit pr-8">
                        Olá, {session.user.name?.split(" ")[0]}! 👋
                    </h1>
                    <p className="text-muted-foreground">
                        Sua casa merece brilhar. O que vamos agendar hoje?
                    </p>
                </div>

                <div className="flex gap-4">
                    <Card className="px-4 py-2 bg-zinc-50 border-0 shadow-none flex items-center gap-3">
                        <History className="w-5 h-5 text-violet-500" />
                        <div>
                            <p className="text-[10px] uppercase font-bold text-muted-foreground leading-none">Total de Reservas</p>
                            <p className="text-lg font-bold">{data?.totalAppointments || 0}</p>
                        </div>
                    </Card>
                    <Card className="px-4 py-2 bg-zinc-50 border-0 shadow-none flex items-center gap-3">
                        <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                        <div>
                            <p className="text-[10px] uppercase font-bold text-muted-foreground leading-none">Total Investido</p>
                            <p className="text-lg font-bold">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(data?.totalInvested || 0)}</p>
                        </div>
                    </Card>
                </div>
            </section>

            {/* Upcoming Appointments */}
            {data?.upcomingAppointments && data.upcomingAppointments.length > 0 ? (
                <div className="space-y-4">
                    <h2 className="text-sm font-black uppercase tracking-widest text-zinc-400">
                        Seus Compromissos ({data.upcomingAppointments.length})
                    </h2>
                    {data.upcomingAppointments.map((appt: typeof data.upcomingAppointments[number], idx: number) => (
                        <Link key={appt.id} href={`/app/appointments/${appt.id}`} className="block group">
                            <Card className={`border-2 shadow-md overflow-hidden relative transition-all hover:shadow-lg hover:-translate-y-0.5 ${idx === 0 ? 'border-blue-100 bg-gradient-to-br from-white to-blue-50/30' : 'border-zinc-100 bg-white'
                                }`}>
                                {idx === 0 && (
                                    <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none group-hover:scale-110 transition-all duration-500">
                                        <Calendar className="w-32 h-32 text-blue-600 rotate-12" />
                                    </div>
                                )}
                                <CardHeader className="pb-2 relative pt-5 px-6">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <div className={`w-2 h-2 rounded-full ${idx === 0 ? 'bg-blue-600 animate-pulse' : 'bg-zinc-300'}`} />
                                            <CardTitle className={`text-xs font-bold uppercase tracking-[0.2em] ${idx === 0 ? 'text-blue-600' : 'text-zinc-400'}`}>
                                                {idx === 0 ? 'Próximo Compromisso' : 'Compromisso Agendado'}
                                            </CardTitle>
                                        </div>
                                        <span className={`text-[10px] font-black px-3 py-1 rounded-full shadow-sm ${appt.status === 'CONFIRMED'
                                            ? 'bg-emerald-100 text-emerald-700'
                                            : 'bg-amber-100 text-amber-700'
                                            }`}>
                                            {appt.status === 'CONFIRMED' ? 'CONFIRMADO' : 'AGUARDANDO APROVAÇÃO'}
                                        </span>
                                    </div>
                                </CardHeader>
                                <CardContent className="relative px-6 pb-5 mt-1">
                                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                                        <div>
                                            <h3 className={`font-black text-zinc-900 tracking-tight capitalize ${idx === 0 ? 'text-3xl' : 'text-2xl'}`}>
                                                {new Date(appt.startTime).toLocaleDateString('pt-BR', { weekday: 'long' })},
                                                <br />
                                                <span className="text-blue-600">
                                                    {new Date(appt.startTime).toLocaleDateString('pt-BR', { day: 'numeric', month: 'long' })}
                                                </span>
                                            </h3>
                                            <div className="flex items-center text-zinc-600 font-semibold mt-3 bg-white/50 w-fit px-3 py-1.5 rounded-lg border border-blue-50">
                                                <Clock className="w-4 h-4 mr-2 text-blue-500" />
                                                <span>{new Date(appt.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                                <span className="mx-3 opacity-20">|</span>
                                                <span className="text-blue-700">{appt.service.name}</span>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-4 bg-white p-3 rounded-2xl border border-zinc-100 shadow-sm min-w-[280px]">
                                            {appt.employee ? (
                                                <>
                                                    <div
                                                        className="h-11 w-11 rounded-xl flex items-center justify-center text-white font-black shadow-lg shadow-blue-200"
                                                        style={{ backgroundColor: appt.employee.color || '#3b82f6' }}
                                                    >
                                                        {appt.employee.user.name?.substring(0, 2).toUpperCase()}
                                                    </div>
                                                    <div className="flex-1">
                                                        <p className="text-xs font-bold text-muted-foreground uppercase tracking-tighter">Sua Profissional</p>
                                                        <p className="text-sm font-bold text-zinc-900">{appt.employee.user.name}</p>
                                                    </div>
                                                    <div className="flex items-center text-amber-500">
                                                        <Star className="w-3 h-3 fill-current" />
                                                        <span className="ml-1 text-xs font-bold font-mono">4.9</span>
                                                    </div>
                                                </>
                                            ) : (
                                                <div className="text-xs text-gray-400 italic flex items-center gap-3 p-2">
                                                    <div className="w-10 h-10 rounded-xl bg-zinc-50 border border-dashed flex items-center justify-center">
                                                        <Users className="w-4 h-4 text-zinc-300" />
                                                    </div>
                                                    Definindo melhor profissional...
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Step-by-Step Progress */}
                                    <div className="mt-4 pt-4 border-t border-zinc-100">
                                        {(() => {
                                            const steps = [
                                                { key: "PENDING", label: "Agendado" },
                                                { key: "CONFIRMED", label: "Confirmado" },
                                                { key: "Em Andamento", label: "Serviço" },
                                                { key: "COMPLETED", label: "Concluído" },
                                            ];
                                            const statusMap: Record<string, number> = {
                                                PENDING: 0, CONFIRMED: 1, EN_ROUTE: 2, IN_PROGRESS: 2,
                                                AWAITING_CONFIRMATION: 3, COMPLETED: 3
                                            };
                                            const current = statusMap[appt.status] ?? 0;
                                            return (
                                                <div className="flex items-center gap-0">
                                                    {steps.map((step, i) => {
                                                        const isDone = i < current;
                                                        const isCurrent = i === current;
                                                        return (
                                                            <div key={step.key} className="flex items-center flex-1">
                                                                <div className="flex flex-col items-center flex-1">
                                                                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black border-2 transition-all ${isDone ? "bg-emerald-500 border-emerald-500 text-white"
                                                                        : isCurrent ? "bg-blue-600 border-blue-600 text-white"
                                                                            : "bg-white border-zinc-200 text-zinc-300"
                                                                        }`}>
                                                                        {isDone ? "✓" : i + 1}
                                                                    </div>
                                                                    <span className={`text-[8px] font-bold mt-1 text-center leading-tight ${isDone ? "text-emerald-600" : isCurrent ? "text-blue-600" : "text-zinc-300"
                                                                        }`}>{step.label}</span>
                                                                </div>
                                                                {i < steps.length - 1 && (
                                                                    <div className={`h-0.5 flex-1 -mx-1 mt-[-12px] ${i < current ? "bg-emerald-400" : "bg-zinc-200"
                                                                        }`} />
                                                                )}
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            );
                                        })()}
                                    </div>
                                </CardContent>
                            </Card>
                        </Link>
                    ))}
                </div>
            ) : (
                <Card className="border-dashed border-2 shadow-sm bg-zinc-50/50 hover:bg-white transition-colors">
                    <CardContent className="flex flex-col items-center justify-center py-14 text-center">
                        <div className="w-16 h-16 bg-white border shadow-sm rounded-full flex items-center justify-center mb-6">
                            <Calendar className="w-8 h-8 text-zinc-300" />
                        </div>
                        <h3 className="text-xl font-bold text-zinc-900">Nenhuma limpeza agendada</h3>
                        <p className="text-sm text-muted-foreground max-w-xs mb-8">
                            Mantenha sua casa impecável e sua rotina organizada com nossos serviços profissionais.
                        </p>
                        <Button asChild className="bg-blue-600 hover:bg-blue-700 rounded-full px-10 h-11 text-base font-bold shadow-lg shadow-blue-200 transition-all active:scale-95">
                            <Link href="/app/book">Agendar Agora</Link>
                        </Button>
                    </CardContent>
                </Card>
            )}

            {/* Quick Actions Grid */}
            <div className="pt-6">
                <h2 className="text-xl font-bold mb-4 text-zinc-900">Acesso Rápido</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Link href="/app/book" className="block group">
                        <Card className="h-full border-0 shadow-md hover:shadow-xl transition-all cursor-pointer group-hover:-translate-y-1 bg-gradient-to-br from-white to-zinc-50">
                            <CardContent className="p-6 flex items-center gap-6">
                                <div className="p-4 bg-blue-50 text-blue-600 rounded-2xl group-hover:bg-blue-600 group-hover:text-white transition-all shadow-sm">
                                    <PlusCircle className="w-8 h-8" />
                                </div>
                                <div>
                                    <span className="font-bold text-lg block text-zinc-900">Novo Agendamento</span>
                                    <span className="text-sm text-muted-foreground">Reserve em menos de 1 minuto</span>
                                </div>
                                <ArrowRight className="w-5 h-5 ml-auto text-zinc-300 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" />
                            </CardContent>
                        </Card>
                    </Link>

                    <Link href="/app/appointments" className="block group">
                        <Card className="h-full border-0 shadow-md hover:shadow-xl transition-all cursor-pointer group-hover:-translate-y-1 bg-gradient-to-br from-white to-zinc-50">
                            <CardContent className="p-6 flex items-center gap-6">
                                <div className="p-4 bg-violet-50 text-violet-600 rounded-2xl group-hover:bg-violet-600 group-hover:text-white transition-all shadow-sm">
                                    <Calendar className="w-8 h-8" />
                                </div>
                                <div>
                                    <span className="font-bold text-lg block text-zinc-900">Histórico de Limpezas</span>
                                    <span className="text-sm text-muted-foreground">Gerencie seus serviços anteriores</span>
                                </div>
                                <ArrowRight className="w-5 h-5 ml-auto text-zinc-300 group-hover:text-violet-600 group-hover:translate-x-1 transition-all" />
                            </CardContent>
                        </Card>
                    </Link>
                </div>
            </div>
        </div>
    );
}
