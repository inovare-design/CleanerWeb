import { auth } from "@/auth";
import { redirect } from "next/navigation";
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
import { Search, MoreHorizontal, Clock, DollarSign } from "lucide-react";
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
import { CreateServiceModal } from "@/components/modals/create-service-modal";

// Tipo auxiliar para converter Decimal para string/number se necessário, embora prisma retorne Decimal
import { Decimal } from "@prisma/client/runtime/library";

type Service = {
    id: string;
    name: string;
    description: string | null;
    durationMin: number;
    price: Decimal;
    createdAt: Date;
};

async function getServices(query: string) {
    const services = await db.service.findMany({
        where: {
            name: { contains: query }
        },
        orderBy: {
            name: 'asc'
        }
    });
    return services;
}

export default async function ServicesPage(props: {
    searchParams?: Promise<{
        q?: string;
    }>;
}) {
    const session = await auth();
    if (!session) redirect("/login");

    const searchParams = await props.searchParams;
    const query = searchParams?.q || "";
    const services = await getServices(query);

    return (
        <div className="p-8 space-y-8 h-full flex flex-col">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Catálogo de Serviços</h2>
                    <p className="text-muted-foreground">
                        Configure os serviços e preços oferecidos.
                    </p>
                </div>
                <div className="flex items-center space-x-2">
                    <CreateServiceModal />
                </div>
            </div>

            <Card className="flex-1 overflow-hidden flex flex-col border-indigo-100 dark:border-indigo-900/20">
                <CardHeader className="border-b space-y-4 md:space-y-0 md:flex-row md:items-center md:justify-between p-6">
                    <div className="space-y-1.5">
                        <CardTitle>Serviços Ativos</CardTitle>
                        <CardDescription>
                            {services.length} serviços no catálogo.
                        </CardDescription>
                    </div>
                    <div className="flex items-center space-x-2 w-full md:w-auto">
                        <form className="relative flex items-center">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                name="q"
                                defaultValue={searchParams?.q}
                                className="pl-9 w-[250px]"
                                placeholder="Buscar serviço..."
                            />
                        </form>
                    </div>
                </CardHeader>
                <CardContent className="p-0 flex-1 overflow-auto">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Nome e Descrição</TableHead>
                                <TableHead>Duração</TableHead>
                                <TableHead>Preço</TableHead>
                                <TableHead className="w-[80px]"></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {(services as Service[]).map((service) => (
                                <TableRow key={service.id}>
                                    <TableCell>
                                        <div className="flex flex-col">
                                            <span className="font-medium">{service.name}</span>
                                            {service.description && (
                                                <span className="text-xs text-muted-foreground mt-0.5">
                                                    {service.description}
                                                </span>
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <span className="flex items-center text-sm">
                                            <Clock className="w-3 h-3 mr-2 text-muted-foreground" />
                                            {service.durationMin} min
                                        </span>
                                    </TableCell>
                                    <TableCell>
                                        <span className="flex items-center text-sm font-medium text-emerald-600">
                                            <DollarSign className="w-3 h-3 mr-1" />
                                            {Number(service.price).toFixed(2)}
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
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuLabel>Ações</DropdownMenuLabel>
                                                <DropdownMenuItem>Editar</DropdownMenuItem>
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem className="text-red-600">Arquivar</DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            ))}
                            {services.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={4} className="h-24 text-center">
                                        Nenhum serviço cadastrado.
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
