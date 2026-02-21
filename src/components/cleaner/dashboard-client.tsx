"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
    Clock,
    MapPin,
    Navigation,
    Play,
    CheckCircle2,
    AlertCircle,
    Loader2,
    Camera,
    Plus,
    Image as ImageIcon
} from "lucide-react";
import { updateStaffLocation } from "@/actions/update-staff-location";
import { updateAppointmentStatus } from "@/actions/update-appointment-status";
import { addProofImages } from "@/actions/add-proof-images";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface Appointment {
    id: string;
    startTime: string;
    endTime: string;
    status: string;
    address: string;
    proofImages: string[];
    service: { name: string };
    customer: { user: { name: string } };
}

export function CleanerDashboardClient({ appointments }: { appointments: Appointment[] }) {
    const [loadingAptId, setLoadingAptId] = useState<string | null>(null);
    const [photoUrl, setPhotoUrl] = useState<Record<string, string>>({});
    const [addingPhoto, setAddingPhoto] = useState<string | null>(null);
    const [showPhotoInput, setShowPhotoInput] = useState<Record<string, boolean>>({});

    // Enviar localização periodicamente
    useEffect(() => {
        let interval: NodeJS.Timeout;

        const hasActiveJob = appointments.some(a => a.status === "EN_ROUTE" || a.status === "IN_PROGRESS");
        const isEnRoute = appointments.some(a => a.status === "EN_ROUTE");

        if (hasActiveJob) {
            const sendLocation = () => {
                if ("geolocation" in navigator) {
                    navigator.geolocation.getCurrentPosition(
                        async (position) => {
                            const { latitude, longitude } = position.coords;
                            await updateStaffLocation(latitude, longitude);
                        },
                        (error) => {
                            console.error("Error getting location:", error);
                        },
                        { enableHighAccuracy: true }
                    );
                }
            };

            sendLocation();
            const frequency = isEnRoute ? 15000 : 45000;
            interval = setInterval(sendLocation, frequency);
        }

        return () => {
            if (interval) clearInterval(interval);
        };
    }, [appointments]);

    const router = useRouter();

    const handleAction = async (aptId: string, currentStatus: string) => {
        setLoadingAptId(aptId);
        try {
            let nextStatus = "";
            if (currentStatus === "CONFIRMED") {
                nextStatus = "EN_ROUTE";
            } else if (currentStatus === "EN_ROUTE") {
                nextStatus = "IN_PROGRESS";
            } else if (currentStatus === "IN_PROGRESS") {
                nextStatus = "AWAITING_CONFIRMATION";
            }

            if (nextStatus) {
                const res = await updateAppointmentStatus(aptId, nextStatus as any);
                if (res.success) {
                    toast.success(
                        nextStatus === "AWAITING_CONFIRMATION"
                            ? "Serviço finalizado! Aguardando confirmação do cliente."
                            : `Status atualizado para: ${nextStatus}`
                    );
                    router.refresh();
                } else {
                    toast.error(res.error);
                }
            }
        } finally {
            setLoadingAptId(null);
        }
    };

    const handleAddPhoto = async (aptId: string) => {
        const url = photoUrl[aptId]?.trim();
        if (!url) {
            toast.error("Insira a URL da foto.");
            return;
        }

        setAddingPhoto(aptId);
        try {
            const res = await addProofImages(aptId, [url]);
            if (res.success) {
                toast.success("Foto adicionada!");
                setPhotoUrl(prev => ({ ...prev, [aptId]: "" }));
                router.refresh();
            } else {
                toast.error(res.error);
            }
        } finally {
            setAddingPhoto(null);
        }
    };

    if (appointments.length === 0) {
        return (
            <Card className="border-dashed border-2 py-12 text-center">
                <CardContent className="space-y-4">
                    <div className="w-16 h-16 bg-zinc-100 rounded-full flex items-center justify-center mx-auto text-zinc-400">
                        <CalendarIcon className="w-8 h-8" />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold">Sem agendamentos hoje</h3>
                        <p className="text-sm text-muted-foreground">Você não possui serviços agendados para este dia.</p>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="space-y-4">
            {appointments.map((apt, index) => (
                <Card key={apt.id} className={cn(
                    "overflow-hidden transition-all duration-300",
                    apt.status === "IN_PROGRESS" && "ring-2 ring-blue-500 shadow-lg",
                    apt.status === "AWAITING_CONFIRMATION" && "ring-2 ring-amber-400 shadow-md",
                    (apt.status === "COMPLETED") && "opacity-60"
                )}>
                    <CardHeader className="pb-3 border-b bg-zinc-50/50">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <span className="w-6 h-6 rounded-full bg-zinc-900 text-white text-[10px] font-black flex items-center justify-center">
                                    {index + 1}
                                </span>
                                <CardTitle className="text-sm font-bold uppercase truncate max-w-[180px]">
                                    {apt.customer.user.name}
                                </CardTitle>
                            </div>
                            <Badge className={cn(
                                "text-[10px] font-black shadow-none",
                                apt.status === "CONFIRMED" && "bg-blue-100 text-blue-700",
                                apt.status === "EN_ROUTE" && "bg-amber-100 text-amber-700 animate-pulse",
                                apt.status === "IN_PROGRESS" && "bg-emerald-100 text-emerald-700",
                                apt.status === "AWAITING_CONFIRMATION" && "bg-orange-100 text-orange-700",
                                apt.status === "COMPLETED" && "bg-zinc-100 text-zinc-600"
                            )}>
                                {apt.status === "CONFIRMED" && "Pendente"}
                                {apt.status === "EN_ROUTE" && "A Caminho"}
                                {apt.status === "IN_PROGRESS" && "Em Execução"}
                                {apt.status === "AWAITING_CONFIRMATION" && "Aguardando Cliente"}
                                {apt.status === "COMPLETED" && "Finalizado"}
                            </Badge>
                        </div>
                    </CardHeader>
                    <CardContent className="pt-4 space-y-4">
                        <div className="flex items-start gap-3">
                            <MapPin className="w-4 h-4 text-zinc-400 mt-0.5 shrink-0" />
                            <div className="space-y-1">
                                <p className="text-sm font-medium leading-none">{apt.address}</p>
                                <Button variant="link" className="h-auto p-0 text-xs text-blue-600" asChild>
                                    <a href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(apt.address)}`} target="_blank">
                                        Abrir no GPS
                                    </a>
                                </Button>
                            </div>
                        </div>

                        <div className="flex items-center gap-6">
                            <div className="flex items-center gap-2">
                                <Clock className="w-4 h-4 text-zinc-400" />
                                <span className="text-sm font-bold">
                                    {new Date(apt.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                            </div>
                            <div className="flex items-center gap-2">
                                <AlertCircle className="w-4 h-4 text-zinc-400" />
                                <span className="text-sm text-muted-foreground">{apt.service.name}</span>
                            </div>
                        </div>

                        {/* Proof Photos Section - visible during IN_PROGRESS and AWAITING_CONFIRMATION */}
                        {(apt.status === "IN_PROGRESS" || apt.status === "AWAITING_CONFIRMATION") && (
                            <div className="border-t pt-4 space-y-3">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <Camera className="w-4 h-4 text-zinc-500" />
                                        <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider">
                                            Fotos ({apt.proofImages?.length || 0})
                                        </span>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-7 text-xs text-blue-600 font-bold gap-1"
                                        onClick={() => setShowPhotoInput(prev => ({
                                            ...prev,
                                            [apt.id]: !prev[apt.id]
                                        }))}
                                    >
                                        <Plus className="w-3 h-3" />
                                        Adicionar
                                    </Button>
                                </div>

                                {/* Existing photos thumbnails */}
                                {apt.proofImages && apt.proofImages.length > 0 && (
                                    <div className="flex gap-2 overflow-x-auto pb-1">
                                        {apt.proofImages.map((img: string, i: number) => (
                                            <div key={i} className="w-16 h-16 rounded-lg overflow-hidden bg-zinc-100 flex-shrink-0 ring-1 ring-zinc-200">
                                                <img src={img} alt={`Foto ${i + 1}`} className="w-full h-full object-cover" />
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* Add photo input */}
                                {showPhotoInput[apt.id] && (
                                    <div className="flex gap-2">
                                        <Input
                                            placeholder="URL da foto..."
                                            value={photoUrl[apt.id] || ""}
                                            onChange={e => setPhotoUrl(prev => ({ ...prev, [apt.id]: e.target.value }))}
                                            className="h-10 rounded-lg text-sm"
                                        />
                                        <Button
                                            size="sm"
                                            className="h-10 px-4 bg-blue-600 hover:bg-blue-700 rounded-lg font-bold"
                                            disabled={addingPhoto === apt.id}
                                            onClick={() => handleAddPhoto(apt.id)}
                                        >
                                            {addingPhoto === apt.id ? (
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                            ) : (
                                                <ImageIcon className="w-4 h-4" />
                                            )}
                                        </Button>
                                    </div>
                                )}
                            </div>
                        )}

                        {apt.status !== "COMPLETED" && apt.status !== "AWAITING_CONFIRMATION" && (
                            <div className="pt-2">
                                <Button
                                    className={cn(
                                        "w-full h-12 rounded-xl font-bold uppercase shadow-sm active:scale-[0.98] transition-all",
                                        apt.status === "CONFIRMED" && "bg-zinc-900 hover:bg-zinc-800",
                                        apt.status === "EN_ROUTE" && "bg-amber-500 hover:bg-amber-600",
                                        apt.status === "IN_PROGRESS" && "bg-emerald-600 hover:bg-emerald-700"
                                    )}
                                    disabled={loadingAptId === apt.id}
                                    onClick={() => handleAction(apt.id, apt.status)}
                                >
                                    {loadingAptId === apt.id ? (
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                    ) : (
                                        <>
                                            {apt.status === "CONFIRMED" && (
                                                <><Navigation className="w-4 h-4 mr-2" /> Iniciar Deslocamento</>
                                            )}
                                            {apt.status === "EN_ROUTE" && (
                                                <><Play className="w-4 h-4 mr-2" /> Cheguei no Local</>
                                            )}
                                            {apt.status === "IN_PROGRESS" && (
                                                <><CheckCircle2 className="w-4 h-4 mr-2" /> Finalizar Serviço</>
                                            )}
                                        </>
                                    )}
                                </Button>
                            </div>
                        )}
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}

function CalendarIcon(props: any) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M8 2v4" />
            <path d="M16 2v4" />
            <rect width="18" height="18" x="3" y="4" rx="2" />
            <path d="M3 10h18" />
        </svg>
    )
}
