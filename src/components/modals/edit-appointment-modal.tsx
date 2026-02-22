"use client";

import { useState, useEffect } from "react";
import { getAvailableSlots } from "@/actions/get-available-slots";
import { updateAppointment } from "@/actions/update-appointment";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectLabel,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { format } from "date-fns";

type PropType = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    appointment: {
        id: string;
        customerId: string;
        serviceId: string;
        employeeId: string | null;
        startTime: Date;
        address: string;
        notes: string | null;
        status: string;
    };
    clients: { id: string; name: string | null; email: string; customerProfile?: { address: string | null } | null }[];
    services: { id: string; name: string; durationMin: number; price: number }[];
    employees: { id: string; name: string | null; employeeProfile?: { id: string } | null }[];
};

export function EditAppointmentModal({ open, onOpenChange, appointment, clients, services, employees }: PropType) {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");

    const [selectedClientId, setSelectedClientId] = useState(appointment.customerId);
    const [selectedServiceId, setSelectedServiceId] = useState(appointment.serviceId);
    const [selectedEmployeeId, setSelectedEmployeeId] = useState(appointment.employeeId || "");
    const [address, setAddress] = useState(appointment.address);
    const [notes, setNotes] = useState(appointment.notes || "");
    const [status, setStatus] = useState(appointment.status);

    // Date/Time Availability State
    const [selectedDate, setSelectedDate] = useState(format(new Date(appointment.startTime), "yyyy-MM-dd"));
    const [availableSlots, setAvailableSlots] = useState<{ time: string; available: boolean }[]>([]);
    const [loadingSlots, setLoadingSlots] = useState(false);
    const [selectedTime, setSelectedTime] = useState(format(new Date(appointment.startTime), "HH:mm"));

    // Sync state when modal opens or appointment changes
    useEffect(() => {
        if (open) {
            setSelectedClientId(appointment.customerId);
            setSelectedServiceId(appointment.serviceId);
            setSelectedEmployeeId(appointment.employeeId || "");
            setAddress(appointment.address);
            setNotes(appointment.notes || "");
            setStatus(appointment.status);
            setSelectedDate(format(new Date(appointment.startTime), "yyyy-MM-dd"));
            setSelectedTime(format(new Date(appointment.startTime), "HH:mm"));
        }
    }, [open, appointment]);

    // Fetch slots when Date or Service changes
    useEffect(() => {
        if (!selectedDate || !selectedServiceId) return;

        const fetchSlots = async () => {
            setLoadingSlots(true);
            const service = services.find(s => s.id === selectedServiceId);
            const duration = service ? service.durationMin : 60;

            const result = await getAvailableSlots(selectedDate, duration);
            if (result.slots) {
                // If editing, make sure current time is marked available if it's the same day/service
                const currentIsSame = selectedDate === format(new Date(appointment.startTime), "yyyy-MM-dd") && selectedServiceId === appointment.serviceId;

                const slots = result.slots.map(s => {
                    if (currentIsSame && s.time === format(new Date(appointment.startTime), "HH:mm")) {
                        return { ...s, available: true };
                    }
                    return s;
                });
                setAvailableSlots(slots);

                // If current selected time is not in slots (e.g. forced or legacy), add it as option
                if (!result.slots.some(s => s.time === selectedTime)) {
                    // Optionally handle this, but for now let's hope it matches grid or user changes it.
                }
            }
            setLoadingSlots(false);
        };
        fetchSlots();
    }, [selectedDate, selectedServiceId, services, appointment.startTime, appointment.serviceId, selectedTime]);

    const handleClientChange = (customerId: string) => {
        setSelectedClientId(customerId);
        // Only auto-fill address if it's empty or user wants (simple logic: update if changed)
        const client = clients.find(c => c.id === customerId);
        if (client?.customerProfile?.address) {
            setAddress(client.customerProfile.address);
        }
    };

    async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setIsLoading(true);
        setError("");

        const formData = new FormData();
        formData.append("id", appointment.id);
        formData.append("customerId", selectedClientId);
        formData.append("serviceId", selectedServiceId);
        if (selectedEmployeeId && selectedEmployeeId !== "unassigned") {
            formData.append("employeeId", selectedEmployeeId);
        }
        formData.append("date", selectedDate);
        formData.append("time", selectedTime);
        formData.append("address", address);
        if (notes) formData.append("notes", notes);
        formData.append("status", status);
        formData.append("employeeId", selectedEmployeeId || "unassigned");

        const result = await updateAppointment(formData);

        setIsLoading(false);

        if (result.error) {
            setError(result.error);
        } else {
            onOpenChange(false);
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <form onSubmit={handleSubmit}>
                    <DialogHeader>
                        <DialogTitle>Editar Agendamento</DialogTitle>
                        <DialogDescription>
                            Atualize os detalhes do serviço.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4 max-h-[70vh] overflow-y-auto px-2">
                        {error && (
                            <div className="bg-red-100 text-red-600 p-2 rounded-md text-sm">
                                {error}
                            </div>
                        )}

                        {/* Status Select */}
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="status" className="text-right">Status</Label>
                            <div className="col-span-3">
                                <Select value={status} onValueChange={setStatus}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="PENDING">Pendente</SelectItem>
                                        <SelectItem value="CONFIRMED">Confirmado</SelectItem>
                                        <SelectItem value="EN_ROUTE">A Caminho</SelectItem>
                                        <SelectItem value="IN_PROGRESS">Em Andamento</SelectItem>
                                        <SelectItem value="AWAITING_CONFIRMATION">Aguardando Autorização</SelectItem>
                                        <SelectItem value="COMPLETED">Concluído</SelectItem>
                                        <SelectItem value="CANCELLED">Cancelado</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        {/* Cliente Select */}
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="customerId" className="text-right">Cliente</Label>
                            <div className="col-span-3">
                                <Select value={selectedClientId} onValueChange={handleClientChange}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Selecione o cliente" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectGroup>
                                            <SelectLabel>Clientes</SelectLabel>
                                            {clients.map(client => (
                                                <SelectItem key={client.id} value={client.id}>
                                                    {client.name} ({client.email})
                                                </SelectItem>
                                            ))}
                                        </SelectGroup>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        {/* Serviço Select */}
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="serviceId" className="text-right">Serviço</Label>
                            <div className="col-span-3">
                                <Select value={selectedServiceId} onValueChange={(value) => setSelectedServiceId(value)}>
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
                            </div>
                        </div>

                        {/* Funcionario Select */}
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="employeeId" className="text-right">Profissional</Label>
                            <div className="col-span-3">
                                <Select value={selectedEmployeeId || "unassigned"} onValueChange={(value) => setSelectedEmployeeId(value)}>
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
                            </div>
                        </div>

                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="date" className="text-right">Data</Label>
                            <Input
                                id="date"
                                type="date"
                                className="col-span-3"
                                required
                                value={selectedDate}
                                onChange={(e) => setSelectedDate(e.target.value)}
                            />
                        </div>

                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="time" className="text-right">Hora</Label>
                            <div className="col-span-3">
                                <Select value={selectedTime} onValueChange={setSelectedTime} disabled={!selectedDate || loadingSlots}>
                                    <SelectTrigger>
                                        <SelectValue placeholder={loadingSlots ? "Carregando..." : (selectedTime || "Selecione o horÃ¡rio")} />
                                    </SelectTrigger>
                                    <SelectContent className="max-h-[200px]">
                                        {availableSlots.length > 0 ? (
                                            availableSlots.map(slot => (
                                                <SelectItem key={slot.time} value={slot.time} disabled={!slot.available}>
                                                    {slot.time} {slot.available ? "" : "(Ocupado)"}
                                                </SelectItem>
                                            ))
                                        ) : (
                                            <SelectItem value="none" disabled>Nenhum horário disponível</SelectItem>
                                        )}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="address" className="text-right">Endereço</Label>
                            <Input
                                id="address"
                                className="col-span-3"
                                required
                                value={address}
                                onChange={(e) => setAddress(e.target.value)}
                            />
                        </div>

                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="notes" className="text-right">Obs</Label>
                            <Textarea
                                id="notes"
                                className="col-span-3"
                                placeholder="Detalhes adicionais..."
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="submit" disabled={isLoading} className="bg-violet-600 hover:bg-violet-700">
                            {isLoading ? "Salvando..." : "Salvar Alterações"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
