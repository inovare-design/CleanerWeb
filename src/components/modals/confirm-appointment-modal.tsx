"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { updateAppointmentStatus } from "@/actions/update-appointment-status";
import { getPreferredEmployee } from "@/actions/get-preferred-employee";
import { Loader2, User } from "lucide-react";

interface ConfirmAppointmentModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    appointment: any;
    employees: any[];
}

export function ConfirmAppointmentModal({
    open,
    onOpenChange,
    appointment,
    employees
}: ConfirmAppointmentModalProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>("");
    const [isFetchingPreference, setIsFetchingPreference] = useState(false);
    const router = useRouter();

    useEffect(() => {
        if (open && appointment?.customerId) {
            const fetchPreference = async () => {
                setIsFetchingPreference(true);
                const { employeeId } = await getPreferredEmployee(appointment.customerId);
                if (employeeId) {
                    setSelectedEmployeeId(employeeId);
                } else {
                    setSelectedEmployeeId("");
                }
                setIsFetchingPreference(false);
            };
            fetchPreference();
        }
    }, [open, appointment?.customerId]);

    const handleConfirm = async () => {
        if (!selectedEmployeeId) {
            toast.error("Por favor, selecione um funcionário.");
            return;
        }

        setIsLoading(true);
        const result = await updateAppointmentStatus(appointment.id, "CONFIRMED", selectedEmployeeId);
        setIsLoading(false);

        if (result.success) {
            toast.success("Agendamento confirmado com sucesso!");
            onOpenChange(false);
            router.refresh();
        } else {
            toast.error(result.error || "Erro ao confirmar agendamento.");
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Confirmar Agendamento</DialogTitle>
                    <DialogDescription>
                        Designe um funcionário para realizar o serviço de {appointment.service.name}.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="employee">Funcionário</Label>
                        <Select
                            value={selectedEmployeeId}
                            onValueChange={setSelectedEmployeeId}
                            disabled={isLoading || isFetchingPreference}
                        >
                            <SelectTrigger id="employee">
                                <SelectValue placeholder={isFetchingPreference ? "Buscando preferência..." : "Selecione um funcionário"} />
                            </SelectTrigger>
                            <SelectContent>
                                {employees.map((emp) => (
                                    <SelectItem key={emp.id} value={emp.employeeProfile?.id || emp.id}>
                                        <div className="flex items-center">
                                            <div
                                                className="h-2 w-2 rounded-full mr-2"
                                                style={{ backgroundColor: emp.employeeProfile?.color || '#000' }}
                                            />
                                            {emp.name}
                                        </div>
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        {isFetchingPreference && (
                            <p className="text-xs text-muted-foreground flex items-center">
                                <Loader2 className="h-3 w-3 animate-spin mr-1" />
                                Verificando histórico do cliente...
                            </p>
                        )}
                        {!isFetchingPreference && !selectedEmployeeId && (
                            <p className="text-xs text-amber-600 font-medium">
                                Nenhuma preferência encontrada para este cliente.
                            </p>
                        )}
                        {!isFetchingPreference && selectedEmployeeId && (
                            <p className="text-xs text-emerald-600 font-medium">
                                Sugestão baseada no último atendimento deste cliente.
                            </p>
                        )}
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
                        Cancelar
                    </Button>
                    <Button onClick={handleConfirm} disabled={isLoading || isFetchingPreference || !selectedEmployeeId}>
                        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Confirmar e Designar
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
