import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Receipt, Calendar, CreditCard, Building2, User } from "lucide-react";
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
                        <div className="space-y-1">
                            <CardTitle className="text-2xl font-black uppercase italic italic flex items-center gap-2">
                                <Building2 className="w-6 h-6 text-blue-600" />
                                {tenant.name}
                            </CardTitle>
                            <p className="text-sm text-muted-foreground">{tenant.address}</p>
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
                    <div className="grid grid-cols-2 gap-8">
                        <div className="space-y-2">
                            <p className="text-[10px] font-black uppercase text-zinc-400 tracking-widest">Cobrar de</p>
                            <div className="flex items-center gap-2">
                                <User className="w-4 h-4 text-zinc-400" />
                                <span className="font-bold text-sm">{invoice.customer.user.name}</span>
                            </div>
                            <p className="text-xs text-muted-foreground">{invoice.customer.phone || invoice.customer.user.email}</p>
                        </div>
                        <div className="space-y-2 text-right">
                            <p className="text-[10px] font-black uppercase text-zinc-400 tracking-widest">Vencimento</p>
                            <div className="flex items-center justify-end gap-2">
                                <Calendar className="w-4 h-4 text-zinc-400" />
                                <span className="font-bold text-sm">{format(new Date(invoice.dueDate), "dd 'de' MMMM, yyyy", { locale: ptBR })}</span>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <p className="text-[10px] font-black uppercase text-zinc-400 tracking-widest">Serviços Inclusos</p>
                        <div className="rounded-lg border overflow-hidden">
                            <table className="w-full text-sm">
                                <thead className="bg-zinc-50 border-b">
                                    <tr>
                                        <th className="px-4 py-3 text-left font-bold text-xs uppercase">Descrição</th>
                                        <th className="px-4 py-3 text-right font-bold text-xs uppercase">Valor</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    {invoice.appointments.map((apt: any) => (
                                        <tr key={apt.id}>
                                            <td className="px-4 py-3">
                                                <div className="font-medium">{apt.service.name}</div>
                                                <div className="text-[10px] text-muted-foreground">{format(new Date(apt.startTime), "dd/MM/yyyy HH:mm")}</div>
                                            </td>
                                            <td className="px-4 py-3 text-right font-bold">
                                                € {Number(apt.price).toFixed(2)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                                <tfoot className="bg-zinc-50/50 font-black">
                                    <tr className="border-t-2">
                                        <td className="px-4 py-4 uppercase">Total Final</td>
                                        <td className="px-4 py-4 text-right text-lg text-blue-600">
                                            € {Number(invoice.amount).toFixed(2)}
                                        </td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                    </div>
                </CardContent>
                <CardFooter className="bg-zinc-50 border-t p-6 rounded-b-xl flex flex-col gap-4">
                    {!isPaid && (
                        <>
                            {invoice.paymentLink ? (
                                <Link href={invoice.paymentLink} className="w-full">
                                    <Button className="w-full h-14 text-lg font-black gap-2 shadow-lg hover:scale-[1.02] transition-transform bg-primary" size="lg">
                                        <CreditCard className="w-6 h-6" />
                                        PAGAR COM iDEAL
                                    </Button>
                                </Link>
                            ) : (
                                <div className="text-center p-4 bg-amber-50 rounded-lg border border-amber-200 text-amber-700">
                                    <p className="font-bold flex items-center justify-center gap-2">
                                        <Receipt className="w-5 h-5" />
                                        Pagamento sendo processado...
                                    </p>
                                    <p className="text-xs mt-1">O link de pagamento ainda não foi gerado pelo administrador.</p>
                                </div>
                            )}
                        </>
                    )}
                    {isPaid && (
                        <div className="text-center p-6 bg-emerald-50 rounded-lg border border-emerald-200 text-emerald-700 w-full">
                            <p className="text-lg font-black uppercase flex items-center justify-center gap-2 italic">
                                <Receipt className="w-6 h-6" />
                                ESTA FATURA JÁ FOI PAGA
                            </p>
                            <p className="text-sm mt-1">Obrigado! O comprovante foi enviado para seu e-mail.</p>
                        </div>
                    )}
                    <p className="text-[10px] text-center text-muted-foreground uppercase font-medium tracking-tight mt-2 italic">
                        CleanRoute Service Dispatch - Faturamento Seguro via Mollie
                    </p>
                </CardFooter>
            </Card>
        </div>
    );
}
