"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
    LayoutDashboard,
    Calendar,
    CalendarDays,
    Users,
    Briefcase,
    Settings,
    LogOut,
    MapPin,
    DollarSign,
    Truck,
    Layers
} from "lucide-react";
import { signOut } from "next-auth/react";
import { Button } from "./ui/button";
import { ExtendedUser } from "../../next-auth";

const routes = [
    {
        label: "Visão Geral",
        icon: LayoutDashboard,
        href: "/admin",
        color: "text-sky-400",
    },
    {
        label: "Agendamentos",
        icon: Calendar,
        href: "/admin/appointments",
        color: "text-violet-400",
    },
    {
        label: "Calendário",
        icon: CalendarDays,
        href: "/admin/calendar",
        color: "text-blue-400",
    },
    {
        label: "Rotas em Tempo Real",
        icon: MapPin,
        href: "/admin/routes",
        color: "text-pink-400",
    },
    {
        label: "Base de Clientes",
        icon: Users,
        href: "/admin/customers",
        color: "text-orange-400",
    },
    {
        label: "Equipe / Frota",
        icon: Briefcase,
        href: "/admin/employees",
        color: "text-emerald-400",
    },
    {
        label: "Catálogo Serviços",
        icon: Layers,
        href: "/admin/services",
        color: "text-indigo-400",
    },
    {
        label: "Financeiro",
        icon: DollarSign,
        href: "/admin/finance",
        color: "text-green-400",
    },
    {
        label: "Configurações",
        icon: Settings,
        href: "/admin/settings",
        color: "text-gray-400",
    },
];

interface AdminSidebarProps {
    user: ExtendedUser;
}

export const AdminSidebar = ({ user }: AdminSidebarProps) => {
    const pathname = usePathname();

    const filteredRoutes = routes.filter(route => {
        if (route.href === "/admin/settings") {
            return user.role === "SUPER_ADMIN";
        }
        return true;
    });

    return (
        <div className="space-y-4 py-4 flex flex-col h-full bg-[#111827] text-white border-r border-[#1f2937]">
            <div className="px-3 py-2 flex-1">
                <Link href="/admin" className="flex items-center pl-2 mb-6 mt-2">
                    <div className="relative w-8 h-8 mr-3 flex items-center justify-center bg-blue-600 rounded-lg shadow-lg shadow-blue-900/20">
                        <Truck className="h-5 w-5 text-white" />
                    </div>
                    <div>
                        <h1 className="text-lg font-bold tracking-tight text-white">
                            CleanRoute
                        </h1>
                        <p className="text-[9px] text-gray-400 font-medium tracking-wider uppercase">
                            Service Dispatch
                        </p>
                    </div>
                </Link>
                <div className="space-y-1">
                    {filteredRoutes.map((route) => (
                        <Link
                            key={route.href}
                            href={route.href}
                            className={cn(
                                "text-sm group flex p-3 w-full justify-start font-medium cursor-pointer rounded-lg transition-all duration-200",
                                pathname === route.href
                                    ? "bg-blue-600 text-white shadow-md shadow-blue-900/20"
                                    : "text-gray-400 hover:text-white hover:bg-white/5"
                            )}
                        >
                            <div className="flex items-center flex-1">
                                <route.icon className={cn("h-5 w-5 mr-3 transition-colors", pathname === route.href ? "text-white" : route.color)} />
                                {route.label}
                            </div>
                        </Link>
                    ))}
                </div>
            </div>

            {/* Footer / User Profile Area */}
            <div className="px-3 py-4 border-t border-[#1f2937] bg-[#0f1523]/50">
                <div className="flex items-center gap-3 px-2 mb-3">
                    <div className="h-9 w-9 rounded-full bg-indigo-500 flex items-center justify-center text-sm font-bold border-2 border-[#1f2937]">
                        {user.name?.substring(0, 2).toUpperCase() || "AD"}
                    </div>
                    <div className="flex-1 overflow-hidden">
                        <p className="text-sm font-medium text-white truncate">{user.name}</p>
                        <p className="text-xs text-gray-400 truncate">{user.email}</p>
                    </div>
                </div>
                <Button
                    onClick={() => signOut()}
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start text-gray-400 hover:text-red-400 hover:bg-red-950/30 pl-2"
                >
                    <LogOut className="h-4 w-4 mr-2" />
                    Sair do Sistema
                </Button>
            </div>
        </div>
    );
};
