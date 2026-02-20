"use client";

import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, CheckCircle, XCircle, PlayCircle, Loader2, Edit } from "lucide-react";
import { AppointmentStatus } from "@prisma/client";
import { updateAppointmentStatus } from "@/actions/update-appointment-status";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { EditAppointmentModal } from "@/components/modals/edit-appointment-modal";
import { FinishServiceModal } from "@/components/modals/finish-service-modal";
import { processConfirmedAppointment } from "@/actions/process-confirmed-appointment";
import { toast } from "sonner";

interface AppointmentActionsProps {
    appointment: any; // Using any for simplicity here to avoid deep type imports, or better, define shape
    // appointment: { id: string; status: AppointmentStatus; ... }
    clients: any[];
    services: any[];
    employees: any[];
}

export function AppointmentActions({ appointment, clients, services, employees }: AppointmentActionsProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [editOpen, setEditOpen] = useState(false);
    const [finishOpen, setFinishOpen] = useState(false);
    const router = useRouter();

    const handleStatusChange = async (newStatus: AppointmentStatus) => {
        setIsLoading(true);
        await updateAppointmentStatus(appointment.id, newStatus);
        setIsLoading(false);
        router.refresh();
    };

    const handleManualConfirm = async () => {
        setIsLoading(true);
        const result = await processConfirmedAppointment(appointment.id);
        setIsLoading(false);
        if (result.success) {
            toast.success("Serviço confirmado e faturado!");
            router.refresh();
        } else {
            toast.error(result.error || "Erro ao confirmar.");
        }
    };

    return (
        <>
            <EditAppointmentModal
                open={editOpen}
                onOpenChange={setEditOpen}
                appointment={appointment}
                clients={clients}
                services={services}
                employees={employees}
            />

            <FinishServiceModal
                open={finishOpen}
                onOpenChange={setFinishOpen}
                appointmentId={appointment.id}
            />

            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 p-0" disabled={isLoading}>
                        <span className="sr-only">Abrir menu</span>
                        {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <MoreHorizontal className="h-4 w-4" />}
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Ações</DropdownMenuLabel>

                    <DropdownMenuItem onClick={() => setEditOpen(true)}>
                        <Edit className="mr-2 h-4 w-4" /> Editar
                    </DropdownMenuItem>

                    <DropdownMenuSeparator />

                    {appointment.status === 'PENDING' && (
                        <DropdownMenuItem onClick={() => handleStatusChange('CONFIRMED')}>
                            <PlayCircle className="mr-2 h-4 w-4 text-blue-600" /> Confirmar
                        </DropdownMenuItem>
                    )}

                    {(appointment.status === 'CONFIRMED' || appointment.status === 'IN_PROGRESS') && (
                        <DropdownMenuItem onClick={() => setFinishOpen(true)}>
                            <CheckCircle className="mr-2 h-4 w-4 text-emerald-600" /> Finalizar (Cleaner)
                        </DropdownMenuItem>
                    )}

                    {appointment.status === 'AWAITING_CONFIRMATION' && (
                        <DropdownMenuItem onClick={handleManualConfirm} className="bg-emerald-50 text-emerald-700 focus:bg-emerald-100 italic font-bold">
                            <CheckCircle className="mr-2 h-4 w-4" /> Autorizar & Faturar
                        </DropdownMenuItem>
                    )}

                    {(appointment.status === 'CONFIRMED' || appointment.status === 'IN_PROGRESS') && (
                        <DropdownMenuItem onClick={() => handleStatusChange('COMPLETED')}>
                            <CheckCircle className="mr-2 h-4 w-4 text-green-600" /> Pular aprovação (Admin)
                        </DropdownMenuItem>
                    )}

                    {appointment.status !== 'CANCELLED' && appointment.status !== 'COMPLETED' && (
                        <>
                            <DropdownMenuItem onClick={() => handleStatusChange('CANCELLED')} className="text-red-600 focus:text-red-600">
                                <XCircle className="mr-2 h-4 w-4" /> Cancelar
                            </DropdownMenuItem>
                        </>
                    )}

                    {appointment.status === 'COMPLETED' && (
                        <DropdownMenuItem disabled className="text-muted-foreground">
                            <CheckCircle className="mr-2 h-4 w-4" /> Finalizado
                        </DropdownMenuItem>
                    )}
                    {appointment.status === 'CANCELLED' && (
                        <DropdownMenuItem disabled className="text-muted-foreground">
                            <XCircle className="mr-2 h-4 w-4" /> Cancelado
                        </DropdownMenuItem>
                    )}
                </DropdownMenuContent>
            </DropdownMenu>
        </>
    );
}
