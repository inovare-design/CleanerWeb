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

export function EditClientModal({ client }: EditClientModalProps) {
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
                <Button variant="outline">
                    <Pencil className="mr-2 h-4 w-4" /> Editar Perfil
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
                <form onSubmit={handleSubmit}>
                    <DialogHeader>
                        <DialogTitle>Editar Cliente</DialogTitle>
                        <DialogDescription>
                            Atualize as informações, tipo e frequência de serviço.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-6 py-4">
                        {error && (
                            <div className="bg-red-100 text-red-600 p-2 rounded-md text-sm">
                                {error}
                            </div>
                        )}

                        {/* Dados Pessoais e Tipo */}
                        <div className="space-y-4">
                            <h3 className="text-sm font-medium text-muted-foreground border-b pb-1">Identificação</h3>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Tipo de Cliente</Label>
                                    <Select value={clientType} onValueChange={setClientType} name="_type_ignore">
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="PERSONAL">Pessoa Física</SelectItem>
                                            <SelectItem value="BUSINESS">Empresa</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="document">{clientType === "BUSINESS" ? "CNPJ" : "CPF"}</Label>
                                    <Input
                                        id="document"
                                        name="document"
                                        defaultValue={client.customerProfile?.document}
                                        placeholder={clientType === "BUSINESS" ? "00.000.000/0000-00" : "000.000.000-00"}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="name">{clientType === "BUSINESS" ? "Razão Social / Nome Fantasia" : "Nome Completo"}</Label>
                                    <Input id="name" name="name" defaultValue={client.name} required />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="email">Email</Label>
                                    <Input id="email" name="email" type="email" defaultValue={client.email} required />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="phone">Telefone</Label>
                                    <Input id="phone" name="phone" defaultValue={client.customerProfile?.phone} />
                                </div>
                                {clientType === "PERSONAL" && (
                                    <div className="space-y-2">
                                        <Label htmlFor="birthDate">Data de Nascimento</Label>
                                        <Input
                                            id="birthDate"
                                            name="birthDate"
                                            type="date"
                                            defaultValue={client.customerProfile?.birthDate ? new Date(client.customerProfile.birthDate).toISOString().split('T')[0] : ''}
                                        />
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Frequência de Serviço */}
                        <div className="space-y-4">
                            <h3 className="text-sm font-medium text-muted-foreground border-b pb-1">Preferência de Estilo & Frequência</h3>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Frequência Desejada</Label>
                                    <Select value={frequency} onValueChange={setFrequency} name="_freq_ignore">
                                        <SelectTrigger>
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
                                    <div className="space-y-2">
                                        <Label htmlFor="timesPerWeek">Vezes por semana</Label>
                                        <Input
                                            id="timesPerWeek"
                                            name="timesPerWeek"
                                            type="number"
                                            min="1"
                                            max="7"
                                            defaultValue={existingDetails.timesPerWeek || 1}
                                        />
                                    </div>
                                )}
                            </div>

                            {frequency !== "ONE_TIME" && (
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <Label>Dias de Preferência</Label>
                                        <div className="flex flex-wrap gap-2">
                                            {WEEK_DAYS.map((day) => (
                                                <div key={day.id} className="flex items-center space-x-2 border p-2 rounded-md hover:bg-muted">
                                                    <Checkbox
                                                        id={day.id}
                                                        checked={selectedDays.includes(day.id)}
                                                        onCheckedChange={() => handleDayToggle(day.id)}
                                                    />
                                                    <label
                                                        htmlFor={day.id}
                                                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                                                    >
                                                        {day.label}
                                                    </label>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Configuração de Horários por Dia */}
                                    {selectedDays.length > 0 && (
                                        <div className="space-y-3 bg-muted/30 p-4 rounded-lg border">
                                            <h4 className="text-xs font-semibold uppercase text-muted-foreground">Horários por Dia Escolhido</h4>
                                            <div className="grid gap-4">
                                                {WEEK_DAYS.filter(d => selectedDays.includes(d.id)).map((day) => (
                                                    <div key={day.id} className="grid grid-cols-3 items-center gap-4 border-b pb-2 last:border-0 last:pb-0">
                                                        <span className="text-sm font-medium">{day.label}</span>
                                                        <div className="space-y-1">
                                                            <Label className="text-[10px] uppercase">Início</Label>
                                                            <Input
                                                                type="time"
                                                                className="h-8 text-xs"
                                                                value={daySettings[day.id]?.startTime || ""}
                                                                onChange={(e) => handleTimeChange(day.id, 'startTime', e.target.value)}
                                                            />
                                                        </div>
                                                        <div className="space-y-1">
                                                            <Label className="text-[10px] uppercase">Fim</Label>
                                                            <Input
                                                                type="time"
                                                                className="h-8 text-xs"
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

                            {(frequency === "WEEKLY" || frequency === "BIWEEKLY" || frequency === "MONTHLY") && (
                                <div className="space-y-2">
                                    <Label htmlFor="billingDay">Dia Preferencial de Cobrança</Label>
                                    <Select name="billingDay" defaultValue={String(client.customerProfile?.billingDay || "1")}>
                                        <SelectTrigger>
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
                                    <p className="text-[10px] text-muted-foreground">
                                        Para clientes recorrentes, todas as faturas em aberto serão cobradas neste dia.
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* Endereço */}
                        <div className="space-y-4">
                            <h3 className="text-sm font-medium text-muted-foreground border-b pb-1">Endereço</h3>
                            <div className="space-y-2">
                                <Label htmlFor="address">Endereço Completo</Label>
                                <Input id="address" name="address" defaultValue={client.customerProfile?.address} />
                            </div>
                        </div>

                        {/* Detalhes do Imóvel */}
                        <div className="space-y-4">
                            <h3 className="text-sm font-medium text-muted-foreground border-b pb-1">Detalhes do Imóvel</h3>
                            <div className="grid grid-cols-3 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="bedrooms">Quartos</Label>
                                    <Input id="bedrooms" name="bedrooms" type="number" defaultValue={client.customerProfile?.bedrooms} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="bathrooms">Banheiros</Label>
                                    <Input id="bathrooms" name="bathrooms" type="number" defaultValue={client.customerProfile?.bathrooms} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="footage">Metragem</Label>
                                    <Input id="footage" name="footage" defaultValue={client.customerProfile?.footage} placeholder="Ex: 120m²" />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="accessInfo">Informações de Acesso</Label>
                                <Textarea
                                    id="accessInfo"
                                    name="accessInfo"
                                    defaultValue={client.customerProfile?.accessInfo}
                                    placeholder="Códigos de portaria, local das chaves, etc."
                                />
                            </div>
                        </div>

                        {/* Anotações */}
                        <div className="space-y-4">
                            <h3 className="text-sm font-medium text-muted-foreground border-b pb-1">Anotações Internas</h3>
                            <div className="space-y-2">
                                <Textarea
                                    id="notes"
                                    name="notes"
                                    defaultValue={client.customerProfile?.notes}
                                    placeholder="Observações sobre o cliente..."
                                />
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="submit" disabled={isLoading}>
                            {isLoading ? "Salvando..." : "Salvar Alterações"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
