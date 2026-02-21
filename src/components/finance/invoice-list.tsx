"use client";

import { useState } from "react";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, CheckCircle2, XCircle, Trash2, Eye } from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { updateInvoiceStatus, deleteInvoice, generateInvoicePaymentLink } from "@/actions/manage-invoices";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import Link from "next/link";
import { CreditCard as PaymentIcon, ExternalLink, QrCode } from "lucide-react";

interface InvoiceListProps {
    invoices: any[];
}

export function InvoiceList({ invoices }: InvoiceListProps) {
    const [isLoading, setIsLoading] = useState<string | null>(null);

    const handleStatusUpdate = async (id: string, status: string) => {
        setIsLoading(id);
        const res = await updateInvoiceStatus(id, status);
        setIsLoading(null);

        if (res.success) {
            toast.success(res.success);
        } else {
            toast.error(res.error);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Tem certeza que deseja excluir esta fatura? Os serviços vinculados voltarão a ficar pendentes de faturamento.")) return;

        setIsLoading(id);
        const res = await deleteInvoice(id);
        setIsLoading(null);

        if (res.success) {
            toast.success(res.success);
        } else {
            toast.error(res.error);
        }
    };

    const handleGenerateLink = async (id: string) => {
        setIsLoading(id);
        const res = await generateInvoicePaymentLink(id);
        setIsLoading(null);

        if (res.success) {
            toast.success(res.success);
        } else {
            toast.error(res.error);
        }
    };

    const getStatusStyle = (status: string) => {
        switch (status) {
            case "PAID": return "bg-emerald-100 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-400";
            case "OPEN": return "bg-blue-100 text-blue-700 hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400";
            case "OVERDUE": return "bg-red-100 text-red-700 hover:bg-red-100 dark:bg-red-900/30 dark:text-red-400";
            default: return "bg-gray-100 text-gray-700 hover:bg-gray-100";
        }
    };

    const getStatusLabel = (status: string) => {
        switch (status) {
            case "PAID": return "Pago";
            case "OPEN": return "Aberto";
            case "OVERDUE": return "Atrasado";
            case "CANCELLED": return "Cancelado";
            default: return status;
        }
    };

    return (
        <div className="rounded-md border">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Fatura</TableHead>
                        <TableHead>Cliente</TableHead>
                        <TableHead>Vencimento</TableHead>
                        <TableHead>Valor</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {invoices.map((invoice) => (
                        <TableRow key={invoice.id}>
                            <TableCell className="font-mono text-xs">
                                {invoice.id.split("-")[0].toUpperCase()}
                            </TableCell>
                            <TableCell>
                                <div className="font-medium">{invoice.customer.user.name}</div>
                                <div className="text-xs text-muted-foreground">{invoice.appointments.length} serviços</div>
                            </TableCell>
                            <TableCell>
                                {format(new Date(invoice.dueDate), "dd 'de' MMM", { locale: ptBR })}
                            </TableCell>
                            <TableCell className="font-bold">
                                R$ {Number(invoice.amount).toFixed(2)}
                            </TableCell>
                            <TableCell>
                                <Badge variant="secondary" className={getStatusStyle(invoice.status)}>
                                    {getStatusLabel(invoice.status)}
                                </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" className="h-8 w-8 p-0" disabled={isLoading === invoice.id}>
                                            <MoreHorizontal className="h-4 w-4" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <DropdownMenuLabel>Ações</DropdownMenuLabel>
                                        <DropdownMenuItem onClick={() => handleStatusUpdate(invoice.id, "PAID")}>
                                            <CheckCircle2 className="mr-2 h-4 w-4 text-emerald-500" />
                                            Marcar como Pago
                                        </DropdownMenuItem>

                                        {!invoice.paidAt && (
                                            <DropdownMenuItem onClick={() => handleGenerateLink(invoice.id)}>
                                                <PaymentIcon className="mr-2 h-4 w-4 text-blue-500" />
                                                Gerar Link iDEAL
                                            </DropdownMenuItem>
                                        )}

                                        <Link href={`/invoice/${invoice.id}`} target="_blank">
                                            <DropdownMenuItem>
                                                <ExternalLink className="mr-2 h-4 w-4" />
                                                Ver Página Pública
                                            </DropdownMenuItem>
                                        </Link>

                                        <DropdownMenuItem onClick={() => handleStatusUpdate(invoice.id, "OPEN")}>
                                            <Eye className="mr-2 h-4 w-4 text-blue-500" />
                                            Reabrir
                                        </DropdownMenuItem>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem className="text-red-600" onClick={() => handleDelete(invoice.id)}>
                                            <Trash2 className="mr-2 h-4 w-4" />
                                            Excluir
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </TableCell>
                        </TableRow>
                    ))}
                    {invoices.length === 0 && (
                        <TableRow>
                            <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                                Nenhuma fatura encontrada.
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
        </div>
    );
}
