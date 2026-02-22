import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Calendar, Mail, Phone, Clock, User, Settings, Info, DollarSign, MessageSquare, Star, TrendingUp } from "lucide-react";
import { EmployeeProfileHeaderActions } from "@/components/employee-profile-header-actions";
import { EmployeePaymentForm, EmployeeFeedbackForm, EmployeeSettingsForm } from "@/components/employee-profile-forms";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

async function getEmployeeData(id: string) {
    const employee = await db.user.findUnique({
        where: { id },
        include: {
            employeeProfile: {
                include: {
                    payments: {
                        orderBy: { date: 'desc' }
                    },
                    feedbacks: {
                        orderBy: { createdAt: 'desc' }
                    },
                    appointments: {
                        include: {
                            service: true,
                            customer: {
                                include: {
                                    user: true
                                }
                            }
                        },
                        orderBy: {
                            startTime: 'desc'
                        }
                    }
                }
            }
        }
    });
    return employee;
}

export default async function EmployeeProfilePage({ params }: { params: Promise<{ id: string }> }) {
    const session = await auth();
    if (!session) redirect("/login");

    const resolvedParams = await params;
    const employee = await getEmployeeData(resolvedParams.id);

    if (!employee || employee.role !== "CLEANER") {
        return <div className="p-8">Funcionário não encontrado</div>;
    }

    const initials = employee.name
        ?.split(" ")
        .map((n: string) => n[0])
        .join("")
        .toUpperCase()
        .substring(0, 2);

    const feedbacks = (employee.employeeProfile?.feedbacks || []) as any[];
    const avgRating = feedbacks.length > 0
        ? (feedbacks.reduce((acc: number, f: any) => acc + f.rating, 0) / feedbacks.length).toFixed(1)
        : "N/A";

    const totalPaid = (employee.employeeProfile?.payments || []).reduce((acc: number, p: any) => acc + Number(p.amount), 0);

    return (
        <div className="p-8 space-y-8 h-full flex flex-col overflow-y-auto">
            {/* Header */}
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <Avatar className="h-20 w-20">
                        <AvatarFallback className="text-xl" style={{ backgroundColor: employee.employeeProfile?.color || "#10b981", color: "white" }}>
                            {initials}
                        </AvatarFallback>
                    </Avatar>
                    <div>
                        <div className="flex items-center gap-3">
                            <h2 className="text-3xl font-bold tracking-tight">{employee.name}</h2>
                            {feedbacks.length > 0 && (
                                <Badge variant="outline" className="flex items-center gap-1 bg-yellow-50 text-yellow-700 border-yellow-200">
                                    <Star className="w-3 h-3 fill-yellow-400" />
                                    {avgRating}
                                </Badge>
                            )}
                        </div>
                        <div className="flex items-center gap-2 text-muted-foreground mt-1">
                            <Mail className="w-4 h-4" />
                            <span>{employee.email}</span>
                            <span className="text-gray-300">|</span>
                            <Badge variant="secondary">{employee.role}</Badge>
                        </div>
                    </div>
                </div>
                <EmployeeProfileHeaderActions userId={employee.id} />
            </div>

            {/* Main Content */}
            <Tabs defaultValue="overview" className="w-full">
                <TabsList className="grid w-full grid-cols-5 lg:w-[600px]">
                    <TabsTrigger value="overview">Visão Geral</TabsTrigger>
                    <TabsTrigger value="agenda">Agenda</TabsTrigger>
                    <TabsTrigger value="finance">Financeiro</TabsTrigger>
                    <TabsTrigger value="feedback">Feedbacks</TabsTrigger>
                    <TabsTrigger value="settings">Configurações</TabsTrigger>
                </TabsList>

                {/* VISÃO GERAL */}
                <TabsContent value="overview" className="space-y-4 mt-6">
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Contatos</CardTitle>
                                <Phone className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent className="pt-2">
                                <div className="text-sm font-medium">{employee.employeeProfile?.phone || "Não informado"}</div>
                                <div className="text-xs text-muted-foreground">{employee.email}</div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Avaliação Média</CardTitle>
                                <Star className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent className="pt-2">
                                <div className="text-2xl font-bold text-yellow-600">{avgRating}</div>
                                <div className="text-xs text-muted-foreground">Baseado em {feedbacks.length} avaliações</div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Serviços Totais</CardTitle>
                                <TrendingUp className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent className="pt-2">
                                <div className="text-2xl font-bold">{employee.employeeProfile?.appointments.length || 0}</div>
                                <div className="text-xs text-muted-foreground">Em toda a trajetória</div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Total Pago</CardTitle>
                                <DollarSign className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent className="pt-2">
                                <div className="text-2xl font-bold text-green-600">R$ {totalPaid.toFixed(2)}</div>
                                <div className="text-xs text-muted-foreground">Inclui salários e bônus</div>
                            </CardContent>
                        </Card>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg">Próximos Compromissos</CardTitle>
                            </CardHeader>
                            <CardContent>
                                {/* Simples lista rápida */}
                                <div className="space-y-4">
                                    {employee.employeeProfile?.appointments.slice(0, 3).map((apt: any) => (
                                        <div key={apt.id} className="flex justify-between items-center text-sm">
                                            <div>
                                                <p className="font-medium">{apt.service.name}</p>
                                                <p className="text-xs text-muted-foreground">{new Date(apt.startTime).toLocaleDateString()} - {apt.customer.user.name}</p>
                                            </div>
                                            <Badge variant="outline" className="text-[10px]">{apt.status}</Badge>
                                        </div>
                                    ))}
                                    {(!employee.employeeProfile?.appointments || employee.employeeProfile.appointments.length === 0) && (
                                        <p className="text-xs text-muted-foreground">Sem agendamentos futuros.</p>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg">Últimos Feedbacks</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    {feedbacks.slice(0, 2).map((f: any) => (
                                        <div key={f.id} className="space-y-1">
                                            <div className="flex items-center gap-1">
                                                {[...Array(5)].map((_, i) => (
                                                    <Star key={i} className={`w-3 h-3 ${i < f.rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}`} />
                                                ))}
                                            </div>
                                            <p className="text-xs italic">"{f.comment}"</p>
                                        </div>
                                    ))}
                                    {feedbacks.length === 0 && (
                                        <p className="text-xs text-muted-foreground">Ainda sem avaliações.</p>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                {/* AGENDA COMPLETA */}
                <TabsContent value="agenda" className="mt-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Histórico de Agenda</CardTitle>
                            <CardDescription>Todos os serviços vinculados a este profissional.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-6">
                                {employee.employeeProfile?.appointments.map((apt: any) => (
                                    <div key={apt.id} className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0">
                                        <div className="space-y-1">
                                            <p className="font-medium">{apt.service.name}</p>
                                            <p className="text-sm text-muted-foreground flex items-center gap-1">
                                                <Calendar className="w-3 h-3" />
                                                {new Date(apt.startTime).toLocaleDateString()} às {new Date(apt.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </p>
                                            <p className="text-xs text-muted-foreground flex items-center gap-1">
                                                <User className="w-3 h-3" />
                                                Cliente: {apt.customer.user.name}
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <Badge variant={apt.status === 'COMPLETED' ? 'default' : 'secondary'}>
                                                {apt.status}
                                            </Badge>
                                            {Number(apt.tipPrice) > 0 && (
                                                <p className="text-[10px] text-green-600 font-bold mt-1">+ Tip: R$ {Number(apt.tipPrice).toFixed(2)}</p>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* FINANCEIRO */}
                <TabsContent value="finance" className="mt-6 space-y-6">
                    <div className="grid gap-6 md:grid-cols-3">
                        <Card className="md:col-span-1">
                            <CardHeader>
                                <CardTitle>Registrar Pagamento</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <EmployeePaymentForm employee={employee} />
                            </CardContent>
                        </Card>

                        <Card className="md:col-span-2">
                            <CardHeader>
                                <CardTitle>Histórico de Pagamentos</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    {employee.employeeProfile?.payments.map((p: any) => (
                                        <div key={p.id} className="flex justify-between items-center border-b pb-3 last:border-0 last:pb-0">
                                            <div className="space-y-0.5">
                                                <p className="text-sm font-medium">{new Date(p.date).toLocaleDateString()}</p>
                                                <Badge variant="outline" className="text-[10px]">{p.type}</Badge>
                                                {p.notes && <p className="text-xs text-muted-foreground">{p.notes}</p>}
                                            </div>
                                            <div className="text-right">
                                                <p className="font-bold text-green-700">R$ {Number(p.amount).toFixed(2)}</p>
                                            </div>
                                        </div>
                                    ))}
                                    {employee.employeeProfile?.payments.length === 0 && (
                                        <p className="text-center py-6 text-muted-foreground text-sm">Nenhum pagamento registrado.</p>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                <TabsContent value="feedback" className="mt-6 space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Registrar Nova Avaliação</CardTitle>
                            <CardDescription>Adicione um feedback manual de um cliente ou uma avaliação interna da equipe.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <EmployeeFeedbackForm employee={employee} />
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Histórico de Avaliações & Feedbacks</CardTitle>
                            <CardDescription>O que clientes e equipe dizem sobre {employee.name}.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="grid gap-6 md:grid-cols-2">
                                <div className="space-y-4 border-r pr-6">
                                    <h3 className="font-semibold text-sm flex items-center gap-2">
                                        <User className="w-4 h-4" /> Avaliações de Clientes
                                    </h3>
                                    {feedbacks.filter((f: any) => f.type === 'CLIENT_TO_EMPLOYEE').map((f: any) => (
                                        <Card key={f.id} className="bg-muted/30">
                                            <CardContent className="p-4 space-y-2">
                                                <div className="flex justify-between items-center">
                                                    <div className="flex gap-1">
                                                        {[...Array(5)].map((_, i) => (
                                                            <Star key={i} className={`w-3 h-3 ${i < f.rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}`} />
                                                        ))}
                                                    </div>
                                                    <span className="text-[10px] text-muted-foreground">{new Date(f.createdAt).toLocaleDateString()}</span>
                                                </div>
                                                <p className="text-sm italic">"{f.comment}"</p>
                                            </CardContent>
                                        </Card>
                                    ))}
                                    {feedbacks.filter((f: any) => f.type === 'CLIENT_TO_EMPLOYEE').length === 0 && (
                                        <p className="text-xs text-muted-foreground text-center py-4">Ainda sem avaliações de clientes.</p>
                                    )}
                                </div>

                                <div className="space-y-4">
                                    <h3 className="font-semibold text-sm flex items-center gap-2">
                                        <MessageSquare className="w-4 h-4" /> Avaliações da Equipe
                                    </h3>
                                    {feedbacks.filter((f: any) => f.type === 'TEAMMATE_RATING').map((f: any) => (
                                        <Card key={f.id} className="bg-blue-50/30 border-blue-100">
                                            <CardContent className="p-4 space-y-2">
                                                <div className="flex justify-between items-center">
                                                    <div className="flex gap-1">
                                                        {[...Array(5)].map((_, i) => (
                                                            <Star key={i} className={`w-3 h-3 ${i < f.rating ? "fill-blue-400 text-blue-400" : "text-gray-300"}`} />
                                                        ))}
                                                    </div>
                                                    <span className="text-[10px] text-muted-foreground">{new Date(f.createdAt).toLocaleDateString()}</span>
                                                </div>
                                                <p className="text-sm font-medium">Avaliação Interna</p>
                                                <p className="text-sm italic">"{f.comment}"</p>
                                            </CardContent>
                                        </Card>
                                    ))}
                                    {feedbacks.filter((f: any) => f.type === 'TEAMMATE_RATING').length === 0 && (
                                        <p className="text-xs text-muted-foreground text-center py-4">Ainda sem avaliações internas.</p>
                                    )}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* CONFIGURAÇÕES */}
                <TabsContent value="settings" className="mt-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Editar Perfil Profissional</CardTitle>
                            <CardDescription>Atualize os detalhes de contato e visualização.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <EmployeeSettingsForm employee={employee} />
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
