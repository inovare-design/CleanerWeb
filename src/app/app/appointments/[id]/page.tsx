import { auth } from "@/auth";
import { db } from "@/lib/db";
import { redirect, notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Calendar, Clock, User, MapPin, Star, ChevronLeft,
    CheckCircle2, Circle, Truck, Loader2, XCircle, FileText,
    Navigation, Camera, MessageSquare, AlertTriangle, StickyNote, ClipboardCheck
} from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { ConfirmServiceForm } from "@/components/client/confirm-service-form";

const timelineSteps = [
    { status: "PENDING", label: "Agendado", icon: Calendar },
    { status: "CONFIRMED", label: "Confirmado", icon: CheckCircle2 },
    { status: "EN_ROUTE", label: "A Caminho", icon: Truck },
    { status: "IN_PROGRESS", label: "Em Andamento", icon: Loader2 },
    { status: "AWAITING_CONFIRMATION", label: "Aguardando", icon: ClipboardCheck },
    { status: "COMPLETED", label: "Concluído", icon: CheckCircle2 },
];

function getStepIndex(status: string): number {
    if (status === "CANCELLED") return -1;
    if (status === "AWAITING_CONFIRMATION") return 3;
    return timelineSteps.findIndex(s => s.status === status);
}

export default async function AppointmentDetailPage(props: {
    params: Promise<{ id: string }>
}) {
    const params = await props.params;
    const session = await auth();
    if (!session?.user?.id) redirect("/login");

    const user = await db.user.findUnique({
        where: { id: session.user.id },
        include: { customerProfile: true }
    });

    if (!user?.customerProfile) redirect("/app");

    const appointment = await db.appointment.findUnique({
        where: { id: params.id },
        include: {
            service: true,
            employee: { include: { user: true } },
            feedbacks: true,
        }
    });

    if (!appointment || appointment.customerId !== user.customerProfile.id) {
        notFound();
    }

    const currentStep = getStepIndex(appointment.status);
    const isCancelled = appointment.status === "CANCELLED";
    const isLive = ["EN_ROUTE", "IN_PROGRESS"].includes(appointment.status);
    const isCompleted = appointment.status === "COMPLETED";
    const isAwaitingConfirmation = appointment.status === "AWAITING_CONFIRMATION";
    const existingFeedback = appointment.feedbacks?.[0];
    const duration = appointment.customDuration || appointment.service.durationMin || 60;
    const hours = Math.floor(duration / 60);
    const minutes = duration % 60;
    const durationText = hours > 0 ? `${hours}h${minutes > 0 ? ` ${minutes}min` : ""}` : `${minutes}min`;

    return (
        <div className="space-y-6">
            {/* Back Button */}
            <Link href="/app/appointments" className="inline-flex items-center gap-1 text-sm font-medium text-zinc-500 hover:text-zinc-900 transition-colors">
                <ChevronLeft className="w-4 h-4" />
                Voltar
            </Link>

            {/* Service Header */}
            <div className="space-y-2">
                <div className="flex items-start justify-between">
                    <div>
                        <h1 className="text-2xl font-black tracking-tight text-zinc-900">{appointment.service.name}</h1>
                        {appointment.service.description && (
                            <p className="text-sm text-muted-foreground mt-1 max-w-md">{appointment.service.description}</p>
                        )}
                    </div>
                    <Badge className={cn(
                        "text-xs font-black px-3 py-1 rounded-lg",
                        isCancelled ? "bg-red-100 text-red-700"
                            : isCompleted ? "bg-emerald-100 text-emerald-700"
                                : isLive ? "bg-blue-100 text-blue-700"
                                    : "bg-amber-100 text-amber-700"
                    )}>
                        {isCancelled ? "Cancelado" : isCompleted ? "Concluído" : isLive ? "Ao Vivo" : "Agendado"}
                    </Badge>
                </div>
            </div>

            {/* Date & Time Card */}
            <Card className="border-0 shadow-sm">
                <CardContent className="p-5">
                    <div className="grid grid-cols-3 gap-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-50 rounded-lg">
                                <Calendar className="w-5 h-5 text-blue-600" />
                            </div>
                            <div>
                                <p className="text-[10px] font-bold text-zinc-400 uppercase">Data</p>
                                <p className="text-sm font-bold text-zinc-900 capitalize">
                                    {format(new Date(appointment.startTime), "dd MMM, yyyy", { locale: ptBR })}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-violet-50 rounded-lg">
                                <Clock className="w-5 h-5 text-violet-600" />
                            </div>
                            <div>
                                <p className="text-[10px] font-bold text-zinc-400 uppercase">Horário</p>
                                <p className="text-sm font-bold text-zinc-900">
                                    {format(new Date(appointment.startTime), "HH:mm")} · {durationText}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-emerald-50 rounded-lg">
                                <FileText className="w-5 h-5 text-emerald-600" />
                            </div>
                            <div>
                                <p className="text-[10px] font-bold text-zinc-400 uppercase">Valor</p>
                                <p className="text-sm font-bold text-zinc-900">
                                    € {Number(appointment.price).toFixed(2)}
                                </p>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Visual Timeline */}
            {!isCancelled && (
                <Card className="border-0 shadow-sm">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-black uppercase tracking-widest text-zinc-400">Progresso</CardTitle>
                    </CardHeader>
                    <CardContent className="pb-6">
                        <div className="flex items-center justify-between relative px-2">
                            {/* Connector Line */}
                            <div className="absolute top-5 left-8 right-8 h-0.5 bg-zinc-200" />
                            <div
                                className="absolute top-5 left-8 h-0.5 bg-blue-600 transition-all duration-700"
                                style={{ width: `${Math.max(0, (currentStep / (timelineSteps.length - 1)) * 100 - 5)}%` }}
                            />

                            {timelineSteps.map((step, index) => {
                                const isActive = index <= currentStep;
                                const isCurrent = index === currentStep;
                                const StepIcon = step.icon;

                                return (
                                    <div key={step.status} className="flex flex-col items-center z-10 relative">
                                        <div className={cn(
                                            "w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all",
                                            isCurrent
                                                ? "bg-blue-600 border-blue-600 text-white scale-110 shadow-lg shadow-blue-200"
                                                : isActive
                                                    ? "bg-blue-600 border-blue-600 text-white"
                                                    : "bg-white border-zinc-200 text-zinc-300"
                                        )}>
                                            <StepIcon className={cn("w-4 h-4", isCurrent && step.status === "IN_PROGRESS" && "animate-spin")} />
                                        </div>
                                        <span className={cn(
                                            "text-[10px] font-bold mt-2 text-center",
                                            isActive ? "text-zinc-900" : "text-zinc-300"
                                        )}>
                                            {step.label}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Live Tracking Button */}
            {isLive && (
                <Link href={`/tracking/${appointment.id}`} className="block">
                    <Button className="w-full h-14 bg-blue-600 hover:bg-blue-700 text-lg font-black gap-3 rounded-2xl shadow-lg shadow-blue-200 active:scale-[0.98] transition-all">
                        <Navigation className="w-6 h-6" />
                        Rastrear ao Vivo
                    </Button>
                </Link>
            )}

            {/* Employee Card */}
            {appointment.employee && (
                <Card className="border-0 shadow-sm">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-black uppercase tracking-widest text-zinc-400">Profissional</CardTitle>
                    </CardHeader>
                    <CardContent className="pb-5">
                        <div className="flex items-center gap-4">
                            <div
                                className="w-14 h-14 rounded-2xl flex items-center justify-center text-white font-black text-xl shadow-lg"
                                style={{ backgroundColor: appointment.employee.color || "#3b82f6" }}
                            >
                                {appointment.employee.user.name?.substring(0, 2).toUpperCase()}
                            </div>
                            <div className="flex-1">
                                <p className="font-bold text-zinc-900 text-lg">{appointment.employee.user.name}</p>
                                <div className="flex items-center gap-1 mt-0.5">
                                    <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                                    <span className="text-sm font-bold text-amber-600">4.9</span>
                                    <span className="text-xs text-zinc-400 ml-1">· Profissional Verificado</span>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Client Confirmation Form */}
            {isAwaitingConfirmation && (
                <ConfirmServiceForm appointmentId={appointment.id} />
            )}

            {/* Existing Feedback (when already confirmed) */}
            {isCompleted && existingFeedback && (
                <Card className="border-0 shadow-sm bg-emerald-50/30">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-black uppercase tracking-widest text-emerald-600 flex items-center gap-2">
                            <Star className="w-4 h-4" />
                            Sua Avaliação
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="pb-5">
                        <div className="flex items-center gap-1 mb-2">
                            {[1, 2, 3, 4, 5].map((star) => (
                                <Star
                                    key={star}
                                    className={cn(
                                        "w-5 h-5",
                                        star <= existingFeedback.rating
                                            ? "text-amber-400 fill-amber-400"
                                            : "text-zinc-200"
                                    )}
                                />
                            ))}
                            <span className="text-sm font-bold text-amber-600 ml-2">{existingFeedback.rating}/5</span>
                        </div>
                        {existingFeedback.comment && (
                            <p className="text-sm text-zinc-600 italic">"{existingFeedback.comment}"</p>
                        )}
                    </CardContent>
                </Card>
            )}

            {/* Proof of Work Images */}
            {appointment.proofImages.length > 0 && (
                <Card className="border-0 shadow-sm">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-black uppercase tracking-widest text-zinc-400 flex items-center gap-2">
                            <Camera className="w-4 h-4" />
                            Prova de Trabalho
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="pb-5">
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                            {appointment.proofImages.map((img: string, i: number) => (
                                <a key={i} href={img} target="_blank" rel="noopener noreferrer" className="group">
                                    <div className="aspect-square rounded-xl overflow-hidden bg-zinc-100 ring-1 ring-zinc-200 group-hover:ring-blue-400 transition-all group-hover:shadow-lg">
                                        <img src={img} alt={`Foto ${i + 1}`} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                                    </div>
                                </a>
                            ))}
                        </div>
                        <p className="text-[10px] text-zinc-400 mt-3 font-medium">
                            {appointment.proofImages.length} foto{appointment.proofImages.length !== 1 ? "s" : ""} registrada{appointment.proofImages.length !== 1 ? "s" : ""} pelo profissional
                        </p>
                    </CardContent>
                </Card>
            )}

            {/* Staff Notes */}
            {appointment.notes && (
                <Card className="border-0 shadow-sm">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-black uppercase tracking-widest text-zinc-400 flex items-center gap-2">
                            <MessageSquare className="w-4 h-4" />
                            Anotações da Equipe
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="pb-5">
                        <div className="bg-zinc-50 rounded-xl p-4 border border-zinc-100">
                            <p className="text-sm text-zinc-700 leading-relaxed whitespace-pre-wrap">{appointment.notes}</p>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Warnings / Priority Areas */}
            {(appointment.warnings || appointment.priorityAreas) && (
                <Card className="border-0 shadow-sm">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-black uppercase tracking-widest text-zinc-400 flex items-center gap-2">
                            <StickyNote className="w-4 h-4" />
                            Observações
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="pb-5 space-y-3">
                        {appointment.warnings && (
                            <div className="flex items-start gap-3 bg-amber-50 rounded-xl p-4 border border-amber-100">
                                <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
                                <div>
                                    <p className="text-xs font-bold text-amber-700 uppercase tracking-wider mb-1">Avisos</p>
                                    <p className="text-sm text-amber-800 leading-relaxed">{appointment.warnings}</p>
                                </div>
                            </div>
                        )}
                        {appointment.priorityAreas && (
                            <div className="flex items-start gap-3 bg-blue-50 rounded-xl p-4 border border-blue-100">
                                <MapPin className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                                <div>
                                    <p className="text-xs font-bold text-blue-700 uppercase tracking-wider mb-1">Áreas Prioritárias</p>
                                    <p className="text-sm text-blue-800 leading-relaxed">{appointment.priorityAreas}</p>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
