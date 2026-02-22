"use client";

import { useState } from "react";
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
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { updateClient } from "@/actions/update-client";
import { useRouter } from "next/navigation";
import { Pencil } from "lucide-react";

interface EditClientModalProps {
    client: any;
    trigger?: React.ReactNode;
}

const WEEK_DAYS = [
    { id: "seg", label: "Seg" },
    { id: "ter", label: "Ter" },
    { id: "qua", label: "Qua" },
    { id: "qui", label: "Qui" },
    { id: "sex", label: "Sex" },
    { id: "sab", label: "Sáb" },
    { id: "dom", label: "Dom" },
];

export function EditClientModal({ client, trigger }: EditClientModalProps) {
    const [open, setOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");
    const router = useRouter();

    // State for conditional rendering
    const [clientType, setClientType] = useState(client.customerProfile?.type || "PERSONAL");
    const [frequency, setFrequency] = useState(client.customerProfile?.frequency || "ONE_TIME");

    // Parse existing details if available
    const existingDetails = client.customerProfile?.frequencyDetails ? JSON.parse(client.customerProfile.frequencyDetails) : {};
    const [selectedDays, setSelectedDays] = useState<string[]>(Array.isArray(existingDetails.days) ? existingDetails.days : []);

    // Novo estado para configurações pro dia (mapeamento de ID do dia -> {startTime, endTime})
    // Se vier do formato antigo (startTime/endTime globais), migramos.
    const initialDaySettings: Record<string, { startTime: string; endTime: string }> = existingDetails.daySettings || {};
    if (!existingDetails.daySettings && (existingDetails.startTime || existingDetails.endTime)) {
        selectedDays.forEach(dayId => {
            initialDaySettings[dayId] = {
                startTime: existingDetails.startTime || "",
                endTime: existingDetails.endTime || ""
            };
        });
    }
    const [daySettings, setDaySettings] = useState(initialDaySettings);

    const handleDayToggle = (dayId: string) => {
        setSelectedDays(prev => {
            const isSelected = prev.includes(dayId);
            if (isSelected) {
                const newDays = prev.filter(d => d !== dayId);
                const newSettings = { ...daySettings };
                delete newSettings[dayId];
                setDaySettings(newSettings);
                return newDays;
            } else {
                return [...prev, dayId];
            }
        });
    };

    const handleTimeChange = (dayId: string, field: 'startTime' | 'endTime', value: string) => {
        setDaySettings(prev => ({
            ...prev,
            [dayId]: {
                ...prev[dayId],
                [field]: value
            }
        }));
    };

    async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setIsLoading(true);
        setError("");

        const formData = new FormData(event.currentTarget);
        formData.append("id", client.id);

        // Add manual fields
        formData.append("type", clientType);
        formData.append("frequency", frequency);

        if (frequency !== "ONE_TIME") {
            const details = {
                timesPerWeek: formData.get("timesPerWeek"),
                days: selectedDays,
                daySettings
            };
            formData.append("frequencyDetails", JSON.stringify(details));
        }

        const result = await updateClient(formData);

        setIsLoading(false);

        if (result.error) {
            setError(result.error);
        } else if (result.success) {
            setOpen(false);
            router.refresh();
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {trigger || (
                    <Button variant="outline">
                        <Pencil className="mr-2 h-4 w-4" /> Editar Perfil
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[800px] max-h-[95vh] overflow-y-auto">
                <form onSubmit={handleSubmit} className="space-y-6 pt-2">
                    <DialogHeader>
                        <DialogTitle>Editar Cliente</DialogTitle>
                        <DialogDescription>
                            Atualize as informações, tipo e frequência de serviço.
                        </DialogDescription>
                    </DialogHeader>

                    {error && (
                        <div className="bg-red-100 text-red-600 p-2 rounded-md text-sm">
                            {error}
                        </div>
                    )}

                    <div className="grid gap-6">
                        {/* Dados Pessoais e Tipo */}
                        <section className="space-y-3">
                            <h3 className="text-xs font-semibold uppercase text-muted-foreground border-b pb-1">Identificação</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                <div className="space-y-1.5">
                                    <Label className="text-xs">Tipo de Cliente</Label>
                                    <Select value={clientType} onValueChange={setClientType} name="_type_ignore">
                                        <SelectTrigger className="h-8 text-xs">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="PERSONAL">Pessoa Física</SelectItem>
                                            <SelectItem value="BUSINESS">Empresa</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-1.5">
                                    <Label htmlFor="document" className="text-xs">{clientType === "BUSINESS" ? "CNPJ" : "CPF"}</Label>
                                    <Input
                                        id="document"
                                        name="document"
                                        className="h-8 text-xs"
                                        defaultValue={client.customerProfile?.document}
                                        placeholder={clientType === "BUSINESS" ? "00.000.000/0000-00" : "000.000.000-00"}
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <Label htmlFor="name" className="text-xs">{clientType === "BUSINESS" ? "Razão Social" : "Nome Completo"}</Label>
                                    <Input id="name" name="name" className="h-8 text-xs" defaultValue={client.name} required />
                                </div>
                                <div className="space-y-1.5">
                                    <Label htmlFor="email" className="text-xs">Email</Label>
                                    <Input id="email" name="email" type="email" className="h-8 text-xs" defaultValue={client.email} required />
                                </div>
                                <div className="space-y-1.5">
                                    <Label htmlFor="phone" className="text-xs">Telefone</Label>
                                    <Input id="phone" name="phone" className="h-8 text-xs" defaultValue={client.customerProfile?.phone} />
                                </div>
                                {clientType === "PERSONAL" && (
                                    <div className="space-y-1.5">
                                        <Label htmlFor="birthDate" className="text-xs">Nascimento</Label>
                                        <Input
                                            id="birthDate"
                                            name="birthDate"
                                            type="date"
                                            className="h-8 text-xs"
                                            defaultValue={client.customerProfile?.birthDate ? new Date(client.customerProfile.birthDate).toISOString().split('T')[0] : ''}
                                        />
                                    </div>
                                )}
                            </div>
                        </section>

                        {/* Localização */}
                        <section className="space-y-3">
                            <h3 className="text-xs font-semibold uppercase text-muted-foreground border-b pb-1">Localização</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                                <div className="md:col-span-2 space-y-1.5">
                                    <Label htmlFor="address" className="text-xs">Endereço Completo</Label>
                                    <Input id="address" name="address" className="h-8 text-xs" defaultValue={client.customerProfile?.address} />
                                </div>
                                <div className="space-y-1.5">
                                    <Label htmlFor="zipCode" className="text-xs">Postcode / CEP</Label>
                                    <Input id="zipCode" name="zipCode" className="h-8 text-xs" defaultValue={client.customerProfile?.zipCode} placeholder="Postcode" />
                                </div>
                                <div className="space-y-1.5">
                                    <Label htmlFor="city" className="text-xs">Cidade</Label>
                                    <Input id="city" name="city" className="h-8 text-xs" defaultValue={client.customerProfile?.city} placeholder="City" />
                                </div>
                                <div className="md:col-span-1 space-y-1.5">
                                    <Label htmlFor="area" className="text-xs">Região (Area)</Label>
                                    <Input id="area" name="area" className="h-8 text-xs" defaultValue={client.customerProfile?.area} placeholder="Region/Area" />
                                </div>
                            </div>
                        </section>

                        {/* Estilo & Frequência */}
                        <section className="space-y-3">
                            <h3 className="text-xs font-semibold uppercase text-muted-foreground border-b pb-1">Estilo & Frequência</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                                <div className="space-y-1.5">
                                    <Label className="text-xs">Frequência</Label>
                                    <Select value={frequency} onValueChange={setFrequency} name="_freq_ignore">
                                        <SelectTrigger className="h-8 text-xs">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="ONE_TIME">Uma vez (Avulso)</SelectItem>
                                            <SelectItem value="WEEKLY">Semanal</SelectItem>
                                            <SelectItem value="BIWEEKLY">Quinzenal</SelectItem>
                                            <SelectItem value="MONTHLY">Mensal</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                {(frequency === "WEEKLY" || frequency === "BIWEEKLY") && (
                                    <div className="space-y-1.5">
                                        <Label htmlFor="timesPerWeek" className="text-xs">Vezes por semana</Label>
                                        <Input
                                            id="timesPerWeek"
                                            name="timesPerWeek"
                                            type="number"
                                            min="1"
                                            max="7"
                                            className="h-8 text-xs"
                                            defaultValue={existingDetails.timesPerWeek || 1}
                                        />
                                    </div>
                                )}

                                {(frequency === "WEEKLY" || frequency === "BIWEEKLY" || frequency === "MONTHLY") && (
                                    <div className="space-y-1.5">
                                        <Label htmlFor="billingDay" className="text-xs">Dia Cobrança</Label>
                                        <Select name="billingDay" defaultValue={String(client.customerProfile?.billingDay || "1")}>
                                            <SelectTrigger className="h-8 text-xs">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => (
                                                    <SelectItem key={day} value={String(day)}>
                                                        Dia {day}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                )}
                            </div>

                            {frequency !== "ONE_TIME" && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                                    <div className="space-y-2">
                                        <Label className="text-xs">Dias de Preferência</Label>
                                        <div className="flex flex-wrap gap-1.5">
                                            {WEEK_DAYS.map((day) => (
                                                <div key={day.id} className="flex items-center space-x-1 border px-1.5 py-1 rounded hover:bg-muted bg-background">
                                                    <Checkbox
                                                        id={day.id}
                                                        className="h-3.5 w-3.5"
                                                        checked={selectedDays.includes(day.id)}
                                                        onCheckedChange={() => handleDayToggle(day.id)}
                                                    />
                                                    <label
                                                        htmlFor={day.id}
                                                        className="text-[10px] font-medium leading-none cursor-pointer"
                                                    >
                                                        {day.label}
                                                    </label>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {selectedDays.length > 0 && (
                                        <div className="space-y-2 bg-muted/20 p-2 rounded border border-dashed">
                                            <h4 className="text-[10px] font-bold uppercase text-muted-foreground">Horários</h4>
                                            <div className="grid gap-2">
                                                {WEEK_DAYS.filter(d => selectedDays.includes(d.id)).map((day) => (
                                                    <div key={day.id} className="grid grid-cols-5 items-center gap-2 border-b pb-1 last:border-0 last:pb-0">
                                                        <span className="text-[10px] font-semibold col-span-1">{day.label}</span>
                                                        <div className="col-span-2 flex items-center gap-1">
                                                            <Input
                                                                type="time"
                                                                className="h-6 text-[10px] px-1"
                                                                value={daySettings[day.id]?.startTime || ""}
                                                                onChange={(e) => handleTimeChange(day.id, 'startTime', e.target.value)}
                                                            />
                                                            <span className="text-[10px]">às</span>
                                                            <Input
                                                                type="time"
                                                                className="h-6 text-[10px] px-1"
                                                                value={daySettings[day.id]?.endTime || ""}
                                                                onChange={(e) => handleTimeChange(day.id, 'endTime', e.target.value)}
                                                            />
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </section>

                        {/* Imóvel e Notas */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <section className="space-y-3">
                                <h3 className="text-xs font-semibold uppercase text-muted-foreground border-b pb-1">Imóvel</h3>
                                <div className="grid grid-cols-3 gap-3">
                                    <div className="space-y-1.5">
                                        <Label htmlFor="bedrooms" className="text-xs">Quartos</Label>
                                        <Input id="bedrooms" name="bedrooms" type="number" className="h-8 text-xs" defaultValue={client.customerProfile?.bedrooms} />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label htmlFor="bathrooms" className="text-xs">Banh.</Label>
                                        <Input id="bathrooms" name="bathrooms" type="number" className="h-8 text-xs" defaultValue={client.customerProfile?.bathrooms} />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label htmlFor="footage" className="text-xs">Metragem</Label>
                                        <Input id="footage" name="footage" className="h-8 text-xs" defaultValue={client.customerProfile?.footage} placeholder="Ex: 120m²" />
                                    </div>
                                </div>
                                <div className="space-y-1.5">
                                    <Label htmlFor="accessInfo" className="text-xs">Acesso / Chaves</Label>
                                    <Input
                                        id="accessInfo"
                                        name="accessInfo"
                                        className="h-8 text-xs"
                                        defaultValue={client.customerProfile?.accessInfo}
                                        placeholder="Códigos, local das chaves, etc."
                                    />
                                </div>
                            </section>

                            <section className="space-y-3 flex flex-col">
                                <h3 className="text-xs font-semibold uppercase text-muted-foreground border-b pb-1">Notas Internas</h3>
                                <div className="space-y-1.5 flex-1">
                                    <Textarea
                                        id="notes"
                                        name="notes"
                                        className="min-h-[100px] text-xs resize-none"
                                        defaultValue={client.customerProfile?.notes}
                                        placeholder="Observações importantes..."
                                    />
                                </div>
                            </section>
                        </div>
                    </div>

                    <DialogFooter className="sticky bottom-0 bg-background pt-4 border-t">
                        <Button type="submit" disabled={isLoading} className="w-full md:w-auto">
                            {isLoading ? "Salvando..." : "Salvar Alterações"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
