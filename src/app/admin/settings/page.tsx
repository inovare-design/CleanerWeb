import { auth } from "@/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { updateTenantSettings } from "@/actions/update-tenant-settings";

export default async function SettingsPage() {
    const session = await auth();

    if (!session?.user || session.user.role !== "SUPER_ADMIN") {
        redirect("/admin");
    }

    const tenant = await db.tenant.findUnique({
        where: { id: session.user.tenantId! },
        include: {
            schedulingConfig: true,
            users: {
                where: {
                    role: { in: ["ADMIN", "SUPER_ADMIN"] }
                }
            }
        }
    });

    if (!tenant) return <div>Tenant não encontrado.</div>;

    return (
        <div className="flex-1 space-y-4 p-8 pt-6">
            <div className="flex items-center justify-between space-y-2">
                <h2 className="text-3xl font-bold tracking-tight">Configurações</h2>
            </div>

            <Tabs defaultValue="general" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="general">Geral</TabsTrigger>
                    <TabsTrigger value="team">Equipe Admin</TabsTrigger>
                    <TabsTrigger value="payments">Pagamentos & IDEAL</TabsTrigger>
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
                        <CardHeader>
                            <CardTitle>Administradores</CardTitle>
                            <CardDescription>
                                Gerencie quem tem acesso ao painel administrativo.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                <div className="rounded-md border">
                                    <table className="min-w-full divide-y divide-gray-200">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nome</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cargo</th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-200">
                                            {tenant.users.map((user) => (
                                                <tr key={user.id}>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{user.name}</td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.email}</td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${user.role === "SUPER_ADMIN" ? "bg-purple-100 text-purple-800" : "bg-blue-100 text-blue-800"}`}>
                                                            {user.role}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                                <p className="text-sm text-muted-foreground italic">
                                    Para adicionar novos administradores, use o formulário de convite (em desenvolvimento).
                                </p>
                            </div>
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
