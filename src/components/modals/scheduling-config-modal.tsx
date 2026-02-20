"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Settings, Plus, X, Loader2 } from "lucide-react";
import { saveSchedulingConfig } from "@/actions/save-scheduling-config";
// import { toast } from "sonner"; 

type SchedulingConfigModalProps = {
    initialConfig?: {
        availability: string;
        holidays: string;
        rateNormal: number;
        rateNormal2: number;
        rateUrgent: number;
        minDurationMin: number;
    } | null;
};

const DAYS = [
    { id: "0", label: "Domingo" },
    { id: "1", label: "Segunda" },
    { id: "2", label: "Terça" },
    { id: "3", label: "Quarta" },
    { id: "4", label: "Quinta" },
    { id: "5", label: "Sexta" },
    { id: "6", label: "Sábado" },
];

export function SchedulingConfigModal({ initialConfig }: SchedulingConfigModalProps) {
    const [open, setOpen] = useState(false);
    const [isPending, startTransition] = useTransition();

    // Default values if null
    const defaultConfig = {
        availability: "{}",
        holidays: "[]",
        rateNormal: 50,
        rateNormal2: 75,
        rateUrgent: 100,
        minDurationMin: 60
    };

    const config = initialConfig || defaultConfig;

    // State for form fields
    const [availability, setAvailability] = useState<Record<string, { start: string; end: string }[]>>(
        JSON.parse(config.availability || "{}")
    );
    const [holidays, setHolidays] = useState<string[]>(
        JSON.parse(config.holidays || "[]")
    );
    const [rateNormal, setRateNormal] = useState(config.rateNormal);
    const [rateNormal2, setRateNormal2] = useState(config.rateNormal2);
    const [rateUrgent, setRateUrgent] = useState(config.rateUrgent);
    const [minDurationMin, setMinDurationMin] = useState(config.minDurationMin);

    // Helper to add a time range
    const addTimeRange = (dayId: string) => {
        setAvailability(prev => {
            const ranges = prev[dayId] || [];
            return {
                ...prev,
                [dayId]: [...ranges, { start: "08:00", end: "18:00" }]
            };
        });
    };

    // Helper to remove a time range
    const removeTimeRange = (dayId: string, index: number) => {
        setAvailability(prev => {
            const ranges = prev[dayId] || [];
            const newRanges = [...ranges];
            newRanges.splice(index, 1);
            return { ...prev, [dayId]: newRanges };
        });
    };

    // Helper to update a time range
    const updateTimeRange = (dayId: string, index: number, field: "start" | "end", value: string) => {
        setAvailability(prev => {
            const ranges = prev[dayId] || [];
            const newRanges = [...ranges];
            newRanges[index] = { ...newRanges[index], [field]: value };
            return { ...prev, [dayId]: newRanges };
        });
    };

    const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        const formData = new FormData();
        formData.append("availability", JSON.stringify(availability));
        formData.append("holidays", JSON.stringify(holidays)); // Simplified: Not editing holidays yet in UI but keeping state
        formData.append("rateNormal", String(rateNormal));
        formData.append("rateNormal2", String(rateNormal2));
        formData.append("rateUrgent", String(rateUrgent));
        formData.append("minDurationMin", String(minDurationMin));

        startTransition(async () => {
            const result = await saveSchedulingConfig(formData);
            if (result.error) {
                alert(result.error);
            } else {
                alert("Configurações salvas com sucesso!");
                setOpen(false);
            }
        });
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" size="icon">
                    <Settings className="h-4 w-4" />
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
                <form onSubmit={handleSubmit}>
                    <DialogHeader>
                        <DialogTitle>Configuração de Agendamento</DialogTitle>
                        <DialogDescription>
                            Defina horários de atendimento, feriados e taxas por prioridade.
                        </DialogDescription>
                    </DialogHeader>

                    <Tabs defaultValue="hours" className="w-full mt-4">
                        <TabsList className="grid w-full grid-cols-2">
                            <TabsTrigger value="hours">Horários</TabsTrigger>
                            <TabsTrigger value="rates">Taxas & Prioridades</TabsTrigger>
                        </TabsList>

                        <TabsContent value="hours" className="space-y-4 py-4">
                            <div className="space-y-4">
                                {DAYS.map(day => (
                                    <div key={day.id} className="border-b pb-4 last:border-0">
                                        <div className="flex items-center justify-between mb-2">
                                            <Label className="font-medium">{day.label}</Label>
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => addTimeRange(day.id)}
                                                className="h-6 text-xs"
                                            >
                                                <Plus className="w-3 h-3 mr-1" /> Adicionar
                                            </Button>
                                        </div>
                                        <div className="space-y-2">
                                            {(availability[day.id] || []).length === 0 ? (
                                                <p className="text-xs text-muted-foreground italic">Fechado</p>
                                            ) : (
                                                (availability[day.id] || []).map((range, idx) => (
                                                    <div key={idx} className="flex items-center gap-2">
                                                        <Input
                                                            type="time"
                                                            value={range.start}
                                                            onChange={(e) => updateTimeRange(day.id, idx, "start", e.target.value)}
                                                            className="h-8 text-xs w-24"
                                                        />
                                                        <span className="text-xs text-muted-foreground">até</span>
                                                        <Input
                                                            type="time"
                                                            value={range.end}
                                                            onChange={(e) => updateTimeRange(day.id, idx, "end", e.target.value)}
                                                            className="h-8 text-xs w-24"
                                                        />
                                                        <Button
                                                            type="button"
                                                            variant="ghost"
                                                            size="icon"
                                                            onClick={() => removeTimeRange(day.id, idx)}
                                                            className="h-8 w-8 text-destructive hover:text-destructive/90"
                                                        >
                                                            <X className="w-3 h-3" />
                                                        </Button>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </TabsContent>

                        <TabsContent value="rates" className="space-y-4 py-4">
                            <div className="grid gap-4">
                                <div className="grid grid-cols-2 items-center gap-4">
                                    <Label htmlFor="rateNormal">Taxa Normal (R$/h)</Label>
                                    <Input
                                        id="rateNormal"
                                        type="number"
                                        step="0.01"
                                        value={rateNormal}
                                        onChange={(e) => setRateNormal(Number(e.target.value))}
                                    />
                                </div>
                                <div className="grid grid-cols-2 items-center gap-4">
                                    <Label htmlFor="rateNormal2">Taxa Normal 2 (R$/h)</Label>
                                    <Input
                                        id="rateNormal2"
                                        type="number"
                                        step="0.01"
                                        value={rateNormal2}
                                        onChange={(e) => setRateNormal2(Number(e.target.value))}
                                    />
                                    <p className="text-[10px] text-muted-foreground col-span-2 text-right">
                                        Usado para horários de alta demanda ou finais de semana.
                                    </p>
                                </div>
                                <div className="grid grid-cols-2 items-center gap-4">
                                    <Label htmlFor="rateUrgent">Taxa Urgente (R$/h)</Label>
                                    <Input
                                        id="rateUrgent"
                                        type="number"
                                        step="0.01"
                                        value={rateUrgent}
                                        onChange={(e) => setRateUrgent(Number(e.target.value))}
                                    />
                                </div>
                                <div className="grid grid-cols-2 items-center gap-4">
                                    <Label htmlFor="minDurationMin">Tempo Mínimo (Minutos)</Label>
                                    <Input
                                        id="minDurationMin"
                                        type="number"
                                        step="30"
                                        value={minDurationMin}
                                        onChange={(e) => setMinDurationMin(Number(e.target.value))}
                                    />
                                </div>
                            </div>
                        </TabsContent>
                    </Tabs>

                    <DialogFooter>
                        <Button type="submit" disabled={isPending}>
                            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Salvar Configurações
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
