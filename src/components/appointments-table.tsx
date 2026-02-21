"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Search,
    Calendar as CalendarIcon,
    MapPin,
    CheckCircle,
    Clock,
    XCircle,
    ArrowUpDown,
    ArrowUp,
    ArrowDown
} from "lucide-react";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { AppointmentActions } from "@/components/appointment-actions";
import { Badge } from "@/components/ui/badge";
import { AppointmentStatus } from "@prisma/client";

interface AppointmentsTableProps {
    initialAppointments: any[];
    clients: any[];
    services: any[];
    employees: any[];
}

const getStatusBadge = (status: AppointmentStatus) => {
    switch (status) {
        case "PENDING":
            return <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded-full flex items-center w-fit"><Clock className="w-3 h-3 mr-1" /> Pendente</span>;
        case "CONFIRMED":
            return <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full flex items-center w-fit"><CheckCircle className="w-3 h-3 mr-1" /> Confirmado</span>;
        case "COMPLETED":
            return <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full flex items-center w-fit"><CheckCircle className="w-3 h-3 mr-1" /> Concluído</span>;
        case "CANCELLED":
            return <span className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full flex items-center w-fit"><XCircle className="w-3 h-3 mr-1" /> Cancelado</span>;
        default:
            return <span className="bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded-full">{status}</span>;
    }
};

export function AppointmentsTable({
    initialAppointments,
    clients,
    services,
    employees
}: AppointmentsTableProps) {
    const [query, setQuery] = useState("");
    const [filterType, setFilterType] = useState<string>("all");
    const [filterToday, setFilterToday] = useState(false);
    const [sortKey, setSortKey] = useState<string>("date");
    const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

    const filteredAndSortedAppointments = useMemo(() => {
        let result = [...initialAppointments];

        // 1. Filter by Search
        if (query) {
            const lowQuery = query.toLowerCase();
            result = result.filter(apt =>
                (apt.customer?.user?.name?.toLowerCase().includes(lowQuery)) ||
                (apt.service?.name?.toLowerCase().includes(lowQuery)) ||
                (apt.address?.toLowerCase().includes(lowQuery))
            );
        }

        // 1.1 Filter by Type (Recurring vs One-time)
        if (filterType !== "all") {
            result = result.filter(apt => {
                const customerFreq = apt.customer?.frequency;
                const isRecurring = customerFreq === "WEEKLY" || customerFreq === "BIWEEKLY" || customerFreq === "MONTHLY";

                if (filterType === "recurring") return isRecurring;
                if (filterType === "one-time") return !isRecurring;
                return true;
            });
        }

        // 1.2 Filter by Today
        if (filterToday) {
            const today = new Date();
            const todayStr = today.toISOString().split('T')[0];
            result = result.filter(apt => {
                const aptDate = new Date(apt.startTime).toISOString().split('T')[0];
                return aptDate === todayStr;
            });
        }

        // 2. Sort
        result.sort((a, b) => {
            let valA: any;
            let valB: any;

            switch (sortKey) {
                case "customer":
                    valA = a.customer?.user?.name || "";
                    valB = b.customer?.user?.name || "";
                    break;
                case "service":
                    valA = a.service?.name || "";
                    valB = b.service?.name || "";
                    break;
                case "employee":
                    valA = a.employee?.user?.name || "";
                    valB = b.employee?.user?.name || "";
                    break;
                case "status":
                    valA = a.status || "";
                    valB = b.status || "";
                    break;
                case "date":
                default:
                    valA = new Date(a.startTime).getTime();
                    valB = new Date(b.startTime).getTime();
                    break;
            }

            if (valA < valB) return sortOrder === "asc" ? -1 : 1;
            if (valA > valB) return sortOrder === "asc" ? 1 : -1;
            return 0;
        });

        return result;
    }, [initialAppointments, query, filterType, filterToday, sortKey, sortOrder]);

    const handleSort = (key: string) => {
        if (sortKey === key) {
            setSortOrder(sortOrder === "asc" ? "desc" : "asc");
        } else {
            setSortKey(key);
            setSortOrder("asc");
        }
    };

    const SortIcon = ({ column }: { column: string }) => {
        if (sortKey !== column) return <ArrowUpDown className="w-3 h-3 ml-1 opacity-20" />;
        return sortOrder === "asc" ? <ArrowUp className="w-3 h-3 ml-1 text-blue-600" /> : <ArrowDown className="w-3 h-3 ml-1 text-blue-600" />;
    };

    return (
        <Card className="flex-1 overflow-hidden flex flex-col border-violet-100 dark:border-violet-900/20">
            <CardHeader className="border-b space-y-4 md:space-y-0 md:flex-row md:items-center md:justify-between p-6">
                <div className="space-y-1.5">
                    <CardTitle>Agenda de Serviços</CardTitle>
                    <CardDescription>
                        {filteredAndSortedAppointments.length} agendamentos encontrados.
                    </CardDescription>
                </div>
                <div className="flex flex-col md:flex-row items-center gap-3 w-full md:w-auto">
                    <div className="w-full md:w-[180px]">
                        <Select value={filterType} onValueChange={setFilterType}>
                            <SelectTrigger className="h-9">
                                <span className="text-xs font-medium">Tipo: </span>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Todos</SelectItem>
                                <SelectItem value="recurring">Recorrentes</SelectItem>
                                <SelectItem value="one-time">Avulsos</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="relative flex items-center gap-2 w-full md:w-auto">
                        <div className="relative">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                className="pl-9 w-[250px]"
                                placeholder="Buscar cliente ou serviço..."
                            />
                        </div>
                        <Button
                            variant={filterToday ? "default" : "outline"}
                            size="sm"
                            onClick={() => {
                                setFilterToday(!filterToday);
                                if (!filterToday) {
                                    setSortKey("date");
                                    setSortOrder("asc");
                                }
                            }}
                            className={cn("text-xs h-9", filterToday && "bg-blue-600 hover:bg-blue-700")}
                        >
                            <CalendarIcon className="w-4 h-4 mr-2" />
                            Hoje
                        </Button>
                        {(query || filterToday || filterType !== 'all' || sortKey !== 'date' || sortOrder !== 'desc') && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                    setQuery("");
                                    setFilterType("all");
                                    setFilterToday(false);
                                    setSortKey("date");
                                    setSortOrder("desc");
                                }}
                                className="text-xs h-9"
                            >
                                Limpar
                            </Button>
                        )}
                    </div>
                </div>
            </CardHeader>
            <CardContent className="p-0 flex-1 overflow-auto">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead
                                className="cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors select-none"
                                onClick={() => handleSort('date')}
                            >
                                <div className="flex items-center py-3">
                                    Data / Hora <SortIcon column="date" />
                                </div>
                            </TableHead>
                            <TableHead
                                className="cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors select-none"
                                onClick={() => handleSort('customer')}
                            >
                                <div className="flex items-center py-3">
                                    Cliente <SortIcon column="customer" />
                                </div>
                            </TableHead>
                            <TableHead
                                className="cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors select-none"
                                onClick={() => handleSort('service')}
                            >
                                <div className="flex items-center py-3">
                                    Serviço <SortIcon column="service" />
                                </div>
                            </TableHead>
                            <TableHead
                                className="cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors select-none"
                                onClick={() => handleSort('employee')}
                            >
                                <div className="flex items-center py-3">
                                    Funcionário <SortIcon column="employee" />
                                </div>
                            </TableHead>
                            <TableHead
                                className="cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors select-none"
                                onClick={() => handleSort('status')}
                            >
                                <div className="flex items-center py-3">
                                    Status <SortIcon column="status" />
                                </div>
                            </TableHead>
                            <TableHead className="font-bold py-3">Duração</TableHead>
                            <TableHead className="font-bold py-3">Tipo</TableHead>
                            <TableHead className="w-[80px]"></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredAndSortedAppointments.map((apt) => (
                            <TableRow key={apt.id}>
                                <TableCell>
                                    <div className="flex flex-col text-sm">
                                        <span className="font-medium flex items-center">
                                            <CalendarIcon className="w-3 h-3 mr-1 text-muted-foreground" />
                                            {new Date(apt.startTime).toLocaleDateString()}
                                        </span>
                                        <span className="text-xs text-muted-foreground ml-4">
                                            {new Date(apt.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <div className="flex flex-col">
                                        <div className="flex items-center gap-2">
                                            <span className="font-medium">{apt.customer.user.name ?? "Cliente Desconhecido"}</span>
                                        </div>
                                        <span className="text-xs text-muted-foreground flex items-center mt-0.5 truncate max-w-[150px]" title={apt.address}>
                                            <MapPin className="w-3 h-3 mr-1" /> {apt.address}
                                        </span>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <span className="text-sm">
                                        {apt.service.name}
                                    </span>
                                </TableCell>
                                <TableCell>
                                    {apt.employee ? (
                                        <div className="flex items-center">
                                            <div
                                                className="h-2 w-2 rounded-full mr-2"
                                                style={{ backgroundColor: apt.employee.color || '#000' }}
                                            />
                                            <span className="text-sm">{apt.employee.user.name}</span>
                                        </div>
                                    ) : (
                                        <span className="text-xs text-muted-foreground italic">Não atribuído</span>
                                    )}
                                </TableCell>
                                <TableCell>
                                    {getStatusBadge(apt.status)}
                                </TableCell>
                                <TableCell>
                                    <div className="flex items-center gap-1.5 text-zinc-600 font-medium">
                                        <Clock className="w-3.5 h-3.5" />
                                        <span className="text-sm">
                                            {apt.customDuration || apt.service.durationMin || 0} min
                                        </span>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <Badge
                                        variant="outline"
                                        className={cn(
                                            "h-5 text-[10px] px-2 font-black uppercase tracking-tighter",
                                            apt.customer.frequency !== 'ONE_TIME'
                                                ? "bg-blue-50 text-blue-600 border-blue-100"
                                                : "bg-zinc-100 text-zinc-600 border-zinc-200"
                                        )}
                                    >
                                        {apt.customer.frequency === 'ONE_TIME' ? 'Avulso' : 'Recorrente'}
                                    </Badge>
                                </TableCell>
                                <TableCell>
                                    <AppointmentActions
                                        appointment={apt}
                                        clients={clients}
                                        services={services}
                                        employees={employees}
                                    />
                                </TableCell>
                            </TableRow>
                        ))}
                        {filteredAndSortedAppointments.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                                    Nenhum agendamento encontrado para os filtros aplicados.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}
