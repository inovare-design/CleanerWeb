import { auth } from "@/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DollarSign, Calendar, ChevronRight, ExternalLink, FileText } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";

export default async function ClientInvoicesPage() {
    const session = await auth();
    if (!session?.user?.id) redirect("/login");

    const user = await db.user.findUnique({
        where: { id: session.user.id },
        include: { customerProfile: true }
    });

    if (!user?.customerProfile) redirect("/app");

    const invoices = await db.invoice.findMany({
        where: { customerId: user.customerProfile.id },
        include: {
            appointments: { include: { service: true } }
        },
        orderBy: { createdAt: "desc" },
    });

    const statusConfig: Record<string, { label: string; color: string }> = {
        OPEN: { label: "Em Aberto", color: "bg-blue-100 text-blue-700" },
        PAID: { label: "Pago", color: "bg-emerald-100 text-emerald-700" },
        OVERDUE: { label: "Atrasado", color: "bg-red-100 text-red-700" },
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-black tracking-tight text-zinc-900">Minhas Faturas</h1>
                <p className="text-sm text-muted-foreground mt-1">Histórico de pagamentos e faturas.</p>
            </div>

            {invoices.length === 0 ? (
                <div className="text-center py-16">
                    <div className="w-16 h-16 bg-zinc-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <FileText className="w-8 h-8 text-zinc-300" />
                    </div>
                    <h3 className="text-lg font-bold text-zinc-900">Nenhuma fatura</h3>
                    <p className="text-sm text-muted-foreground mt-1">Suas faturas aparecerão aqui.</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {invoices.map((invoice: any) => {
                        const isPaid = invoice.status === "PAID";
                        const isOverdue = new Date(invoice.dueDate) < new Date() && !isPaid;
                        const statusKey = isPaid ? "PAID" : isOverdue ? "OVERDUE" : "OPEN";
                        const status = statusConfig[statusKey];
                        const serviceNames = invoice.appointments.map((a: any) => a.service.name).join(", ");

                        return (
                            <Link key={invoice.id} href={`/invoice/${invoice.id}`} target="_blank" className="block group">
                                <Card className={cn(
                                    "border-0 shadow-sm hover:shadow-md transition-all group-hover:-translate-y-0.5",
                                    !isPaid && isOverdue && "border-2 border-red-200"
                                )}>
                                    <CardContent className="p-4 flex items-center gap-4">
                                        {/* Icon */}
                                        <div className={cn(
                                            "flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center",
                                            isPaid ? "bg-emerald-50 text-emerald-600" : isOverdue ? "bg-red-50 text-red-600" : "bg-blue-50 text-blue-600"
                                        )}>
                                            <DollarSign className="w-6 h-6" />
                                        </div>

                                        {/* Details */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1">
                                                <h3 className="font-bold text-sm text-zinc-900 truncate">
                                                    € {Number(invoice.amount).toFixed(2)}
                                                </h3>
                                                <Badge className={cn("text-[9px] font-black px-2 py-0.5 rounded-md", status.color)}>
                                                    {status.label}
                                                </Badge>
                                            </div>
                                            <div className="flex items-center gap-3 text-[11px] text-zinc-400 font-medium">
                                                <span className="truncate">{serviceNames || "Serviço"}</span>
                                                <span className="flex items-center gap-1 flex-shrink-0">
                                                    <Calendar className="w-3 h-3" />
                                                    {format(new Date(invoice.dueDate), "dd/MM/yyyy")}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Action */}
                                        {!isPaid && invoice.paymentLink ? (
                                            <Link
                                                href={invoice.paymentLink}
                                                target="_blank"
                                                onClick={(e) => e.stopPropagation()}
                                                className="flex-shrink-0 bg-blue-600 text-white px-4 py-2 rounded-lg text-xs font-bold hover:bg-blue-700 transition-all active:scale-95 shadow-sm"
                                            >
                                                Pagar
                                            </Link>
                                        ) : (
                                            <ExternalLink className="w-5 h-5 flex-shrink-0 text-zinc-300 group-hover:text-zinc-500 transition-colors" />
                                        )}
                                    </CardContent>
                                </Card>
                            </Link>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
