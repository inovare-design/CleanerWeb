import { auth } from "@/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, MapPin, ArrowRight, Star, Clock, PlusCircle } from "lucide-react";
import Link from "next/link";
import { db } from "@/lib/db";

async function getClientData(userId: string) {
    // Buscar próximo agendamento do cliente
    // Precisamos achar o customerId ligado ao userId
    const userWithCustomer = await db.user.findUnique({
        where: { id: userId },
        include: { customerProfile: true }
    });

    if (!userWithCustomer?.customerProfile) return null;

    const nextAppointment = await db.appointment.findFirst({
        where: {
            customerId: userWithCustomer.customerProfile.id,
            startTime: { gte: new Date() },
            status: { in: ['PENDING', 'CONFIRMED'] }
        },
        include: { service: true, employee: { include: { user: true } } },
        orderBy: { startTime: 'asc' }
    });

    return { nextAppointment, userName: userWithCustomer.name };
}

export default async function ClientDashboard() {
    const session = await auth();
    if (!session?.user?.id) return null;

    const data = await getClientData(session.user.id);

    return (
        <div className="space-y-6">
            {/* Welcome Section */}
            <section className="space-y-1">
                <h1 className="text-2xl font-bold tracking-tight">
                    Olá, {session.user.name?.split(" ")[0]}! 👋
                </h1>
                <p className="text-muted-foreground">
                    Sua casa merece brilhar. O que vamos agendar hoje?
                </p>
            </section>

            {/* Next Appointment Card */}
            {data?.nextAppointment ? (
                <Card className="border-blue-100 bg-gradient-to-br from-white to-blue-50/50 shadow-sm overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                        <Calendar className="w-32 h-32 text-blue-900" />
                    </div>
                    <CardHeader className="pb-2 relative">
                        <div className="flex items-center justify-between">
                            <CardTitle className="text-sm font-medium text-blue-600 uppercase tracking-wider">
                                Próxima Limpeza
                            </CardTitle>
                            <span className="text-xs font-medium bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                                {data.nextAppointment.status === 'CONFIRMED' ? 'Confirmado' : 'Aguardando'}
                            </span>
                        </div>
                    </CardHeader>
                    <CardContent className="relative">
                        <div className="flex flex-col gap-1 mb-4">
                            <h3 className="text-2xl font-bold text-gray-900">
                                {new Date(data.nextAppointment.startTime).toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
                            </h3>
                            <div className="flex items-center text-gray-500">
                                <Clock className="w-4 h-4 mr-1" />
                                <span>{new Date(data.nextAppointment.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                <span className="mx-2">•</span>
                                <span>{data.nextAppointment.service.name}</span>
                            </div>
                        </div>

                        <div className="flex items-center gap-3 bg-white/60 p-3 rounded-lg border border-blue-100/50">
                            {data.nextAppointment.employee ? (
                                <>
                                    <div
                                        className="h-10 w-10 rounded-full flex items-center justify-center text-white font-bold shadow-sm"
                                        style={{ backgroundColor: data.nextAppointment.employee.color || '#3b82f6' }}
                                    >
                                        {data.nextAppointment.employee.user.name?.substring(0, 2).toUpperCase()}
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium">{data.nextAppointment.employee.user.name}</p>
                                        <div className="flex items-center text-xs text-yellow-500">
                                            <Star className="w-3 h-3 fill-current" />
                                            <span className="ml-1 text-gray-500">4.9 (120)</span>
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <div className="text-sm text-gray-500 italic">Profissional será atribuído em breve.</div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            ) : (
                <Card className="border-dashed border-2 shadow-none bg-transparent">
                    <CardContent className="flex flex-col items-center justify-center py-10 text-center">
                        <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                            <Calendar className="w-6 h-6 text-gray-400" />
                        </div>
                        <h3 className="text-lg font-medium">Nenhuma limpeza agendada</h3>
                        <p className="text-sm text-muted-foreground max-w-xs mb-6">
                            Mantenha sua casa impecável. Agende sua próxima limpeza em segundos.
                        </p>
                        <Button asChild className="bg-blue-600 hover:bg-blue-700 rounded-full px-8">
                            <Link href="/app/book">Agendar Agora</Link>
                        </Button>
                    </CardContent>
                </Card>
            )}

            {/* Quick Actions Grid */}
            <h2 className="text-lg font-semibold pt-4">Acesso Rápido</h2>
            <div className="grid grid-cols-2 gap-4">
                <Link href="/app/book" className="block group">
                    <Card className="h-full hover:border-blue-200 hover:shadow-md transition-all cursor-pointer group-hover:-translate-y-1">
                        <CardContent className="p-4 flex flex-col items-center text-center space-y-3">
                            <div className="p-3 bg-blue-50 text-blue-600 rounded-xl group-hover:bg-blue-600 group-hover:text-white transition-colors">
                                <PlusCircle className="w-6 h-6" />
                            </div>
                            <div>
                                <span className="font-medium block">Novo Agendamento</span>
                                <span className="text-xs text-muted-foreground">Orçamento instantâneo</span>
                            </div>
                        </CardContent>
                    </Card>
                </Link>

                <Link href="/app/appointments" className="block group">
                    <Card className="h-full hover:border-violet-200 hover:shadow-md transition-all cursor-pointer group-hover:-translate-y-1">
                        <CardContent className="p-4 flex flex-col items-center text-center space-y-3">
                            <div className="p-3 bg-violet-50 text-violet-600 rounded-xl group-hover:bg-violet-600 group-hover:text-white transition-colors">
                                <Calendar className="w-6 h-6" />
                            </div>
                            <div>
                                <span className="font-medium block">Histórico</span>
                                <span className="text-xs text-muted-foreground">Serviços anteriores</span>
                            </div>
                        </CardContent>
                    </Card>
                </Link>
            </div>
        </div>
    );
}
