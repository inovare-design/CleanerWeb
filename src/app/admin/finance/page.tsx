import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { APP_VERSION } from "@/lib/version";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { db } from "@/lib/db";
import { DollarSign, TrendingUp, CreditCard, Receipt, Repeat, Clock } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { InvoiceList } from "@/components/finance/invoice-list";
import { RecurringBillingManager } from "@/components/finance/recurring-manager";
import { AppointmentInvoicer } from "@/components/finance/appointment-invoicer";

async function getFinanceData(tenantId: string) {
    const [
        completedStats,
        forecastStats,
        awaitingStats,
        provisionedStats,
        allInvoices,
        recentAppointments
    ] = await Promise.all([
        // Receita Realizada (Faturas Pagas)
        db.invoice.aggregate({
            where: { customer: { tenantId }, status: "PAID" },
            _sum: { amount: true }
        }),
        // Receita Prevista (Faturas Abertas)
        db.invoice.aggregate({
            where: { customer: { tenantId }, status: "OPEN" },
            _sum: { amount: true }
        }),
        // Receita A Aprovar (Status AWAITING_CONFIRMATION)
        db.appointment.aggregate({
            where: { tenantId, status: "AWAITING_CONFIRMATION" },
            _sum: { price: true }
        }),
        // Receita Provisionada (COMPLETED sem Invoice - para Recorrentes)
        db.appointment.aggregate({
            where: {
                tenantId,
                status: "COMPLETED",
                invoiceId: null
            },
            _sum: { price: true }
        }),
        // Todas as faturas para a lista
        db.invoice.findMany({
            where: { customer: { tenantId } },
            include: { customer: { include: { user: true } }, appointments: true },
            orderBy: { createdAt: "desc" }
        }),
        // Serviços concluídos recentemente
        db.appointment.findMany({
            where: { tenantId, status: "COMPLETED" },
            include: { customer: { include: { user: true } }, service: true },
            orderBy: { updatedAt: "desc" },
            take: 10
        })
    ]);

    return {
        totalRevenue: Number(completedStats._sum.amount || 0),
        pendingRevenue: Number(forecastStats._sum.amount || 0),
        awaitingRevenue: Number(awaitingStats._sum.price || 0),
        provisionedRevenue: Number(provisionedStats._sum.price || 0),
        invoices: allInvoices,
        recentTransactions: recentAppointments
    };
}

export default async function FinancePage() {
    const session = await auth();
    if (!session?.user?.tenantId) redirect("/login");

    const tenantId = session.user.tenantId;

    try {
        const { totalRevenue, pendingRevenue, awaitingRevenue, provisionedRevenue, invoices, recentTransactions } = await getFinanceData(tenantId);

        return (
            <div className="p-8 space-y-8 animate-in fade-in duration-500">
                <div className="flex flex-col gap-1">
                    <h1 className="text-4xl font-black tracking-tight italic uppercase flex items-center gap-3">
                        Gestão Financeira <span className="text-sm not-italic font-bold text-muted-foreground/50 border border-muted-foreground/20 px-2 py-1 rounded bg-muted/50">{APP_VERSION}</span>
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        Controle de faturas, fluxos de caixa e faturamento recorrente.
                    </p>
                </div>

                <div className="grid gap-4 md:grid-cols-4">
                    <Card className="bg-emerald-50/50 border-emerald-100 dark:bg-emerald-950/20 dark:border-emerald-900/30 ring-1 ring-emerald-500/10">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-[10px] font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-400">Total Recebido</CardTitle>
                            <DollarSign className="h-4 w-4 text-emerald-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-black text-emerald-700 dark:text-emerald-300">
                                R$ {totalRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </div>
                            <p className="text-[10px] text-emerald-600/70 font-bold mt-1 uppercase">Faturas Pagas (IDEAL)</p>
                        </CardContent>
                    </Card>

                    <Card className="bg-blue-50/50 border-blue-100 dark:bg-blue-950/20 dark:border-blue-900/30 ring-1 ring-blue-500/10">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-[10px] font-black uppercase tracking-widest text-blue-600 dark:text-blue-400">Faturas em Aberto</CardTitle>
                            <TrendingUp className="h-4 w-4 text-blue-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-black text-blue-700 dark:text-blue-300">
                                R$ {pendingRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </div>
                            <p className="text-[10px] text-blue-600/70 font-bold mt-1 uppercase">A vencer / Vencidas</p>
                        </CardContent>
                    </Card>

                    <Card className="bg-amber-50/50 border-amber-100 dark:bg-amber-950/20 dark:border-amber-900/30 ring-1 ring-amber-500/10">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-[10px] font-black uppercase tracking-widest text-amber-600 dark:text-amber-400">Aprovação Pendente</CardTitle>
                            <Clock className="h-4 w-4 text-amber-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-black text-amber-700 dark:text-amber-300">
                                R$ {awaitingRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </div>
                            <p className="text-[10px] text-amber-600/70 font-bold mt-1 uppercase">Janela de 3h p/ cliente</p>
                        </CardContent>
                    </Card>

                    <Card className="bg-zinc-50 border-zinc-200 dark:bg-zinc-900 dark:border-zinc-800 shadow-sm ring-1 ring-zinc-500/10">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-[10px] font-black uppercase tracking-widest text-zinc-600 dark:text-zinc-400">Serviços Provisionados</CardTitle>
                            <Repeat className="h-4 w-4 text-zinc-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-black text-zinc-900 dark:text-zinc-100">
                                R$ {provisionedRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </div>
                            <p className="text-[10px] text-zinc-600/70 font-bold mt-1 uppercase">Recorrentes confirmados</p>
                        </CardContent>
                    </Card>
                </div>

                <Tabs defaultValue="invoices" className="w-full">
                    <TabsList className="bg-zinc-100 dark:bg-zinc-800 p-1 rounded-xl w-full sm:w-auto h-auto">
                        <TabsTrigger value="invoices" className="font-bold gap-2 px-6 py-2 data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-lg">
                            <Receipt className="w-4 h-4" />
                            Faturas
                        </TabsTrigger>
                        <TabsTrigger value="recurring" className="font-bold gap-2 px-6 py-2 data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-lg">
                            <Repeat className="w-4 h-4" />
                            Cobrança Recorrente
                        </TabsTrigger>
                        <TabsTrigger value="history" className="font-bold gap-2 px-6 py-2 data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-lg">
                            <TrendingUp className="w-4 h-4" />
                            Fluxo de Agendamentos
                        </TabsTrigger>
                    </TabsList>

                    <div className="mt-6">
                        <TabsContent value="invoices" className="animate-in slide-in-from-bottom-2 duration-300">
                            <Card className="border-zinc-200 dark:border-zinc-800 shadow-sm">
                                <CardHeader>
                                    <CardTitle className="text-lg font-bold">Gestão de Faturamento</CardTitle>
                                    <CardDescription>Acompanhe o status de pagamento de cada fatura enviada.</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <InvoiceList invoices={invoices} />
                                </CardContent>
                            </Card>
                        </TabsContent>

                        <TabsContent value="recurring" className="animate-in slide-in-from-bottom-2 duration-300">
                            <RecurringBillingManager />
                        </TabsContent>

                        <TabsContent value="history" className="animate-in slide-in-from-bottom-2 duration-300">
                            <Card className="border-zinc-200 dark:border-zinc-800 shadow-sm">
                                <CardHeader>
                                    <CardTitle className="text-lg font-bold">Histórico de Recebimentos</CardTitle>
                                    <CardDescription>Últimos serviços concluídos e integrados ao faturamento.</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-4">
                                        {recentTransactions.map((t: any) => (
                                            <div key={t.id} className="flex items-center justify-between p-4 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800">
                                                <div className="space-y-1">
                                                    <p className="font-bold text-sm text-zinc-900 dark:text-zinc-100">{t.customer.user.name}</p>
                                                    <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest">{t.service.name}</p>
                                                </div>
                                                <div className="text-right space-y-1">
                                                    <p className="font-black text-lg text-emerald-600">R$ {Number(t.price).toFixed(2)}</p>
                                                    <div className="flex flex-col items-end gap-1">
                                                        <p className="text-[10px] text-muted-foreground uppercase font-bold">{new Date(t.updatedAt).toLocaleDateString()}</p>
                                                        {!t.invoiceId && (
                                                            <AppointmentInvoicer
                                                                appointmentId={t.id}
                                                                customerId={t.customerId}
                                                            />
                                                        )}
                                                        {t.invoiceId && (
                                                            <span className="text-[9px] font-black text-emerald-500 uppercase bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100">Faturado</span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                        {recentTransactions.length === 0 && (
                                            <div className="text-center py-12 text-muted-foreground italic">Nenhum serviço concluído registrado.</div>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>
                    </div>
                </Tabs>
            </div>
        );
    } catch (error: any) {
        console.error("Finance Error:", error);
        return (
            <div className="p-8">
                <Card className="border-red-200 bg-red-50 ring-1 ring-red-200 shadow-sm">
                    <CardHeader>
                        <CardTitle className="text-red-600 flex items-center gap-2 italic uppercase font-black">
                            <Receipt className="w-5 h-5" />
                            Erro ao Carregar Financeiro
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="p-4 bg-white/50 rounded-lg border border-red-100 font-mono text-[10px] text-red-800 break-all">
                            {error?.message || "Erro interno desconhecido no servidor (500)"}
                        </div>
                        <p className="text-sm text-red-500 font-medium leading-relaxed">
                            Isso pode ser causado por uma incompatibilidade no banco de dados ou erro na agregação das faturas.
                        </p>
                    </CardContent>
                </Card>
            </div>
        );
    }
}
