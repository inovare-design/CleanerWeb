"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
    CalendarDays, X, AlertTriangle, RefreshCw, Loader2,
    MessageSquare, Camera, Send, Ban
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import {
    cancelAppointment,
    rescheduleAppointment,
    updateClientDetails
} from "@/actions/appointment-management";
import { useRouter } from "next/navigation";

interface AppointmentActionsProps {
    appointmentId: string;
    startTime: Date;
    status: string;
    clientNotes: string | null;
    clientImages: string[];
}

export function AppointmentActions({
    appointmentId,
    startTime,
    status,
    clientNotes,
    clientImages
}: AppointmentActionsProps) {
    const router = useRouter();
    const [showCancel, setShowCancel] = useState(false);
    const [showReschedule, setShowReschedule] = useState(false);
    const [showNotes, setShowNotes] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    // Reschedule state
    const [newDate, setNewDate] = useState<Date | undefined>(new Date(startTime));
    const [newTime, setNewTime] = useState(format(new Date(startTime), "HH:mm"));

    // Notes state
    const [notes, setNotes] = useState(clientNotes || "");
    const [imageUrl, setImageUrl] = useState("");
    const [images, setImages] = useState<string[]>(clientImages || []);

    const canModify = !["CANCELLED", "COMPLETED", "IN_PROGRESS", "EN_ROUTE"].includes(status);
    const canAddNotes = !["CANCELLED", "COMPLETED"].includes(status);

    const hoursUntilStart = (new Date(startTime).getTime() - new Date().getTime()) / (1000 * 60 * 60);
    const canCancel = canModify && hoursUntilStart > 0;
    const isWithin24h = hoursUntilStart < 24 && hoursUntilStart > 0;

    const handleCancel = async () => {
        setIsLoading(true);
        setError("");
        const result = await cancelAppointment(appointmentId);
        setIsLoading(false);

        if (result.error === "POLICY_VIOLATION") {
            setError(result.message || "Cancelamento não permitido.");
        } else if (result.error) {
            setError(result.error);
        } else {
            setSuccess(result.success || "Cancelado!");
            setTimeout(() => router.refresh(), 1500);
        }
    };

    const handleReschedule = async () => {
        if (!newDate || !newTime) return;
        setIsLoading(true);
        setError("");
        const dateStr = format(newDate, "yyyy-MM-dd");
        const result = await rescheduleAppointment(appointmentId, dateStr, newTime);
        setIsLoading(false);

        if (result.error) {
            setError(result.error);
        } else {
            setSuccess(result.success || "Reagendado!");
            setTimeout(() => router.refresh(), 1500);
        }
    };

    const handleSaveNotes = async () => {
        setIsLoading(true);
        setError("");
        const result = await updateClientDetails(appointmentId, notes, images);
        setIsLoading(false);

        if (result.error) {
            setError(result.error);
        } else {
            setSuccess(result.success || "Salvo!");
            setTimeout(() => { setSuccess(""); setShowNotes(false); }, 2000);
        }
    };

    const addImage = () => {
        if (imageUrl.trim()) {
            setImages(prev => [...prev, imageUrl.trim()]);
            setImageUrl("");
        }
    };

    const removeImage = (index: number) => {
        setImages(prev => prev.filter((_, i) => i !== index));
    };

    const hours = ["08:00", "08:30", "09:00", "09:30", "10:00", "10:30", "11:00", "11:30",
        "13:00", "13:30", "14:00", "14:30", "15:00", "15:30", "16:00", "16:30", "17:00", "17:30"];

    if (!canModify && !canAddNotes) return null;

    return (
        <div className="space-y-4">
            {/* Success/Error Messages */}
            {success && (
                <div className="bg-emerald-50 text-emerald-700 p-4 rounded-xl border border-emerald-200 text-sm font-medium text-center">
                    ✓ {success}
                </div>
            )}
            {error && (
                <div className="bg-red-50 text-red-700 p-4 rounded-xl border border-red-200 text-sm font-medium flex items-start gap-3">
                    <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <div>
                        <p className="font-bold">Atenção</p>
                        <p className="mt-1">{error}</p>
                    </div>
                </div>
            )}

            {/* Action Buttons */}
            <Card className="border-0 shadow-sm">
                <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-black uppercase tracking-widest text-zinc-400">
                        Gerenciar Agendamento
                    </CardTitle>
                </CardHeader>
                <CardContent className="pb-5 space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        {canAddNotes && (
                            <Button
                                variant="outline"
                                onClick={() => { setShowNotes(!showNotes); setShowCancel(false); setShowReschedule(false); }}
                                className={cn(
                                    "h-12 rounded-xl gap-2 font-bold border-2 transition-all",
                                    showNotes ? "border-blue-600 bg-blue-50 text-blue-700" : "border-zinc-200"
                                )}
                            >
                                <MessageSquare className="w-4 h-4" />
                                Comentários
                            </Button>
                        )}
                        {canModify && (
                            <Button
                                variant="outline"
                                onClick={() => { setShowReschedule(!showReschedule); setShowCancel(false); setShowNotes(false); setError(""); }}
                                className={cn(
                                    "h-12 rounded-xl gap-2 font-bold border-2 transition-all",
                                    showReschedule ? "border-violet-600 bg-violet-50 text-violet-700" : "border-zinc-200"
                                )}
                            >
                                <RefreshCw className="w-4 h-4" />
                                Reagendar
                            </Button>
                        )}
                        {canCancel && (
                            <Button
                                variant="outline"
                                onClick={() => { setShowCancel(!showCancel); setShowReschedule(false); setShowNotes(false); setError(""); }}
                                className={cn(
                                    "h-12 rounded-xl gap-2 font-bold border-2 transition-all",
                                    showCancel ? "border-red-600 bg-red-50 text-red-700" : "border-zinc-200 text-red-500 hover:text-red-600 hover:border-red-200"
                                )}
                            >
                                <Ban className="w-4 h-4" />
                                Cancelar
                            </Button>
                        )}
                    </div>

                    {/* Notes/Photos Panel */}
                    {showNotes && (
                        <div className="mt-4 p-4 bg-blue-50/50 rounded-xl border border-blue-100 space-y-4">
                            <div className="space-y-2">
                                <Label className="text-sm font-bold text-blue-700">Comentário para a equipe</Label>
                                <Textarea
                                    placeholder="Ex: A chave está debaixo do tapete, o portão lateral está aberto..."
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                    className="bg-white border-blue-200 focus:border-blue-400"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label className="text-sm font-bold text-blue-700 flex items-center gap-2">
                                    <Camera className="w-4 h-4" />
                                    Fotos de Referência
                                </Label>
                                <div className="flex gap-2">
                                    <Input
                                        placeholder="Cole a URL de uma imagem..."
                                        value={imageUrl}
                                        onChange={(e) => setImageUrl(e.target.value)}
                                        className="bg-white border-blue-200"
                                    />
                                    <Button size="sm" onClick={addImage} disabled={!imageUrl.trim()} className="bg-blue-600 hover:bg-blue-700">
                                        Adicionar
                                    </Button>
                                </div>
                                {images.length > 0 && (
                                    <div className="grid grid-cols-3 gap-2 mt-2">
                                        {images.map((img, i) => (
                                            <div key={i} className="relative group aspect-square rounded-lg overflow-hidden bg-zinc-100 border">
                                                <img src={img} alt={`Foto ${i + 1}`} className="w-full h-full object-cover" />
                                                <button
                                                    onClick={() => removeImage(i)}
                                                    className="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                                >
                                                    <X className="w-3 h-3" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <Button onClick={handleSaveNotes} disabled={isLoading} className="w-full bg-blue-600 hover:bg-blue-700 rounded-xl h-10 font-bold gap-2">
                                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                                Salvar Comentários
                            </Button>
                        </div>
                    )}

                    {/* Reschedule Panel */}
                    {showReschedule && (
                        <div className="mt-4 p-4 bg-violet-50/50 rounded-xl border border-violet-100 space-y-4">
                            <p className="text-sm font-bold text-violet-700">Escolha uma nova data e horário:</p>

                            <div className="flex flex-col sm:flex-row gap-4">
                                <div className="bg-white rounded-xl border border-violet-200 p-2">
                                    <Calendar
                                        mode="single"
                                        selected={newDate}
                                        onSelect={setNewDate}
                                        locale={ptBR}
                                        disabled={(day) => day < new Date(new Date().setHours(0, 0, 0, 0))}
                                    />
                                </div>

                                <div className="flex-1 space-y-2">
                                    <Label className="text-sm font-bold text-violet-700">Novo Horário</Label>
                                    <div className="grid grid-cols-3 gap-2">
                                        {hours.map(h => (
                                            <Button
                                                key={h}
                                                size="sm"
                                                variant={newTime === h ? "default" : "outline"}
                                                onClick={() => setNewTime(h)}
                                                className={cn(
                                                    "font-mono text-xs h-8",
                                                    newTime === h && "bg-violet-600 hover:bg-violet-700"
                                                )}
                                            >
                                                {h}
                                            </Button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <Button onClick={handleReschedule} disabled={isLoading || !newDate || !newTime} className="w-full bg-violet-600 hover:bg-violet-700 rounded-xl h-10 font-bold gap-2">
                                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CalendarDays className="w-4 h-4" />}
                                Confirmar Reagendamento
                            </Button>
                        </div>
                    )}

                    {/* Cancel Panel */}
                    {showCancel && (
                        <div className="mt-4 p-4 bg-red-50/50 rounded-xl border border-red-100 space-y-4">
                            {isWithin24h ? (
                                <div className="flex items-start gap-3 bg-amber-50 p-4 rounded-xl border border-amber-200">
                                    <AlertTriangle className="w-5 h-5 text-amber-500 mt-0.5 flex-shrink-0" />
                                    <div>
                                        <p className="font-bold text-amber-800 text-sm">Cancelamento não permitido</p>
                                        <p className="text-amber-700 text-xs mt-1 leading-relaxed">
                                            De acordo com nossa política, cancelamentos devem ser feitos com pelo menos <strong>24 horas de antecedência</strong>.
                                            Seu agendamento começa em {Math.round(hoursUntilStart)} horas. Para casos urgentes, entre em contato diretamente com nossa equipe.
                                        </p>
                                    </div>
                                </div>
                            ) : (
                                <>
                                    <div className="flex items-start gap-3">
                                        <AlertTriangle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
                                        <div>
                                            <p className="font-bold text-red-800 text-sm">Tem certeza que deseja cancelar?</p>
                                            <p className="text-red-600 text-xs mt-1">Esta ação não pode ser desfeita. O serviço será removido da agenda.</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-3">
                                        <Button
                                            variant="outline"
                                            onClick={() => setShowCancel(false)}
                                            className="flex-1 rounded-xl font-bold"
                                        >
                                            Manter Agendamento
                                        </Button>
                                        <Button
                                            onClick={handleCancel}
                                            disabled={isLoading}
                                            className="flex-1 bg-red-600 hover:bg-red-700 rounded-xl font-bold gap-2"
                                        >
                                            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <X className="w-4 h-4" />}
                                            Sim, Cancelar
                                        </Button>
                                    </div>
                                </>
                            )}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
