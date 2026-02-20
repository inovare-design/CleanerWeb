import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { db } from "@/lib/db";
import { DollarSign, TrendingUp, CreditCard, Receipt, Repeat } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { InvoiceList } from "@/components/finance/invoice-list";
import { RecurringBillingManager } from "@/components/finance/recurring-manager";

async function getFinanceData(tenantId: string) {
    const [
        completedStats,
        forecastStats,
        allInvoices,
        recentAppointments
    ] = await Promise.all([
        // Receita Realizada (Faturas Pagas)
        db.invoice.aggregate({
            where: { tenantId, status: "PAID" },
            _sum: { amount: true }
        }),
        // Receita Prevista (Faturas Abertas + Agendamentos Confirmados sem fatura)
        db.invoice.aggregate({
            where: { tenantId, status: "OPEN" },
            _sum: { amount: true }
        }),
        // Todas as faturas para a lista
        db.invoice.findMany({
            where: { tenantId },
            include: {
                customer: { include: { user: true } },
                appointments: true
            },
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

    const totalRevenue = Number(completedStats._sum.amount || 0);
    const pendingRevenue = Number(forecastStats._sum.amount || 0);

    return {
        totalRevenue,
        pendingRevenue,
        invoices: allInvoices,
        recentTransactions: recentAppointments
    };
}

export default async function FinancePage() {
    const session = await auth();
    if (!session?.user?.tenantId) redirect("/login");

    const tenantId = session.user.tenantId;
    const { totalRevenue, pendingRevenue, invoices, recentTransactions } = await getFinanceData(tenantId);

    return (
        <div className="p-8 space-y-8 animate-in fade-in duration-500">
            <div>
                <h1 className="text-4xl font-black tracking-tight italic uppercase">Gestão Financeira</h1>
                <p className="text-muted-foreground mt-1">
                    Controle de faturas, fluxos de caixa e faturamento recorrente.
                </p>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
                <Card className="bg-emerald-50/50 border-emerald-100 dark:bg-emerald-950/20 dark:border-emerald-900/30">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-xs font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-400">Receita Total</CardTitle>
                        <DollarSign className="h-4 w-4 text-emerald-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-black text-emerald-700 dark:text-emerald-300">
                            R$ {totalRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </div>
                        <p className="text-[10px] text-emerald-600/70 font-bold mt-1 uppercase">Total em faturas liquidadas</p>
                    </CardContent>
                </Card>

                <Card className="bg-blue-50/50 border-blue-100 dark:bg-blue-950/20 dark:border-blue-900/30">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-xs font-black uppercase tracking-widest text-blue-600 dark:text-blue-400">A Receber</CardTitle>
                        <TrendingUp className="h-4 w-4 text-blue-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-black text-blue-700 dark:text-blue-300">
                            R$ {pendingRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </div>
                        <p className="text-[10px] text-blue-600/70 font-bold mt-1 uppercase">Faturas em aberto</p>
                    </CardContent>
                </Card>

                <Card className="bg-zinc-50 border-zinc-200 dark:bg-zinc-900 dark:border-zinc-800">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-xs font-black uppercase tracking-widest text-muted-foreground">Volume Mensal</CardTitle>
                        <CreditCard className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-black text-zinc-900 dark:text-zinc-100">
                            {invoices.length}
                        </div>
                        <p className="text-[10px] text-muted-foreground font-bold mt-1 uppercase">Total de faturas geradas</p>
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
                                                <p className="text-[10px] text-muted-foreground uppercase font-bold">{new Date(t.updatedAt).toLocaleDateString()}</p>
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
}
