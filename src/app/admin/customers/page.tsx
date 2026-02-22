import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { PrismaClient } from "@prisma/client";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, MoreHorizontal, Mail, MapPin, Phone, Trash, ExternalLink, User } from "lucide-react";
import { deleteClient } from "@/actions/delete-client";
import { EditClientModal } from "@/components/modals/edit-client-modal";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { db } from "@/lib/db";
import { CreateClientModal } from "@/components/modals/create-client-modal";

async function getClientes(query: string, tenantId: string) {
    // Buscar usuários com role CLIENT e seus perfis
    const clients = await db.user.findMany({
        where: {
            role: "CLIENT",
            tenantId,
            OR: [
                { name: { contains: query } },
                { email: { contains: query } }
            ]
        },
        include: {
            customerProfile: true
        },
        orderBy: {
            createdAt: 'desc'
        }
    });
    return clients;
}

// Definir tipo para o cliente com perfil
type ClientWithProfile = {
    id: string;
    name: string | null;
    email: string;
    createdAt: Date;
    customerProfile: {
        phone: string | null;
        address: string | null;
        frequency: string;
        latitude: number | null;
        longitude: number | null;
    } | null;
};

export default async function CustomersPage(props: {
    searchParams?: Promise<{
        q?: string;
    }>;
}) {
    // ... resto do componente ...
    const session = await auth();
    if (!session) redirect("/login");

    const searchParams = await props.searchParams;
    const query = searchParams?.q || "";

    const tenantId = session.user.tenantId;
    if (!tenantId) return <div>Erro: Usuário sem tenant vinculado.</div>;

    const clients = await getClientes(query, tenantId);

    return (
        <div className="p-8 space-y-8 h-full flex flex-col">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Clientes</h2>
                    <p className="text-muted-foreground">
                        Gerencie sua base de clientes e históricos.
                    </p>
                </div>
                <div className="flex items-center space-x-2">
                    <CreateClientModal />
                </div>
            </div>

            <Card className="flex-1 overflow-hidden flex flex-col">
                <CardHeader className="border-b space-y-4 md:space-y-0 md:flex-row md:items-center md:justify-between p-6">
                    <div className="space-y-1.5">
                        <CardTitle>Base de Contatos</CardTitle>
                        <CardDescription>
                            Visualizando {clients.length} clientes ativos.
                        </CardDescription>
                    </div>
                    <div className="flex items-center space-x-2 w-full md:w-auto">
                        <form className="relative flex items-center">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                name="q"
                                defaultValue={searchParams?.q}
                                className="pl-9 w-[250px]"
                                placeholder="Buscar cliente..."
                            />
                        </form>
                    </div>
                </CardHeader>
                <CardContent className="p-0 flex-1 overflow-auto">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Nome / Email</TableHead>
                                <TableHead>Telefone</TableHead>
                                <TableHead>Frequência</TableHead>
                                <TableHead>Endereço Principal</TableHead>
                                <TableHead>Data Cadastro</TableHead>
                                <TableHead className="w-[80px]"></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {(clients as ClientWithProfile[]).map((client) => (
                                <TableRow key={client.id}>
                                    <TableCell>
                                        <div className="flex flex-col">
                                            <Link href={`/admin/customers/${client.id}`} className="hover:underline">
                                                <span className="font-medium">{client.name}</span>
                                            </Link>
                                            <span className="text-xs text-muted-foreground flex items-center mt-0.5">
                                                <Mail className="w-3 h-3 mr-1" /> {client.email}
                                            </span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <span className="flex items-center text-sm">
                                            <Phone className="w-3 h-3 mr-2 text-muted-foreground" />
                                            {client.customerProfile?.phone || "N/A"}
                                        </span>
                                    </TableCell>
                                    <TableCell>
                                        {client.customerProfile?.frequency === 'WEEKLY' && <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100">Semanal</Badge>}
                                        {client.customerProfile?.frequency === 'BIWEEKLY' && <Badge className="bg-indigo-100 text-indigo-700 hover:bg-indigo-100">Quinzenal</Badge>}
                                        {client.customerProfile?.frequency === 'MONTHLY' && <Badge className="bg-purple-100 text-purple-700 hover:bg-purple-100">Mensal</Badge>}
                                        {(client.customerProfile?.frequency === 'ONE_TIME' || !client.customerProfile?.frequency) && <Badge variant="outline" className="text-gray-500">Avulso</Badge>}
                                    </TableCell>
                                    <TableCell>
                                        <span className="flex items-center text-sm max-w-[200px] truncate" title={client.customerProfile?.address || ""}>
                                            <MapPin className="w-3 h-3 mr-2 text-muted-foreground" />
                                            {client.customerProfile?.address || "Sem endereço"}
                                        </span>
                                    </TableCell>
                                    <TableCell>
                                        <span className="text-sm text-muted-foreground">
                                            {new Date(client.createdAt).toLocaleDateString()}
                                        </span>
                                    </TableCell>
                                    <TableCell>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" className="h-8 w-8 p-0">
                                                    <span className="sr-only">Abrir menu</span>
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end" className="w-[160px]">
                                                <DropdownMenuLabel>Ações</DropdownMenuLabel>
                                                <DropdownMenuItem onClick={() => window.location.href = `/admin/customers/${client.id}`}>
                                                    <ExternalLink className="mr-2 h-4 w-4" /> Ver Detalhes
                                                </DropdownMenuItem>

                                                {client.customerProfile?.latitude && (
                                                    <DropdownMenuItem onClick={() => window.location.href = `/admin/map?lat=${client.customerProfile?.latitude}&lng=${client.customerProfile?.longitude}&zoom=18&cid=${client.id}`}>
                                                        <MapPin className="mr-2 h-4 w-4 text-blue-600" /> Ver no Mapa
                                                    </DropdownMenuItem>
                                                )}

                                                <EditClientModal
                                                    client={client}
                                                    trigger={
                                                        <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                                                            <User className="mr-2 h-4 w-4" /> Editar Perfil
                                                        </DropdownMenuItem>
                                                    }
                                                />

                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem
                                                    className="text-red-600"
                                                    onClick={async () => {
                                                        if (confirm("Tem certeza que deseja excluir este cliente?")) {
                                                            const result = await deleteClient(client.id);
                                                            if (result.success) toast.success(result.success);
                                                            else toast.error(result.error);
                                                        }
                                                    }}
                                                >
                                                    <Trash className="mr-2 h-4 w-4" /> Excluir
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            ))}
                            {clients.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={5} className="h-24 text-center">
                                        Nenhum cliente encontrado.
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
