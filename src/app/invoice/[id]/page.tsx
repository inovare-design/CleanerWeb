import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Receipt, Calendar, CreditCard, Building2, User, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default async function PublicInvoicePage(props: {
    params: Promise<{ id: string }>
}) {
    const params = await props.params;
    const invoiceId = params.id;

    const invoice = await db.invoice.findUnique({
        where: { id: invoiceId },
        include: {
            customer: {
                include: {
                    user: true,
                    tenant: true
                }
            },
            appointments: {
                include: {
                    service: true
                }
            }
        }
    });

    if (!invoice) {
        notFound();
    }

    const tenant = invoice.customer.tenant;
    const isPaid = invoice.status === "PAID";
    const isOverdue = new Date(invoice.dueDate) < new Date() && !isPaid;

    return (
        <div className="min-h-screen bg-zinc-50 flex items-center justify-center p-4">
            <Card className="w-full max-w-2xl shadow-xl border-zinc-200">
                <CardHeader className="border-b space-y-4 pb-6">
                    <div className="flex justify-between items-start">
                        <div className="flex items-center gap-4">
                            {tenant.logoUrl ? (
                                <img
                                    src={tenant.logoUrl}
                                    alt={tenant.name}
                                    className="w-12 h-12 object-contain rounded-lg"
                                />
                            ) : (
                                <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center shadow-lg shadow-blue-600/20">
                                    <Building2 className="w-7 h-7 text-white" />
                                </div>
                            )}
                            <div className="space-y-0.5">
                                <CardTitle className="text-2xl font-black uppercase italic italic flex items-center gap-2">
                                    {tenant.name}
                                </CardTitle>
                                <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest leading-none">
                                    {tenant.description || "Serviços Profissionais"}
                                </p>
                            </div>
                        </div>
                        <div className="text-right">
                            <Badge variant={isPaid ? "secondary" : "default"} className={isPaid ? "bg-emerald-100 text-emerald-700" : isOverdue ? "bg-red-100 text-red-700" : "bg-blue-100 text-blue-700"}>
                                {isPaid ? "PAGO" : isOverdue ? "ATRASADO" : "EM ABERTO"}
                            </Badge>
                            <p className="text-xs text-muted-foreground mt-2 font-mono">#{invoice.id.split("-")[0].toUpperCase()}</p>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="pt-8 space-y-8">
                    <div className="grid grid-cols-2 gap-8 px-2">
                        <div className="space-y-2">
                            <p className="text-[10px] font-black uppercase text-zinc-400 tracking-widest">Cobrar de</p>
                            <div className="flex items-center gap-2">
                                <User className="w-4 h-4 text-zinc-400" />
                                <span className="font-bold text-sm">{invoice.customer.user.name}</span>
                            </div>
                            <p className="text-xs text-muted-foreground">{invoice.customer.phone || invoice.customer.user.email}</p>
                            <p className="text-[10px] text-zinc-400 mt-1">{invoice.customer.address}</p>
                        </div>
                        <div className="space-y-2 text-right">
                            <p className="text-[10px] font-black uppercase text-zinc-400 tracking-widest">Vencimento</p>
                            <div className="flex items-center justify-end gap-2">
                                <Calendar className="w-4 h-4 text-zinc-400" />
                                <span className="font-bold text-sm">{format(new Date(invoice.dueDate), "dd 'de' MMMM, yyyy", { locale: ptBR })}</span>
                            </div>
                            <div className="text-[10px] text-zinc-400 mt-1">Status do pagamento: {isPaid ? "Concluído" : "Aguardando"}</div>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <p className="text-[10px] font-black uppercase text-zinc-400 tracking-widest">Serviços Inclusos</p>
                        <div className="rounded-2xl border border-zinc-100 overflow-hidden shadow-sm">
                            <table className="w-full text-sm">
                                <thead className="bg-zinc-50/50 border-b">
                                    <tr>
                                        <th className="px-6 py-4 text-left font-bold text-xs uppercase tracking-wider text-zinc-500">Descrição do Serviço</th>
                                        <th className="px-6 py-4 text-right font-bold text-xs uppercase tracking-wider text-zinc-500">Valor</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-zinc-100 bg-white">
                                    {invoice.appointments.map((apt: any) => {
                                        const duration = apt.customDuration || apt.service.durationMin || 60;
                                        const hours = Math.floor(duration / 60);
                                        const minutes = duration % 60;
                                        const durationText = hours > 0
                                            ? `${hours}h${minutes > 0 ? ` ${minutes}min` : ''}`
                                            : `${minutes}min`;

                                        return (
                                            <tr key={apt.id} className="hover:bg-zinc-50/50 transition-colors">
                                                <td className="px-6 py-4">
                                                    <div className="flex flex-col gap-1">
                                                        <div className="flex items-center gap-2">
                                                            <span className="font-bold text-zinc-900">{apt.service.name}</span>
                                                            <span className="text-[10px] bg-zinc-100 text-zinc-600 px-1.5 py-0.5 rounded font-black uppercase tracking-tight">
                                                                {durationText}
                                                            </span>
                                                        </div>
                                                        <div className="text-[10px] text-zinc-400 flex items-center gap-1">
                                                            <Calendar className="w-3 h-3" />
                                                            {format(new Date(apt.startTime), "dd/MM/yyyy HH:mm")}
                                                        </div>
                                                        {apt.service.description && (
                                                            <p className="text-[11px] text-zinc-500 mt-1 leading-relaxed max-w-md">
                                                                {apt.service.description}
                                                            </p>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-right align-top">
                                                    <span className="font-black text-sm text-zinc-900">€ {Number(apt.price).toFixed(2)}</span>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                                <tfoot className="bg-zinc-50/80">
                                    <tr className="border-t-2 border-zinc-200">
                                        <td className="px-6 py-6 text-sm font-black uppercase italic text-zinc-600">Total Final</td>
                                        <td className="px-6 py-6 text-right">
                                            <span className="text-2xl font-black text-blue-600 italic">
                                                € {Number(invoice.amount).toFixed(2)}
                                            </span>
                                        </td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                    </div>
                </CardContent>
                <CardFooter className="bg-zinc-50/50 border-t p-8 rounded-b-2xl flex flex-col gap-6">
                    {!isPaid && (
                        <>
                            {invoice.paymentLink ? (
                                <Link href={invoice.paymentLink} className="w-full">
                                    <Button className="w-full h-16 text-xl font-black gap-3 shadow-xl hover:scale-[1.01] active:scale-[0.99] transition-all bg-zinc-900 hover:bg-zinc-800 rounded-2xl italic tracking-tight" size="lg">
                                        <CreditCard className="w-7 h-7" />
                                        PAGAR COM iDEAL
                                    </Button>
                                </Link>
                            ) : (
                                <div className="text-center p-6 bg-amber-50 rounded-2xl border border-amber-200 text-amber-700 shadow-sm">
                                    <p className="font-bold flex items-center justify-center gap-2">
                                        <Receipt className="w-5 h-5" />
                                        Link de Pagamento Indisponível
                                    </p>
                                    <p className="text-xs mt-1 opacity-80">Por favor, entre em contato com {tenant.name} para obter o link de pagamento.</p>
                                </div>
                            )}
                        </>
                    )}
                    {isPaid && (
                        <div className="text-center p-8 bg-emerald-50 rounded-2xl border border-emerald-200 text-emerald-700 w-full shadow-sm">
                            <p className="text-xl font-black uppercase flex items-center justify-center gap-3 italic tracking-tight">
                                <CheckCircle2 className="w-8 h-8" />
                                ESTA FATURA JÁ FOI PAGA
                            </p>
                            <p className="text-sm mt-1 font-medium italic">Obrigado! O comprovante foi enviado para seu e-mail.</p>
                        </div>
                    )}
                    <div className="flex flex-col items-center gap-2">
                        <p className="text-[9px] text-center text-zinc-400 uppercase font-black tracking-[0.2em] italic">
                            FATURAMENTO SEGURO VIA MOLLIE & IDEAL
                        </p>
                        <p className="text-[10px] text-center text-zinc-500 font-bold uppercase tracking-widest">
                            {tenant.name} &copy; {new Date().getFullYear()}
                        </p>
                    </div>
                </CardFooter>
            </Card>
        </div>
    );
}
