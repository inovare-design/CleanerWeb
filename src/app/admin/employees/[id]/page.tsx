import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Calendar, Mail, Phone, Clock, User, Settings, Info } from "lucide-react";
import { EmployeeProfileHeaderActions } from "@/components/employee-profile-header-actions";
import { updateEmployeeProfile } from "@/actions/update-employee-profile";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

async function getEmployeeData(id: string) {
    const employee = await db.user.findUnique({
        where: { id },
        include: {
            employeeProfile: {
                include: {
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
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .substring(0, 2);

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
                        <h2 className="text-3xl font-bold tracking-tight">{employee.name}</h2>
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
                <TabsList className="grid w-full grid-cols-3 lg:w-[400px]">
                    <TabsTrigger value="overview">Visão Geral</TabsTrigger>
                    <TabsTrigger value="agenda">Agenda</TabsTrigger>
                    <TabsTrigger value="settings">Configurações</TabsTrigger>
                </TabsList>

                {/* VISÃO GERAL */}
                <TabsContent value="overview" className="space-y-4 mt-6">
                    <div className="grid gap-4 md:grid-cols-2">
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Informações de Contato</CardTitle>
                                <Info className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent className="space-y-3 pt-4">
                                <div className="flex items-center gap-2">
                                    <Phone className="w-4 h-4 text-muted-foreground" />
                                    <span>{employee.employeeProfile?.phone || "Não informado"}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Mail className="w-4 h-4 text-muted-foreground" />
                                    <span>{employee.email}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-4 h-4 rounded-full" style={{ backgroundColor: employee.employeeProfile?.color || "#10b981" }} />
                                    <span>Cor na Agenda: {employee.employeeProfile?.color || "#10b981"}</span>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Resumo de Atividades</CardTitle>
                                <Clock className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent className="space-y-3 pt-4">
                                <div className="flex flex-col">
                                    <span className="text-muted-foreground text-xs">Total de Serviços</span>
                                    <span className="text-2xl font-bold">{employee.employeeProfile?.appointments.length || 0}</span>
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-muted-foreground text-xs">Cadastrado em</span>
                                    <span className="font-medium">{new Date(employee.createdAt).toLocaleDateString()}</span>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                {/* AGENDA */}
                <TabsContent value="agenda" className="mt-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Próximos Agendamentos</CardTitle>
                            <CardDescription>Serviços atribuídos a este profissional.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-6">
                                {(!employee.employeeProfile?.appointments || employee.employeeProfile.appointments.length === 0) ? (
                                    <p className="text-center py-4 text-muted-foreground">Nenhum agendamento encontrado.</p>
                                ) : (
                                    employee.employeeProfile.appointments.map((apt) => (
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
                                            <Badge variant={apt.status === 'COMPLETED' ? 'default' : 'secondary'}>
                                                {apt.status}
                                            </Badge>
                                        </div>
                                    ))
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* CONFIGURAÇÕES */}
                <TabsContent value="settings" className="mt-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Editar Perfil</CardTitle>
                            <CardDescription>Atualize os detalhes profissionais do funcionário.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form action={updateEmployeeProfile} className="space-y-4 max-w-md">
                                <input type="hidden" name="userId" value={employee.id} />
                                <div className="space-y-2">
                                    <Label htmlFor="phone">Telefone</Label>
                                    <Input id="phone" name="phone" defaultValue={employee.employeeProfile?.phone || ""} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="color">Cor da Agenda</Label>
                                    <div className="flex items-center gap-3">
                                        <Input id="color" name="color" type="color" className="w-12 h-10 p-1 cursor-pointer" defaultValue={employee.employeeProfile?.color || "#10b981"} />
                                        <span className="text-sm text-muted-foreground">Esta cor representará o funcionário no calendário.</span>
                                    </div>
                                </div>
                                <Button type="submit">Salvar Alterações</Button>
                            </form>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
