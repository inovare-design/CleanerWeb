"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Receipt, Loader2 } from "lucide-react";
import { createManualInvoice } from "@/actions/manage-invoices";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface AppointmentInvoicerProps {
    appointmentId: string;
    customerId: string;
}

export function AppointmentInvoicer({ appointmentId, customerId }: AppointmentInvoicerProps) {
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();

    const handleGenerateInvoice = async () => {
        setIsLoading(true);
        try {
            const dueDate = new Date();
            dueDate.setDate(dueDate.getDate() + 1); // Vencimento para amanhã por padrão

            const res = await createManualInvoice(customerId, [appointmentId], dueDate);

            if (res.success) {
                toast.success(res.success);
                router.refresh();
            } else {
                toast.error(res.error || "Falha ao gerar fatura.");
            }
        } catch (error) {
            toast.error("Erro inesperado ao gerar fatura.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Button
            size="sm"
            variant="outline"
            className="h-8 text-[10px] font-black uppercase tracking-tighter gap-1 border-blue-200 text-blue-600 hover:bg-blue-50 hover:text-blue-700 dark:border-blue-900/50 dark:text-blue-400 dark:hover:bg-blue-950/50"
            disabled={isLoading}
            onClick={handleGenerateInvoice}
        >
            {isLoading ? (
                <Loader2 className="w-3 h-3 animate-spin" />
            ) : (
                <Receipt className="w-3 h-3" />
            )}
            Gerar Fatura
        </Button>
    );
}
