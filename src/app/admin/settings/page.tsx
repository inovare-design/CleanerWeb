import { auth } from "@/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { updateTenantSettings } from "@/actions/update-tenant-settings";
import { CreateAdminModal } from "@/components/modals/create-admin-modal";
import { AdminUserActions } from "@/components/admin-user-actions";
import { CreateProfileModal, ProfileList } from "@/components/settings/profile-management";

export default async function SettingsPage() {
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

    return (
        <div className="flex-1 space-y-4 p-8 pt-6">
            <div className="flex items-center justify-between space-y-2">
                <h2 className="text-3xl font-bold tracking-tight italic uppercase">Configurações</h2>
            </div>

            {/* Rest of the file ... I'll use replace_file_content for specific blocks */}

            <Tabs defaultValue="general" className="space-y-4">
                <TabsList className="flex flex-wrap h-auto p-1 bg-zinc-100 dark:bg-zinc-800 rounded-xl">
                    <TabsTrigger value="general" className="rounded-lg px-4 py-2 font-bold data-[state=active]:bg-white data-[state=active]:shadow-sm">Geral</TabsTrigger>
                    <TabsTrigger value="team" className="rounded-lg px-4 py-2 font-bold data-[state=active]:bg-white data-[state=active]:shadow-sm">Equipe Admin</TabsTrigger>
                    <TabsTrigger value="profiles-admin" className="rounded-lg px-4 py-2 font-bold data-[state=active]:bg-white data-[state=active]:shadow-sm">Perfis Admin</TabsTrigger>
                    <TabsTrigger value="profiles-staff" className="rounded-lg px-4 py-2 font-bold data-[state=active]:bg-white data-[state=active]:shadow-sm">Perfis Equipe (Cleaners)</TabsTrigger>
                    <TabsTrigger value="payments" className="rounded-lg px-4 py-2 font-bold data-[state=active]:bg-white data-[state=active]:shadow-sm">Pagamentos & IDEAL</TabsTrigger>
                </TabsList>

                <TabsContent value="general" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Dados da Empresa</CardTitle>
                            <CardDescription>
                                Informações públicas e de contato da sua empresa.
                            </CardDescription>
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
                </TabsContent>

                <TabsContent value="team" className="space-y-4">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <div>
                                <CardTitle>Administradores</CardTitle>
                                <CardDescription>
                                    Gerencie quem tem acesso ao painel administrativo.
                                </CardDescription>
                            </div>
                            <CreateAdminModal profiles={adminProfiles} />
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                <div className="rounded-md border">
                                    <table className="min-w-full divide-y divide-gray-200">
                                        <thead className="bg-gray-50 uppercase">
                                            <tr>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 tracking-wider">Nome</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 tracking-wider text-center">Iniciais</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 tracking-wider">Email</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 tracking-wider">Cargo</th>
                                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 tracking-wider"></th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-200">
                                            {tenant.users.map((user: any) => (
                                                <tr key={user.id}>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 uppercase font-bold tracking-tight">{user.name}</td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center uppercase">{user.name?.substring(0, 2)}</td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.email}</td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                        <div className="flex flex-col">
                                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium w-fit ${user.role === "SUPER_ADMIN" ? "bg-purple-100 text-purple-800" : "bg-blue-100 text-blue-800"}`}>
                                                                {user.role}
                                                            </span>
                                                            {user.profile && (
                                                                <span className="text-[10px] text-zinc-500 mt-1 uppercase font-medium">
                                                                    Perfil: {user.profile.name}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                        <AdminUserActions
                                                            userId={user.id}
                                                            currentRole={user.role}
                                                            isSelf={user.id === session.user.id}
                                                            profiles={adminProfiles}
                                                            currentProfileId={user.profileId}
                                                        />
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="profiles-admin" className="space-y-4">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <div>
                                <CardTitle>Perfis de Administrador</CardTitle>
                                <CardDescription>
                                    Defina tipos de cargos com poderes personalizados.
                                </CardDescription>
                            </div>
                            <CreateProfileModal type="ADMIN" />
                        </CardHeader>
                        <CardContent>
                            <ProfileList profiles={adminProfiles} type="ADMIN" />
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="profiles-staff" className="space-y-4">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <div>
                                <CardTitle>Perfis de Equipe (Cleaners)</CardTitle>
                                <CardDescription>
                                    Crie pacotes de permissões para quem está em campo.
                                </CardDescription>
                            </div>
                            <CreateProfileModal type="STAFF" />
                        </CardHeader>
                        <CardContent>
                            <ProfileList profiles={staffProfiles} type="STAFF" />
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="payments" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Dados Bancários & IDEAL</CardTitle>
                            <CardDescription>
                                Configurações de faturamento e integração com IDEAL.
                            </CardDescription>
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
                </TabsContent>
            </Tabs>
        </div>
    );
}
