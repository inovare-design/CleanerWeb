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
    Layers,
    UserSquare2
} from "lucide-react";
import { signOut } from "next-auth/react";
import { Button } from "./ui/button";
import { ExtendedUser } from "../../next-auth";
import { APP_VERSION } from "@/lib/version";
import { GlobalSearch } from "./admin/global-search";

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
        permission: "appointments:manage"
    },
    {
        label: "Calendário",
        icon: CalendarDays,
        href: "/admin/calendar",
        color: "text-blue-400",
        permission: "appointments:manage"
    },
    {
        label: "Rotas em Tempo Real",
        icon: MapPin,
        href: "/admin/routes",
        color: "text-pink-400",
        permission: "routes:view"
    },
    {
        label: "Base de Clientes",
        icon: Users,
        href: "/admin/customers",
        color: "text-orange-400",
        permission: "customers:manage"
    },
    {
        label: "Mapa de Clientes",
        icon: Truck,
        href: "/admin/map",
        color: "text-yellow-400",
        permission: "routes:view"
    },
    {
        label: "Equipe / Frota",
        icon: UserSquare2,
        href: "/admin/employees",
        color: "text-emerald-400",
        permission: "team:read"
    },
    {
        label: "Catálogo Serviços",
        icon: Layers,
        href: "/admin/services",
        color: "text-indigo-400",
        permission: "services:manage"
    },
    {
        label: "Financeiro",
        icon: DollarSign,
        href: "/admin/finance",
        color: "text-green-400",
        permission: "finance:read"
    },
    {
        label: "Configurações",
        icon: Settings,
        href: "/admin/settings",
        color: "text-gray-400",
        permission: "admin:full"
    },
];

interface AdminSidebarProps {
    user: ExtendedUser;
    tenant?: {
        name: string;
        logoUrl?: string | null;
        description?: string | null;
    } | null;
}

export const AdminSidebar = ({ user, tenant }: AdminSidebarProps) => {
    const pathname = usePathname();

    const filteredRoutes = routes.filter(route => {
        // SUPER_ADMIN sees everything
        if (user.role === "SUPER_ADMIN") return true;

        // If it's a dashboard, show to everyone
        if (route.href === "/admin") return true;

        // If user has a profile, we should ideally check permissions here.
        // For now, if no profileId, we assume full access (legacy ADMIN)
        if (!user.profileId) return user.role === "ADMIN";

        // If they HAVE a profile, we'd need the permissions array in the 'user' object
        // Since we haven't updated the Session callback yet, this is a placeholder
        // for where the filtering will happen. For now, show all to avoid blocking.
        return true;
    });

    return (
        <div className="space-y-4 py-4 flex flex-col h-full bg-[#111827] text-white border-r border-[#1f2937]">
            <div className="px-3 py-2 flex-1">
                <Link href="/admin" className="flex items-center pl-2 mb-6 mt-2 group">
                    <div className="relative w-8 h-8 mr-3 flex items-center justify-center transition-transform group-hover:scale-110">
                        {tenant?.logoUrl ? (
                            <img
                                src={tenant.logoUrl}
                                alt={tenant.name}
                                className="w-full h-full object-contain rounded-md"
                            />
                        ) : (
                            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shadow-lg shadow-blue-900/20">
                                <Truck className="h-5 w-5 text-white" />
                            </div>
                        )}
                    </div>
                    <div className="flex-1 min-w-0">
                        <h1 className="text-sm font-black italic tracking-tighter uppercase leading-none truncate text-white flex items-center gap-1.5">
                            {tenant?.name || "CleanRoute"}
                            {!tenant?.logoUrl && (
                                <span className="text-[8px] font-medium text-blue-400/80 bg-blue-400/10 px-1 py-0.5 rounded border border-blue-400/20 tabular-nums">
                                    {APP_VERSION}
                                </span>
                            )}
                        </h1>
                        <p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest mt-1 truncate">
                            {tenant?.description || "Service Dispatch"}
                        </p>
                    </div>
                </Link>

                <GlobalSearch />

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

                <div className="mt-4 pt-4 border-t border-[#1f2937] text-center">
                    <span className="text-[10px] font-bold text-gray-500 tracking-widest uppercase">
                        {APP_VERSION}
                    </span>
                </div>
            </div>
        </div>
    );
};
