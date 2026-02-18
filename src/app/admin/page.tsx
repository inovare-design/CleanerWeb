import { auth } from "@/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, DollarSign, Users, Activity } from "lucide-react";

export default async function AdminDashboardPage() {
    const session = await auth();

    return (
        <div className="p-8 space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
                    <p className="text-muted-foreground">
                        Bem-vindo de volta, {session?.user?.name || "Admin"}! 👋
                    </p>
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            Agendamentos Hoje
                        </CardTitle>
                        <Calendar className="h-4 w-4 text-muted-foreground text-violet-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">12</div>
                        <p className="text-xs text-muted-foreground">
                            +2 cancelados
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            Receita Mensal
                        </CardTitle>
                        <DollarSign className="h-4 w-4 text-muted-foreground text-green-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">R$ 45.231,89</div>
                        <p className="text-xs text-muted-foreground">
                            +20.1% em relação ao mês anterior
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Clientes Ativos</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground text-orange-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">+573</div>
                        <p className="text-xs text-muted-foreground">
                            +19 novos esta semana
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            Cleaners Online
                        </CardTitle>
                        <Activity className="h-4 w-4 text-muted-foreground text-emerald-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">8</div>
                        <p className="text-xs text-muted-foreground">
                            de 12 registrados
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Area para gráfico futuro */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                <Card className="col-span-4">
                    <CardHeader>
                        <CardTitle>Visão Geral</CardTitle>
                    </CardHeader>
                    <CardContent className="pl-2">
                        <div className="h-[200px] flex items-center justify-center text-muted-foreground bg-slate-50 dark:bg-slate-900 rounded-md">
                            Gráfico de Receita (Em breve)
                        </div>
                    </CardContent>
                </Card>
                <Card className="col-span-3">
                    <CardHeader>
                        <CardTitle>Últimos Agendamentos</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {/* Lista Mockada */}
                            <div className="flex items-center">
                                <div className="ml-4 space-y-1">
                                    <p className="text-sm font-medium leading-none">Maria Silva</p>
                                    <p className="text-sm text-muted-foreground">Limpeza Padrão - 10:00</p>
                                </div>
                                <div className="ml-auto font-medium text-emerald-500">Confirmado</div>
                            </div>
                            <div className="flex items-center">
                                <div className="ml-4 space-y-1">
                                    <p className="text-sm font-medium leading-none">João Souza</p>
                                    <p className="text-sm text-muted-foreground">Limpeza Pesada - 14:00</p>
                                </div>
                                <div className="ml-auto font-medium text-amber-500">Pendente</div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
