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
import { Search, MoreHorizontal, Mail, Phone, User as UserIcon } from "lucide-react";
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
import { CreateEmployeeModal } from "@/components/modals/create-employee-modal";
import { EmployeeUserActions } from "@/components/employee-user-actions";

// Definir tipo para o funcionário com perfil
type EmployeeWithProfile = {
    id: string;
    name: string | null;
    email: string;
    createdAt: Date;
    profileId: string | null;
    profile: {
        id: string;
        name: string;
    } | null;
    employeeProfile: {
        phone: string | null;
        color: string | null;
    } | null;
};

async function getEmployees(query: string) {
    const employees = await db.user.findMany({
        where: {
            role: "CLEANER",
            OR: [
                { name: { contains: query } },
                { email: { contains: query } }
            ]
        },
        include: {
            employeeProfile: true,
            profile: true
        },
        orderBy: {
            createdAt: 'desc'
        }
    });
    return employees;
}

export default async function EmployeesPage(props: {
    searchParams?: Promise<{
        q?: string;
    }>;
}) {
    const session = await auth();
    if (!session) redirect("/login");

    const searchParams = await props.searchParams;
    const query = searchParams?.q || "";
    const employees = await getEmployees(query);

    const staffProfiles = await db.permissionProfile.findMany({
        where: {
            tenantId: session.user.tenantId!,
            type: "STAFF"
        }
    });

    return (
        <div className="p-8 space-y-8 h-full flex flex-col">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Equipe / Frota</h2>
                    <p className="text-muted-foreground">
                        Gerencie seus funcionários e cleaners disponíveis.
                    </p>
                </div>
                <div className="flex items-center space-x-2">
                    <CreateEmployeeModal profiles={staffProfiles} />
                </div>
            </div>

            <Card className="flex-1 overflow-hidden flex flex-col border-emerald-100 dark:border-emerald-900/20">
                <CardHeader className="border-b space-y-4 md:space-y-0 md:flex-row md:items-center md:justify-between p-6">
                    <div className="space-y-1.5">
                        <CardTitle>Membros da Equipe</CardTitle>
                        <CardDescription>
                            {employees.length} profissionais ativos.
                        </CardDescription>
                    </div>
                    <div className="flex items-center space-x-2 w-full md:w-auto">
                        <form className="relative flex items-center">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                name="q"
                                defaultValue={searchParams?.q}
                                className="pl-9 w-[250px]"
                                placeholder="Buscar funcionário..."
                            />
                        </form>
                    </div>
                </CardHeader>
                <CardContent className="p-0 flex-1 overflow-auto">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[50px]">Avatar</TableHead>
                                <TableHead>Nome / Email</TableHead>
                                <TableHead>Telefone</TableHead>
                                <TableHead>Data Cadastro</TableHead>
                                <TableHead className="w-[80px]"></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {(employees as EmployeeWithProfile[]).map((emp) => (
                                <TableRow key={emp.id}>
                                    <TableCell>
                                        <div
                                            className="h-9 w-9 rounded-full flex items-center justify-center text-xs font-bold text-white shadow-sm"
                                            style={{ backgroundColor: emp.employeeProfile?.color || "#10b981" }}
                                        >
                                            {emp.name?.substring(0, 2).toUpperCase() || "EF"}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex flex-col">
                                            <span className="font-medium">{emp.name}</span>
                                            <span className="text-xs text-muted-foreground flex items-center mt-0.5">
                                                <Mail className="w-3 h-3 mr-1" /> {emp.email}
                                            </span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <span className="flex items-center text-sm">
                                            <Phone className="w-3 h-3 mr-2 text-muted-foreground" />
                                            {emp.employeeProfile?.phone || "N/A"}
                                        </span>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex flex-col">
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800 w-fit">
                                                Cleaner
                                            </span>
                                            {emp.profile && (
                                                <span className="text-[10px] text-zinc-500 mt-1 uppercase font-medium">
                                                    Perfil: {emp.profile.name}
                                                </span>
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <span className="text-sm text-muted-foreground">
                                            {new Date(emp.createdAt).toLocaleDateString()}
                                        </span>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <EmployeeUserActions
                                            userId={emp.id}
                                            profiles={staffProfiles}
                                            currentProfileId={emp.profileId}
                                        />
                                    </TableCell>
                                </TableRow>
                            ))}
                            {employees.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={6} className="h-48 text-center">
                                        <div className="flex flex-col items-center justify-center space-y-3 opacity-60">
                                            <div className="p-4 bg-zinc-100 dark:bg-zinc-800 rounded-full">
                                                <UserIcon className="w-8 h-8 text-zinc-400" />
                                            </div>
                                            <div className="space-y-1">
                                                <p className="text-lg font-semibold">Nenhum profissional encontrado</p>
                                                <p className="text-sm text-muted-foreground max-w-[300px] mx-auto">
                                                    {query
                                                        ? `Não encontramos resultados para "${query}". Tente buscar por outro nome ou email.`
                                                        : "Sua equipe ainda está vazia. Adicione seu primeiro funcionário para começar a gerenciar os agendamentos."
                                                    }
                                                </p>
                                            </div>
                                            {!query && <CreateEmployeeModal profiles={staffProfiles} />}
                                        </div>
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
