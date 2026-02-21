import { auth } from "@/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, MapPin, User, ChevronRight, CalendarX2, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";

const statusConfig: Record<string, { label: string; color: string }> = {
    PENDING: { label: "Pendente", color: "bg-amber-100 text-amber-700" },
    CONFIRMED: { label: "Confirmado", color: "bg-blue-100 text-blue-700" },
    EN_ROUTE: { label: "A Caminho", color: "bg-purple-100 text-purple-700" },
    IN_PROGRESS: { label: "Em Andamento", color: "bg-indigo-100 text-indigo-700" },
    AWAITING_CONFIRMATION: { label: "Aguardando", color: "bg-orange-100 text-orange-700" },
    COMPLETED: { label: "Concluído", color: "bg-emerald-100 text-emerald-700" },
    CANCELLED: { label: "Cancelado", color: "bg-red-100 text-red-700" },
};

type TabKey = "upcoming" | "completed" | "cancelled";

export default async function ClientAppointmentsPage(props: {
    searchParams?: Promise<{ tab?: string }>
}) {
    const searchParams = await props.searchParams;
    const session = await auth();
    if (!session?.user?.id) redirect("/login");

    const user = await db.user.findUnique({
        where: { id: session.user.id },
        include: { customerProfile: true }
    });

    if (!user?.customerProfile) redirect("/app");

    const currentTab = (searchParams?.tab as TabKey) || "upcoming";

    const now = new Date();

    const appointments = await db.appointment.findMany({
        where: {
            customerId: user.customerProfile.id,
            ...(currentTab === "upcoming" && {
                status: { in: ["PENDING", "CONFIRMED", "EN_ROUTE", "IN_PROGRESS", "AWAITING_CONFIRMATION"] },
            }),
            ...(currentTab === "completed" && { status: "COMPLETED" }),
            ...(currentTab === "cancelled" && { status: "CANCELLED" }),
        },
        include: {
            service: true,
            employee: { include: { user: true } },
        },
        orderBy: { startTime: currentTab === "upcoming" ? "asc" : "desc" },
    });

    const tabs: { key: TabKey; label: string; icon: React.ElementType }[] = [
        { key: "upcoming", label: "Próximos", icon: Calendar },
        { key: "completed", label: "Concluídos", icon: CheckCircle2 },
        { key: "cancelled", label: "Cancelados", icon: CalendarX2 },
    ];

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-black tracking-tight text-zinc-900">Meus Agendamentos</h1>
                <p className="text-sm text-muted-foreground mt-1">Acompanhe todos os seus serviços.</p>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 bg-zinc-100/80 p-1 rounded-xl">
                {tabs.map(tab => (
                    <Link
                        key={tab.key}
                        href={`/app/appointments?tab=${tab.key}`}
                        className={cn(
                            "flex-1 flex items-center justify-center gap-2 text-sm font-bold py-2.5 rounded-lg transition-all",
                            currentTab === tab.key
                                ? "bg-white text-zinc-900 shadow-sm"
                                : "text-zinc-400 hover:text-zinc-600"
                        )}
                    >
                        <tab.icon className="w-4 h-4" />
                        {tab.label}
                    </Link>
                ))}
            </div>

            {/* Appointments List */}
            {appointments.length === 0 ? (
                <div className="text-center py-16">
                    <div className="w-16 h-16 bg-zinc-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Calendar className="w-8 h-8 text-zinc-300" />
                    </div>
                    <h3 className="text-lg font-bold text-zinc-900">Nenhum agendamento</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                        {currentTab === "upcoming" ? "Você ainda não tem serviços agendados." : "Nada aqui por enquanto."}
                    </p>
                    {currentTab === "upcoming" && (
                        <Link
                            href="/app/book"
                            className="inline-block mt-6 bg-blue-600 text-white px-6 py-3 rounded-full font-bold text-sm shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all active:scale-95"
                        >
                            Agendar Agora
                        </Link>
                    )}
                </div>
            ) : (
                <div className="space-y-3">
                    {appointments.map((apt: any) => {
                        const status = statusConfig[apt.status] || { label: apt.status, color: "bg-gray-100 text-gray-700" };
                        const duration = apt.customDuration || apt.service.durationMin || 60;
                        const hours = Math.floor(duration / 60);
                        const minutes = duration % 60;
                        const durationText = hours > 0 ? `${hours}h${minutes > 0 ? `${minutes}` : ""}` : `${minutes}min`;
                        const isLive = ["EN_ROUTE", "IN_PROGRESS"].includes(apt.status);

                        return (
                            <Link key={apt.id} href={`/app/appointments/${apt.id}`} className="block group">
                                <Card className={cn(
                                    "border-0 shadow-sm hover:shadow-md transition-all group-hover:-translate-y-0.5",
                                    isLive && "border-2 border-blue-200 shadow-blue-100/50"
                                )}>
                                    <CardContent className="p-4 flex items-center gap-4">
                                        {/* Date Badge */}
                                        <div className={cn(
                                            "flex-shrink-0 w-14 h-14 rounded-xl flex flex-col items-center justify-center",
                                            isLive ? "bg-blue-600 text-white" : "bg-zinc-100 text-zinc-600"
                                        )}>
                                            <span className="text-[10px] font-bold uppercase leading-none">
                                                {format(new Date(apt.startTime), "MMM", { locale: ptBR })}
                                            </span>
                                            <span className="text-xl font-black leading-none mt-0.5">
                                                {format(new Date(apt.startTime), "dd")}
                                            </span>
                                        </div>

                                        {/* Info */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1">
                                                <h3 className="font-bold text-sm text-zinc-900 truncate">{apt.service.name}</h3>
                                                <Badge className={cn("text-[9px] font-black px-2 py-0.5 rounded-md", status.color)}>
                                                    {status.label}
                                                </Badge>
                                            </div>
                                            <div className="flex items-center gap-3 text-[11px] text-zinc-400 font-medium">
                                                <span className="flex items-center gap-1">
                                                    <Clock className="w-3 h-3" />
                                                    {format(new Date(apt.startTime), "HH:mm")} · {durationText}
                                                </span>
                                                {apt.employee && (
                                                    <span className="flex items-center gap-1">
                                                        <User className="w-3 h-3" />
                                                        {apt.employee.user.name?.split(" ")[0]}
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        {/* Arrow */}
                                        <ChevronRight className={cn(
                                            "w-5 h-5 flex-shrink-0 transition-transform group-hover:translate-x-1",
                                            isLive ? "text-blue-500" : "text-zinc-300"
                                        )} />
                                    </CardContent>
                                </Card>
                            </Link>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
