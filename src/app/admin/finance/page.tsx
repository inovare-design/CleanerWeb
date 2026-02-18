import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { db } from "@/lib/db";
import { DollarSign, TrendingUp, CreditCard, Calendar } from "lucide-react";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";

async function getFinanceData() {
    // Queries paralelas para performance
    const [completedAppointments, pendingAppointments, allCompletedList] = await Promise.all([
        // Total Recebido (COMPLETED)
        db.appointment.groupBy({
            by: ['status'],
            where: { status: 'COMPLETED' },
            _sum: { price: true },
            _count: true
        }),
        // Previsão (PENDING + CONFIRMED)
        db.appointment.groupBy({
            by: ['status'],
            where: { status: { in: ['PENDING', 'CONFIRMED'] } },
            _sum: { price: true },
            _count: true
        }),
        // Lista recente de concluídos
        db.appointment.findMany({
            where: { status: 'COMPLETED' },
            include: { customer: { include: { user: true } }, service: true },
            orderBy: { updatedAt: 'desc' },
            take: 5
        })
    ]);

    const totalRevenue = completedAppointments.reduce((acc, curr) => acc + Number(curr._sum.price || 0), 0);
    const completedCount = completedAppointments.reduce((acc, curr) => acc + curr._count, 0);

    const pendingRevenue = pendingAppointments.reduce((acc, curr) => acc + Number(curr._sum.price || 0), 0);
    const pendingCount = pendingAppointments.reduce((acc, curr) => acc + curr._count, 0);

    return { totalRevenue, completedCount, pendingRevenue, pendingCount, recentTransactions: allCompletedList };
}

export default async function FinancePage() {
    const session = await auth();
    if (!session) redirect("/login");

    const { totalRevenue, completedCount, pendingRevenue, pendingCount, recentTransactions } = await getFinanceData();

    return (
        <div className="p-8 space-y-8 h-full flex flex-col">
            <div>
                <h2 className="text-3xl font-bold tracking-tight">Financeiro</h2>
                <p className="text-muted-foreground">
                    Visão geral de receitas e previsão de faturamento.
                </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Receita Total</CardTitle>
                        <DollarSign className="h-4 w-4 text-emerald-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-emerald-600">R$ {totalRevenue.toFixed(2)}</div>
                        <p className="text-xs text-muted-foreground">
                            {completedCount} serviços concluídos
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">A Receber</CardTitle>
                        <TrendingUp className="h-4 w-4 text-blue-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-blue-600">R$ {pendingRevenue.toFixed(2)}</div>
                        <p className="text-xs text-muted-foreground">
                            {pendingCount} serviços agendados
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Ticket Médio</CardTitle>
                        <CreditCard className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            R$ {completedCount > 0 ? (totalRevenue / completedCount).toFixed(2) : "0.00"}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Baseado nos serviços concluídos
                        </p>
                    </CardContent>
                </Card>
            </div>

            <Card className="flex-1 border-emerald-100 dark:border-emerald-900/20">
                <CardHeader>
                    <CardTitle>Últimos Recebimentos</CardTitle>
                    <CardDescription>
                        Serviços finalizados recentemente.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Cliente</TableHead>
                                <TableHead>Serviço</TableHead>
                                <TableHead>Data Conclusão</TableHead>
                                <TableHead className="text-right">Valor</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {recentTransactions.map((t) => (
                                <TableRow key={t.id}>
                                    <TableCell className="font-medium">{t.customer.user.name}</TableCell>
                                    <TableCell>{t.service.name}</TableCell>
                                    <TableCell className="text-muted-foreground">
                                        {new Date(t.updatedAt).toLocaleDateString()}
                                    </TableCell>
                                    <TableCell className="text-right font-bold text-emerald-600">
                                        + R$ {Number(t.price).toFixed(2)}
                                    </TableCell>
                                </TableRow>
                            ))}
                            {recentTransactions.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={4} className="h-24 text-center">
                                        Nenhuma transação registrada.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
