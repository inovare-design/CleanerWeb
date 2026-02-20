import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Calendar, Mail, MapPin, Phone, User, Clock, CheckCircle, AlertCircle, Home, Key } from "lucide-react";
import { ClientProfileHeaderActions } from "@/components/client-profile-header-actions";
import { ClientStatusBadge } from "@/components/client-status-badge";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";

async function getClientData(id: string) {
    const client = await db.user.findUnique({
        where: { id },
        include: {
            customerProfile: {
                include: {
                    invoices: {
                        orderBy: { createdAt: 'desc' }
                    },
                    appointments: {
                        include: {
                            service: true,
                            employee: {
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
    return client;
}

export default async function ClientProfilePage({ params }: { params: Promise<{ id: string }> }) {
    const session = await auth();
    if (!session) redirect("/login");

    const resolvedParams = await params;
    const client = await getClientData(resolvedParams.id);

    if (!client || client.role !== "CLIENT") {
        return <div>Cliente não encontrado</div>;
    }

    const customer = client.customerProfile;

    // Consolidar histórico financeiro
    const financialHistory = [
        ...(customer?.invoices || []).map((inv: any) => ({
            id: inv.id,
            date: inv.paidAt || inv.createdAt,
            type: 'PAYMENT',
            amount: Number(inv.amount),
            status: inv.status,
            description: `Fatura #${inv.id.substring(0, 8)}`,
        })),
        ...(customer?.appointments || [])
            .filter((apt: any) => Number(apt.tipPrice) > 0)
            .map((apt: any) => ({
                id: `tip-${apt.id}`,
                date: apt.actualEndTime || apt.startTime,
                type: 'TIP',
                amount: Number(apt.tipPrice),
                status: 'PAID',
                description: `Gorjeta - Serviço: ${apt.service.name}`,
            })),
        ...(customer?.appointments || [])
            .filter((apt: any) => apt.status === 'CANCELLED')
            .map((apt: any) => ({
                id: `refund-${apt.id}`,
                date: apt.updatedAt,
                type: 'REFUND',
                amount: -Number(apt.price), // Valor negativo para estorno
                status: 'CANCELLED',
                description: `Estorno (Cancelamento) - ${apt.service.name}`,
            }))
    ].sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());

    const initials = client.name
        ?.split(" ")
        .map((n: string) => n[0])
        .join("")
        .toUpperCase()
        .substring(0, 2);

    return (
        <div className="p-8 space-y-8 h-full flex flex-col overflow-y-auto">
            {/* Header */}
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <Avatar className="h-20 w-20">
                        <AvatarImage src={/* client.image || */ ""} />
                        <AvatarFallback className="text-xl bg-primary/10 text-primary">{initials}</AvatarFallback>
                    </Avatar>
                    <div>
                        <h2 className="text-3xl font-bold tracking-tight">{client.name}</h2>
                        <div className="flex items-center gap-2 text-muted-foreground mt-1">
                            <Mail className="w-4 h-4" />
                            <span>{client.email}</span>
                            <span className="text-gray-300">|</span>
                            {client.customerProfile && (
                                <ClientStatusBadge
                                    customerId={client.customerProfile.id}
                                    initialStatus={client.customerProfile.active ?? true}
                                />
                            )}
                        </div>
                    </div>
                </div>
                <div className="flex gap-2">
                    <ClientProfileHeaderActions client={client} />
                </div>
            </div>

            {/* Main Content */}
            <Tabs defaultValue="overview" className="w-full">
                <TabsList className="grid w-full grid-cols-4 lg:w-[450px]">
                    <TabsTrigger value="overview">Visão Geral</TabsTrigger>
                    <TabsTrigger value="appointments">Agendamentos</TabsTrigger>
                    <TabsTrigger value="history">Histórico Financeiro</TabsTrigger>
                    <TabsTrigger value="notes">Notas</TabsTrigger>
                </TabsList>

                {/* VISÃO GERAL */}
                <TabsContent value="overview" className="space-y-4 mt-6">
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {/* Contato Principal */}
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Contato</CardTitle>
                                <User className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent className="space-y-3 pt-4">
                                <div className="flex items-center gap-2">
                                    <Phone className="w-4 h-4 text-muted-foreground" />
                                    <span>{client.customerProfile?.phone || "Não informado"}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Mail className="w-4 h-4 text-muted-foreground" />
                                    <span>{client.email}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <MapPin className="w-4 h-4 text-muted-foreground" />
                                    <span>{client.customerProfile?.address || "Sem endereço"}</span>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Detalhes do Imóvel */}
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Detalhes do Imóvel</CardTitle>
                                <Home className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent className="space-y-3 pt-4">
                                <div className="grid grid-cols-2 gap-2 text-sm">
                                    <div className="flex flex-col">
                                        <span className="text-muted-foreground text-xs">Quartos</span>
                                        <span className="font-medium">{client.customerProfile?.bedrooms || "-"}</span>
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-muted-foreground text-xs">Banheiros</span>
                                        <span className="font-medium">{client.customerProfile?.bathrooms || "-"}</span>
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-muted-foreground text-xs">Metragem</span>
                                        <span className="font-medium">{client.customerProfile?.footage || "-"}</span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Acesso */}
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Acesso & Segurança</CardTitle>
                                <Key className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent className="pt-4">
                                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                                    {client.customerProfile?.accessInfo || "Nenhuma informação de acesso registrada."}
                                </p>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Resumo Rápido */}
                    <div className="grid gap-4 md:grid-cols-2">
                        <Card>
                            <CardHeader>
                                <CardTitle>Documentação</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-sm">
                                    <span className="font-medium mr-2">CPF/CNPJ:</span>
                                    <span className="text-muted-foreground">{client.customerProfile?.document || "Não informado"}</span>
                                </div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader>
                                <CardTitle>Estatísticas</CardTitle>
                            </CardHeader>
                            <CardContent className="flex gap-4">
                                <div className="text-center">
                                    <div className="text-2xl font-bold">{client.customerProfile?.appointments?.length || 0}</div>
                                    <div className="text-xs text-muted-foreground">Total Agendamentos</div>
                                </div>
                                <div className="text-center">
                                    <div className="text-2xl font-bold text-emerald-600">
                                        R$ {financialHistory.filter(h => h.type !== 'REFUND').reduce((acc, h) => acc + h.amount, 0).toFixed(2)}
                                    </div>
                                    <div className="text-xs text-muted-foreground">Total Gasto</div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                {/* AGENDAMENTOS */}
                <TabsContent value="appointments" className="mt-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Histórico de Agendamentos</CardTitle>
                            <CardDescription>
                                Lista completa de serviços agendados, realizados e cancelados.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-8">
                                {(!client.customerProfile?.appointments || client.customerProfile.appointments.length === 0) ? (
                                    <div className="text-center py-8 text-muted-foreground">
                                        Nenhum agendamento encontrado.
                                    </div>
                                ) : (
                                    client.customerProfile?.appointments.map((apt: any) => (
                                        <div key={apt.id} className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0">
                                            <div className="space-y-1">
                                                <p className="text-sm font-medium leading-none flex items-center gap-2">
                                                    {apt.service.name}
                                                    <Badge variant={
                                                        apt.status === 'COMPLETED' ? 'default' :
                                                            apt.status === 'CANCELLED' ? 'destructive' : 'secondary'
                                                    } className="text-[10px] h-5">
                                                        {apt.status}
                                                    </Badge>
                                                </p>
                                                <p className="text-sm text-muted-foreground flex items-center gap-1">
                                                    <Calendar className="w-3 h-3" />
                                                    {new Date(apt.startTime).toLocaleDateString()} às {new Date(apt.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </p>
                                                {apt.employee && (
                                                    <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                                                        <User className="w-3 h-3" />
                                                        Profissional: <span className="font-medium text-foreground">{apt.employee.user.name}</span>
                                                    </p>
                                                )}
                                            </div>
                                            <div className="flex flex-col items-end gap-1">
                                                <span className="font-bold">R$ {Number(apt.price).toFixed(2)}</span>
                                                <span className="text-xs text-muted-foreground">{apt.address}</span>

                                                {/* Detalhes de Rastreamento */}
                                                <div className="text-[10px] text-muted-foreground text-right space-y-0.5 mt-2 bg-muted/30 p-2 rounded">
                                                    <div title="Data do Pedido">Pedido: {new Date(apt.createdAt).toLocaleDateString()}</div>
                                                    {apt.actualStartTime && (
                                                        <div className="text-green-600 flex items-center justify-end gap-1">
                                                            <Clock className="w-3 h-3" /> Início: {new Date(apt.actualStartTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                        </div>
                                                    )}
                                                    {apt.actualEndTime && (
                                                        <div>Término: {new Date(apt.actualEndTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                                                    )}
                                                    {apt.clientConfirmationDate && (
                                                        <div className="text-blue-600 flex items-center justify-end gap-1" title="Confirmado pelo cliente">
                                                            <CheckCircle className="w-3 h-3" /> Confirmado: {new Date(apt.clientConfirmationDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* HISTÓRICO FINANCEIRO */}
                <TabsContent value="history" className="mt-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Histórico Financeiro Detalhado</CardTitle>
                            <CardDescription>Registro de pagamentos, gorjetas e possíveis estornos.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="rounded-md border">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Data</TableHead>
                                            <TableHead>Tipo</TableHead>
                                            <TableHead>Descrição</TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead className="text-right">Valor</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {financialHistory.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                                                    Nenhum registro financeiro encontrado.
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            financialHistory.map((item) => (
                                                <TableRow key={item.id}>
                                                    <TableCell className="text-sm">
                                                        {new Date(item.date).toLocaleDateString()}
                                                    </TableCell>
                                                    <TableCell>
                                                        <Badge variant={
                                                            item.type === 'PAYMENT' ? 'default' :
                                                                item.type === 'TIP' ? 'secondary' : 'destructive'
                                                        } className="text-[10px]">
                                                            {item.type === 'PAYMENT' ? 'PAGAMENTO' :
                                                                item.type === 'TIP' ? 'GORJETA' : 'ESTORNO'}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell className="text-sm font-medium">
                                                        {item.description}
                                                    </TableCell>
                                                    <TableCell className="text-xs uppercase font-bold text-muted-foreground">
                                                        {item.status}
                                                    </TableCell>
                                                    <TableCell className={`text-right font-bold ${item.amount < 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                                                        R$ {Math.abs(item.amount).toFixed(2)}
                                                        {item.amount < 0 && ' (-)'}
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* NOTAS */}
                <TabsContent value="notes" className="mt-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Observações Internas</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="bg-muted/50 p-4 rounded-md">
                                <p className="text-sm whitespace-pre-wrap">
                                    {client.customerProfile?.notes || "Nenhuma observação registrada."}
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
