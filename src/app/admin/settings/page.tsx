import { auth } from "@/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
    Settings2,
    Users,
    CreditCard,
    CalendarDays,
    Palette,
    Bell,
    ArrowLeft,
    Building2,
    ShieldCheck
} from "lucide-react";
import { updateTenantSettings } from "@/actions/update-tenant-settings";
import { CreateAdminModal } from "@/components/modals/create-admin-modal";
import { AdminUserActions } from "@/components/admin-user-actions";
import { CreateProfileModal, ProfileList } from "@/components/settings/profile-management";
import { saveSchedulingConfig } from "@/actions/save-scheduling-config";
import { Switch } from "@/components/ui/switch";
import Link from "next/link";

export default async function SettingsPage(props: {
    searchParams?: Promise<{ tab?: string }>
}) {
    const searchParams = await props.searchParams;
    const currentTab = searchParams?.tab || "overview";

    const session = await auth();

    if (!session?.user || (session.user.role as string) !== "SUPER_ADMIN") {
        redirect("/admin");
    }

    const tenant = await db.tenant.findUnique({
        where: { id: session.user.tenantId! },
        include: {
            schedulingConfig: true,
            profiles: true,
            users: {
                where: {
                    role: { in: ["ADMIN", "SUPER_ADMIN"] }
                },
                include: {
                    profile: true
                }
            }
        }
    });

    if (!tenant) return (
        <div className="p-8">
            <h1 className="text-2xl font-bold text-red-600">Tenant não encontrado.</h1>
            <p className="mt-2 text-gray-600">ID na Sessão: <span className="font-mono bg-gray-100 p-1 px-2 rounded">{session.user.tenantId || "null"}</span></p>
            <p className="mt-4">Por favor, saia do sistema e entre novamente para atualizar sua sessão.</p>
        </div>
    );

    const adminProfiles = tenant.profiles.filter((p: any) => p.type === "ADMIN");
    const staffProfiles = tenant.profiles.filter((p: any) => p.type === "STAFF");

    const settingsOptions = [
        {
            title: "Dados da Empresa",
            description: "Nome, contato, endereço e documento",
            icon: Building2,
            id: "general",
            color: "text-blue-500",
            bg: "bg-blue-50"
        },
        {
            title: "Gestão de Acessos",
            description: "Equipe admin e perfis de permissão",
            icon: Users,
            id: "access",
            color: "text-purple-500",
            bg: "bg-purple-50"
        },
        {
            title: "Pagamentos & IDEAL",
            description: "Dados bancários e integração financeira",
            icon: CreditCard,
            id: "payments",
            color: "text-emerald-500",
            bg: "bg-emerald-50"
        },
        {
            title: "Regras de Agendamento",
            description: "Horários, avisos e antecedência",
            icon: CalendarDays,
            id: "scheduling",
            color: "text-orange-500",
            bg: "bg-orange-50"
        },
        {
            title: "Aparência",
            description: "Logotipo, cores e personalização",
            icon: Palette,
            id: "appearance",
            color: "text-pink-500",
            bg: "bg-pink-50"
        },
        {
            title: "Notificações",
            description: "Alertas por e-mail e comunicações",
            icon: Bell,
            id: "notifications",
            color: "text-amber-500",
            bg: "bg-amber-50"
        }
    ];

    return (
        <div className="flex-1 space-y-4 p-8 pt-6">
            <div className="flex items-center space-x-4">
                {currentTab !== "overview" && (
                    <Link href="/admin/settings">
                        <Button variant="ghost" size="icon" className="rounded-full">
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                    </Link>
                )}
                <div className="flex flex-col">
                    <h2 className="text-3xl font-bold tracking-tight italic uppercase flex items-center gap-2">
                        <Settings2 className="h-8 w-8" />
                        Configurações
                    </h2>
                    <p className="text-muted-foreground">
                        {currentTab === "overview" ? "Gerencie todas as preferências do seu sistema" : settingsOptions.find(o => o.id === currentTab)?.title}
                    </p>
                </div>
            </div>

            {currentTab === "overview" ? (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {settingsOptions.map((option) => (
                        <Link key={option.id} href={`/admin/settings?tab=${option.id}`}>
                            <Card className="hover:border-primary/50 transition-all cursor-pointer group h-full">
                                <CardHeader className="flex flex-row items-center space-y-0 pb-2">
                                    <div className={`p-2 rounded-lg ${option.bg} ${option.color} group-hover:scale-110 transition-transform mr-4`}>
                                        <option.icon className="h-6 w-6" />
                                    </div>
                                    <div className="flex flex-col">
                                        <CardTitle className="text-lg">{option.title}</CardTitle>
                                        <CardDescription>{option.description}</CardDescription>
                                    </div>
                                </CardHeader>
                            </Card>
                        </Link>
                    ))}
                </div>
            ) : (
                <div className="mt-6">
                    {currentTab === "general" && (
                        <Card>
                            <CardHeader>
                                <CardTitle>Dados da Empresa</CardTitle>
                                <CardDescription>Informações públicas e de contato da sua empresa.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <form action={updateTenantSettings} className="space-y-4">
                                    <div className="grid gap-4 md:grid-cols-2">
                                        <div className="space-y-2">
                                            <Label htmlFor="name">Nome da Empresa</Label>
                                            <Input id="name" name="name" defaultValue={tenant.name} />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="email">Email de Contato</Label>
                                            <Input id="email" name="email" defaultValue={tenant.email || ""} />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="phone">Telefone</Label>
                                            <Input id="phone" name="phone" defaultValue={tenant.phone || ""} />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="taxId">CNPJ / Documento</Label>
                                            <Input id="taxId" name="taxId" defaultValue={tenant.taxId || ""} />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="address">Endereço Completo</Label>
                                        <Input id="address" name="address" defaultValue={tenant.address || ""} />
                                    </div>
                                    <Button type="submit">Salvar Alterações</Button>
                                </form>
                            </CardContent>
                        </Card>
                    )}

                    {currentTab === "access" && (
                        <Tabs defaultValue="team" className="space-y-4">
                            <TabsList className="bg-zinc-100 dark:bg-zinc-800 p-1 rounded-xl">
                                <TabsTrigger value="team" className="font-bold">Equipe Admin</TabsTrigger>
                                <TabsTrigger value="profiles-admin" className="font-bold">Perfis Admin</TabsTrigger>
                                <TabsTrigger value="profiles-staff" className="font-bold">Perfis Equipe</TabsTrigger>
                            </TabsList>
                            <TabsContent value="team" className="space-y-4">
                                <Card>
                                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                        <div>
                                            <CardTitle>Administradores</CardTitle>
                                            <CardDescription>Gerencie quem tem acesso ao painel administrativo.</CardDescription>
                                        </div>
                                        <CreateAdminModal profiles={adminProfiles} />
                                    </CardHeader>
                                    <CardContent>
                                        <div className="rounded-md border overflow-x-auto">
                                            <table className="min-w-full divide-y divide-gray-200">
                                                <thead className="bg-gray-50 uppercase">
                                                    <tr>
                                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 tracking-wider">Nome</th>
                                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 tracking-wider">Email</th>
                                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 tracking-wider">Cargo</th>
                                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 tracking-wider"></th>
                                                    </tr>
                                                </thead>
                                                <tbody className="bg-white divide-y divide-gray-200">
                                                    {tenant.users.map((user: any) => (
                                                        <tr key={user.id}>
                                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium uppercase font-bold">{user.name}</td>
                                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.email}</td>
                                                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                                <div className="flex flex-col">
                                                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium w-fit ${user.role === "SUPER_ADMIN" ? "bg-purple-100 text-purple-800" : "bg-blue-100 text-blue-800"}`}>
                                                                        {user.role}
                                                                    </span>
                                                                    {user.profile && <span className="text-[10px] text-zinc-500 mt-1 uppercase">Perfil: {user.profile.name}</span>}
                                                                </div>
                                                            </td>
                                                            <td className="px-6 py-4 whitespace-nowrap text-right">
                                                                <AdminUserActions userId={user.id} currentRole={user.role} isSelf={user.id === session.user.id} profiles={adminProfiles} currentProfileId={user.profileId} />
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </CardContent>
                                </Card>
                            </TabsContent>
                            <TabsContent value="profiles-admin">
                                <Card>
                                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                        <CardTitle>Perfis de Administrador</CardTitle>
                                        <CreateProfileModal type="ADMIN" />
                                    </CardHeader>
                                    <CardContent>
                                        <ProfileList profiles={adminProfiles} type="ADMIN" />
                                    </CardContent>
                                </Card>
                            </TabsContent>
                            <TabsContent value="profiles-staff">
                                <Card>
                                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                        <CardTitle>Perfis de Equipe (Cleaners)</CardTitle>
                                        <CreateProfileModal type="STAFF" />
                                    </CardHeader>
                                    <CardContent>
                                        <ProfileList profiles={staffProfiles} type="STAFF" />
                                    </CardContent>
                                </Card>
                            </TabsContent>
                        </Tabs>
                    )}

                    {currentTab === "payments" && (
                        <Card>
                            <CardHeader>
                                <CardTitle>Dados Bancários & IDEAL</CardTitle>
                                <CardDescription>Configurações de faturamento e integração com IDEAL.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <form action={updateTenantSettings} className="space-y-4">
                                    <div className="grid gap-4 md:grid-cols-2">
                                        <div className="space-y-2">
                                            <Label htmlFor="idealId">Conta IDEAL (API Key/ID)</Label>
                                            <Input id="idealId" name="idealId" defaultValue={tenant.idealId || ""} placeholder="Ex: ID-999-XXX" />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="bankName">Banco</Label>
                                            <Input id="bankName" name="bankName" defaultValue={tenant.bankName || ""} />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="bankAgency">Agência</Label>
                                            <Input id="bankAgency" name="bankAgency" defaultValue={tenant.bankAgency || ""} />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="bankAccount">Conta</Label>
                                            <Input id="bankAccount" name="bankAccount" defaultValue={tenant.bankAccount || ""} />
                                        </div>
                                    </div>
                                    <Button type="submit">Salvar Dados Sensíveis</Button>
                                </form>
                            </CardContent>
                        </Card>
                    )}

                    {currentTab === "scheduling" && (
                        <Card>
                            <CardHeader>
                                <CardTitle>Regras de Agendamento</CardTitle>
                                <CardDescription>Configure como os clientes podem marcar serviços.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    <div className="grid gap-4 md:grid-cols-2">
                                        <div className="space-y-2">
                                            <Label>Antecedência Mínima (Horas)</Label>
                                            <Input type="number" defaultValue={tenant.schedulingConfig?.minNoticeHours || 24} />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Janela de Agendamento (Dias)</Label>
                                            <Input type="number" defaultValue={tenant.schedulingConfig?.daysInAdvance || 30} />
                                        </div>
                                    </div>
                                    <p className="text-sm text-zinc-500 italic">* Mais opções de horários e feriados em breve.</p>
                                    <Button disabled>Salvar Configurações (Breve)</Button>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {currentTab === "appearance" && (
                        <Card>
                            <CardHeader>
                                <CardTitle>Personalização do Sistema</CardTitle>
                                <CardDescription>Ajuste a identidade visual do seu portal.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="flex items-center gap-6">
                                    <div className="h-24 w-24 bg-zinc-100 rounded-lg flex items-center justify-center border-2 border-dashed border-zinc-300">
                                        <Building2 className="h-10 w-10 text-zinc-400" />
                                    </div>
                                    <div className="space-y-1">
                                        <Label>Logotipo da Empresa</Label>
                                        <p className="text-sm text-zinc-500">Recomendado: 512x512px (PNG ou SVG)</p>
                                        <Button variant="outline" size="sm" className="mt-2">Upload Logo</Button>
                                    </div>
                                </div>
                                <div className="grid gap-4 md:grid-cols-2">
                                    <div className="space-y-2">
                                        <Label>Cor Primária</Label>
                                        <div className="flex gap-2">
                                            <div className="h-10 w-10 rounded bg-blue-600 border" />
                                            <Input defaultValue="#2563eb" />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Modo do Sistema</Label>
                                        <div className="flex gap-2">
                                            <Button variant="outline" className="w-full">Claro</Button>
                                            <Button variant="outline" className="w-full">Escuro</Button>
                                        </div>
                                    </div>
                                </div>
                                <Button disabled>Salvar Aparência (Breve)</Button>
                            </CardContent>
                        </Card>
                    )}

                    {currentTab === "notifications" && (
                        <Card>
                            <CardHeader>
                                <CardTitle>Preferências de Notificação</CardTitle>
                                <CardDescription>Configure como você e seus clientes são alertados sobre os serviços.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <form action={saveSchedulingConfig} className="space-y-6">
                                    {/* Campos ocultos para manter as outras configs do schedulingConfig se necessário, 
                                        ou podemos apenas atualizar os campos de notificação se o upsert for inteligente.
                                        Como a action exige availability e holidays, vamos passar os valores atuais. */}
                                    <input type="hidden" name="availability" defaultValue={tenant.schedulingConfig?.availability || "{}"} />
                                    <input type="hidden" name="holidays" defaultValue={tenant.schedulingConfig?.holidays || "[]"} />
                                    <input type="hidden" name="rateNormal" defaultValue={tenant.schedulingConfig?.rateNormal?.toString() || "50"} />
                                    <input type="hidden" name="rateNormal2" defaultValue={tenant.schedulingConfig?.rateNormal2?.toString() || "75"} />
                                    <input type="hidden" name="rateUrgent" defaultValue={tenant.schedulingConfig?.rateUrgent?.toString() || "100"} />
                                    <input type="hidden" name="minDurationMin" defaultValue={tenant.schedulingConfig?.minDurationMin?.toString() || "60"} />

                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between p-4 border rounded-xl bg-zinc-50/50 dark:bg-zinc-900/50">
                                            <div className="space-y-0.5">
                                                <Label className="text-base font-bold">Lembrete (24h antes)</Label>
                                                <p className="text-xs text-muted-foreground">Enviar e-mail automático ao cliente um dia antes do serviço.</p>
                                            </div>
                                            <Switch
                                                name="notifyDayBefore"
                                                defaultChecked={tenant.schedulingConfig?.notifyDayBefore !== false}
                                            />
                                        </div>

                                        <div className="flex items-center justify-between p-4 border rounded-xl bg-zinc-50/50 dark:bg-zinc-900/50">
                                            <div className="space-y-0.5">
                                                <Label className="text-base font-bold">Aviso "A Caminho"</Label>
                                                <p className="text-xs text-muted-foreground">Notificar quando o staff iniciar o deslocamento para o local.</p>
                                            </div>
                                            <Switch
                                                name="notifyOnTheWay"
                                                defaultChecked={tenant.schedulingConfig?.notifyOnTheWay !== false}
                                            />
                                        </div>

                                        <div className="flex items-center justify-between p-4 border rounded-xl bg-zinc-50/50 dark:bg-zinc-900/50">
                                            <div className="space-y-0.5">
                                                <Label className="text-base font-bold">Início de Serviço</Label>
                                                <p className="text-xs text-muted-foreground">Notificar o cliente assim que o staff começar o trabalho.</p>
                                            </div>
                                            <Switch
                                                name="notifyServiceStarted"
                                                defaultChecked={tenant.schedulingConfig?.notifyServiceStarted !== false}
                                            />
                                        </div>

                                        <div className="flex items-center justify-between p-4 border rounded-xl bg-zinc-50/50 dark:bg-zinc-900/50">
                                            <div className="space-y-0.5">
                                                <Label className="text-base font-bold">Finalização de Serviço</Label>
                                                <p className="text-xs text-muted-foreground">Notificar o cliente quando o serviço for concluído.</p>
                                            </div>
                                            <Switch
                                                name="notifyServiceFinished"
                                                defaultChecked={tenant.schedulingConfig?.notifyServiceFinished !== false}
                                            />
                                        </div>
                                    </div>
                                    <Button type="submit" className="w-full md:w-auto">Salvar Preferências de Notificação</Button>
                                </form>
                            </CardContent>
                        </Card>
                    )}
                </div>
            )}
        </div>
    );
}
