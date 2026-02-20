"use client";

import { useState, useEffect } from "react";
import { getAvailableSlots } from "@/actions/get-available-slots";
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
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Plus } from "lucide-react";
import { createAppointment } from "@/actions/create-appointment";
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectLabel,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

type PropType = {
    children?: React.ReactNode;
    clients: { id: string; name: string | null; email: string; customerProfile?: { id: string; address: string | null } | null }[];
    services: { id: string; name: string; durationMin: number; price: number }[];
    employees: { id: string; name: string | null; employeeProfile?: { id: string } | null }[];
    minDuration?: number;
};

export function CreateAppointmentModal({ clients, services, employees, minDuration = 60 }: PropType) {
    const [open, setOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");

    // State básico para autopreencher endereço
    const [selectedClientId, setSelectedClientId] = useState("");
    const [selectedServiceId, setSelectedServiceId] = useState("");
    const [selectedEmployeeId, setSelectedEmployeeId] = useState("");
    const [address, setAddress] = useState("");

    // Date/Time Availability State
    const [selectedDate, setSelectedDate] = useState("");
    const [availableSlots, setAvailableSlots] = useState<{ time: string; available: boolean }[]>([]);
    const [loadingSlots, setLoadingSlots] = useState(false);
    const [selectedTime, setSelectedTime] = useState("");
    const [selectedDuration, setSelectedDuration] = useState(minDuration);

    // Fetch slots when Date or Service changes
    useEffect(() => {
        if (!selectedDate || !selectedServiceId) return;

        const fetchSlots = async () => {
            setLoadingSlots(true);
            const service = services.find(s => s.id === selectedServiceId);
            const duration = service ? service.durationMin : 60;

            const result = await getAvailableSlots(selectedDate, duration);
            if (result.slots) {
                setAvailableSlots(result.slots);
            }
            setLoadingSlots(false);
        };
        fetchSlots();
    }, [selectedDate, selectedServiceId, services]);

    // Gerar opções de duração (de minDuration até 480 min / 8h)
    const durationOptions = [];
    for (let d = minDuration; d <= 480; d += 30) {
        durationOptions.push(d);
    }

    const calculatePrice = () => {
        if (!selectedDuration || !selectedServiceId) return 0;
        const service = services.find(s => s.id === selectedServiceId);
        if (!service) return 0;

        const durationHours = selectedDuration / 60;
        return durationHours * (service.price);
    };

    const totalPrice = calculatePrice();

    const handleClientChange = (customerId: string) => {
        setSelectedClientId(customerId);
        const client = clients.find(c => c.customerProfile?.id === customerId);
        if (client?.customerProfile?.address) {
            setAddress(client.customerProfile.address);
        }
    };

    async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setIsLoading(true);
        setError("");

        const formData = new FormData(event.currentTarget);
        const result = await createAppointment(formData);

        setIsLoading(false);

        if (result.error) {
            setError(result.error);
        } else {
            setOpen(false);
            // Reset form logic if needed
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className="bg-violet-600 hover:bg-violet-700">
                    <Plus className="mr-2 h-4 w-4" /> Novo Agendamento
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
                <form onSubmit={handleSubmit}>
                    <DialogHeader>
                        <DialogTitle>Agendar Serviço</DialogTitle>
                        <DialogDescription>
                            Crie uma ordem de serviço associando cliente, serviço e equipe.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        {error && (
                            <div className="bg-red-100 text-red-600 p-2 rounded-md text-sm">
                                {error}
                            </div>
                        )}

                        {/* Cliente Select */}
                        <div className="grid grid-cols-4 items-start gap-4">
                            <div className="text-right pt-2">
                                <Label htmlFor="customerId">Cliente</Label>
                                <p className="text-[10px] text-muted-foreground">Quem receberá o serviço?</p>
                            </div>
                            <div className="col-span-3">
                                <Select required onValueChange={handleClientChange}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Selecione o cliente" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectGroup>
                                            <SelectLabel>Clientes</SelectLabel>
                                            {clients.filter(c => c.customerProfile).map(client => (
                                                <SelectItem key={client.id} value={client.customerProfile!.id}>
                                                    {client.name} ({client.email})
                                                </SelectItem>
                                            ))}
                                        </SelectGroup>
                                    </SelectContent>
                                </Select>
                                <input type="hidden" name="customerId" value={selectedClientId} />
                            </div>
                        </div>

                        {/* Serviço Select */}
                        <div className="grid grid-cols-4 items-start gap-4">
                            <div className="text-right pt-2">
                                <Label htmlFor="serviceId">Serviço</Label>
                                <p className="text-[10px] text-muted-foreground">O que será feito?</p>
                            </div>
                            <div className="col-span-3">
                                <Select required onValueChange={(value) => setSelectedServiceId(value)}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Selecione o serviço" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {services.map(service => (
                                            <SelectItem key={service.id} value={service.id}>
                                                {service.name} ({service.durationMin}min - R${Number(service.price)})
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <input type="hidden" name="serviceId" value={selectedServiceId} />
                            </div>
                        </div>

                        {/* Funcionario Select */}
                        <div className="grid grid-cols-4 items-start gap-4">
                            <div className="text-right pt-2">
                                <Label htmlFor="employeeId">Profissional</Label>
                                <p className="text-[10px] text-muted-foreground">Opcional</p>
                            </div>
                            <div className="col-span-3">
                                <Select onValueChange={(value) => setSelectedEmployeeId(value)}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Selecione (Opcional)" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="unassigned">-- A definir --</SelectItem>
                                        {employees.filter(e => e.employeeProfile).map(emp => (
                                            <SelectItem key={emp.id} value={emp.employeeProfile!.id}>
                                                {emp.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <input type="hidden" name="employeeId" value={selectedEmployeeId} />
                            </div>
                        </div>

                        <div className="grid grid-cols-4 items-start gap-4">
                            <div className="text-right pt-2">
                                <Label htmlFor="date">Data & Hora</Label>
                                <p className="text-[10px] text-muted-foreground">Quando?</p>
                            </div>
                            <div className="col-span-3 space-y-2">
                                <Input
                                    id="date"
                                    name="date"
                                    type="date"
                                    required
                                    value={selectedDate}
                                    onChange={(e) => setSelectedDate(e.target.value)}
                                />
                                <div className="grid grid-cols-2 gap-2">
                                    <Select onValueChange={(t) => setSelectedTime(t)} disabled={!selectedDate || loadingSlots}>
                                        <SelectTrigger>
                                            <SelectValue placeholder={loadingSlots ? "Carregando..." : (selectedTime || "Início")} />
                                        </SelectTrigger>
                                        <SelectContent className="max-h-[200px]">
                                            {availableSlots.length > 0 ? (
                                                availableSlots.map(slot => (
                                                    <SelectItem key={slot.time} value={slot.time} disabled={!slot.available}>
                                                        {slot.time} {slot.available ? "" : "(Ocupado)"}
                                                    </SelectItem>
                                                ))
                                            ) : (
                                                <SelectItem value="none" disabled>Nenhum horário</SelectItem>
                                            )}
                                        </SelectContent>
                                    </Select>
                                    <Select
                                        defaultValue={String(minDuration)}
                                        onValueChange={(v) => setSelectedDuration(Number(v))}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Duração" />
                                        </SelectTrigger>
                                        <SelectContent className="max-h-[200px]">
                                            {durationOptions.map(d => (
                                                <SelectItem key={d} value={String(d)}>
                                                    {d / 60}h {d % 60 !== 0 ? "30min" : ""}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <input type="hidden" name="time" value={selectedTime} />
                                <input type="hidden" name="duration" value={selectedDuration} />
                                {totalPrice > 0 && (
                                    <p className="text-sm font-semibold text-violet-700 mt-1">
                                        Preço Estimado: R$ {totalPrice.toFixed(2)}
                                    </p>
                                )}
                            </div>
                        </div>

                        <div className="grid grid-cols-4 items-start gap-4">
                            <div className="text-right pt-2">
                                <Label htmlFor="address">Endereço</Label>
                                <p className="text-[10px] text-muted-foreground">Onde?</p>
                            </div>
                            <Input
                                id="address"
                                name="address"
                                className="col-span-3"
                                required
                                value={address}
                                onChange={(e) => setAddress(e.target.value)}
                                placeholder="Rua, número, complemento..."
                            />
                        </div>

                        <div className="grid grid-cols-4 items-start gap-4">
                            <div className="text-right pt-2">
                                <Label htmlFor="notes">Observações</Label>
                                <p className="text-[10px] text-muted-foreground">Detalhes extra</p>
                            </div>
                            <Textarea
                                id="notes"
                                name="notes"
                                className="col-span-3"
                                placeholder="Ex: Chave está no tapete, cuidado com o pet..."
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="submit" disabled={isLoading} className="bg-violet-600 hover:bg-violet-700">
                            {isLoading ? "Agendando..." : "Confirmar Agendamento"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
