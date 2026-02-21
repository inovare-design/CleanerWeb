import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Clock, User, Navigation, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { calculateETA } from "@/lib/google-maps";

export const dynamic = 'force-dynamic';

export default async function CustomerTrackingPage(props: { params: Promise<{ id: string }> }) {
    const params = await props.params;
    const appointment = await db.appointment.findUnique({
        where: { id: params.id },
        include: {
            customer: { include: { user: true } },
            employee: { include: { user: true } },
            service: true,
            tenant: true
        }
    });

    if (!appointment) return notFound();

    // Se o status for COMPLETED ou CANCELLED, não mostra rastreio em tempo real
    const showTracking = appointment.status === "EN_ROUTE" || appointment.status === "IN_PROGRESS";

    let eta = { duration: "Calculando...", distance: "..." };
    if (appointment.status === "EN_ROUTE" && appointment.employee?.latitude && appointment.employee?.longitude) {
        eta = await calculateETA(
            { lat: appointment.employee.latitude, lng: appointment.employee.longitude },
            appointment.address
        );
    }

    return (
        <div className="min-h-screen bg-zinc-50 flex flex-col items-center p-4 md:p-8">
            <div className="w-full max-w-lg space-y-6">
                <header className="text-center space-y-2">
                    <div className="mx-auto w-12 h-12 bg-zinc-900 rounded-2xl flex items-center justify-center mb-4 shadow-lg">
                        <ShieldCheck className="w-6 h-6 text-white" />
                    </div>
                    <h1 className="text-2xl font-black tracking-tight text-zinc-900">Rastreio de Serviço</h1>
                    <p className="text-sm text-muted-foreground">{appointment.tenant.name} - #{appointment.id.substring(0, 8)}</p>
                </header>

                <Card className="border-0 shadow-xl overflow-hidden rounded-3xl">
                    <div className={cn(
                        "h-48 relative overflow-hidden flex items-center justify-center",
                        showTracking ? "bg-blue-600" : "bg-zinc-100"
                    )}>
                        {showTracking ? (
                            <div className="text-white text-center p-6 space-y-4">
                                <Navigation className="w-12 h-12 mx-auto animate-bounce" />
                                <div>
                                    <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-70">Previsão de Chegada</p>
                                    <p className="text-4xl font-black">{appointment.status === "EN_ROUTE" ? eta.duration : "No Local"}</p>
                                </div>
                            </div>
                        ) : (
                            <div className="text-zinc-400 text-center p-6">
                                <Clock className="w-12 h-12 mx-auto mb-2 opacity-20" />
                                <p className="font-bold">O rastreio em tempo real não está ativo.</p>
                                <p className="text-xs uppercase font-black mt-1">Status: {appointment.status}</p>
                            </div>
                        )}

                        {/* Decorative background for map */}
                        <div className="absolute inset-0 opacity-10 pointer-events-none select-none bg-[url('https://www.google.com/maps/vt/pb=!1m4!1m3!1i1!2i0!3i0!2m3!1e0!2sm!3i420120488!3m8!2spt-BR!3sUS!5e1105!12m4!1e68!2m2!1sset!2sRoadmap!4e0!5m1!1e0!23i4111425')] bg-repeat" />
                    </div>

                    <CardContent className="p-8 space-y-8 bg-white">
                        <section className="space-y-4">
                            <div className="flex items-center justify-between">
                                <h2 className="text-lg font-bold">Status do Atendimento</h2>
                                <Badge className={cn(
                                    "font-black uppercase text-[10px] tracking-widest",
                                    appointment.status === "EN_ROUTE" ? "bg-amber-100 text-amber-700 animate-pulse" :
                                        appointment.status === "IN_PROGRESS" ? "bg-emerald-100 text-emerald-700" : "bg-zinc-100 text-zinc-600"
                                )}>
                                    {appointment.status === "EN_ROUTE" ? "A Caminho" :
                                        appointment.status === "IN_PROGRESS" ? "No Local / Em Serviço" : "Agendado"}
                                </Badge>
                            </div>

                            <div className="flex items-start gap-4 p-4 rounded-2xl bg-zinc-50 border border-zinc-100">
                                <MapPin className="w-5 h-5 text-zinc-400 mt-1" />
                                <div>
                                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-tighter">Endereço da Limpeza</p>
                                    <p className="text-sm font-bold text-zinc-900 leading-tight mt-1">{appointment.address}</p>
                                </div>
                            </div>
                        </section>

                        <section className="space-y-4">
                            <h2 className="text-lg font-bold">Sua Profissional</h2>
                            <div className="flex items-center gap-4 bg-zinc-50 p-4 rounded-2xl border border-zinc-100">
                                <div className="w-12 h-12 rounded-xl bg-zinc-900 flex items-center justify-center text-white font-black shadow-lg">
                                    {appointment.employee?.user?.name?.substring(0, 2).toUpperCase()}
                                </div>
                                <div className="flex-1">
                                    <p className="text-sm font-bold text-zinc-900">{appointment.employee?.user.name}</p>
                                    <p className="text-xs text-muted-foreground">{appointment.service.name}</p>
                                </div>
                                <div className="flex flex-col items-end">
                                    <div className="flex items-center text-amber-500 mb-1">
                                        <Clock className="w-3 h-3 mr-1" />
                                        <span className="text-[10px] font-black">{new Date(appointment.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                    </div>
                                </div>
                            </div>
                        </section>

                        <footer className="pt-4 border-t border-zinc-100 text-center">
                            <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest leading-relaxed">
                                Este rastreio é seguro e privado para você.<br />
                                © {new Date().getFullYear()} {appointment.tenant.name}
                            </p>
                        </footer>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
