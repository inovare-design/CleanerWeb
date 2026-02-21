"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Calendar, PlusCircle, User, DollarSign, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "./ui/button";
import { signOut } from "next-auth/react";

interface ClientNavProps {
    tenant?: {
        name: string;
        logoUrl?: string | null;
        description?: string | null;
    } | null;
}

export function ClientNav({ tenant }: ClientNavProps) {
    const pathname = usePathname();

    const links = [
        { href: "/app", label: "Início", icon: Home },
        { href: "/app/appointments", label: "Agendamentos", icon: Calendar },
        { href: "/app/book", label: "Agendar", icon: PlusCircle, highlight: true },
        { href: "/app/invoices", label: "Faturas", icon: DollarSign },
        { href: "/app/profile", label: "Perfil", icon: User },
    ];

    return (
        <>
            {/* Desktop Header */}
            <header className="hidden md:flex items-center justify-between px-6 py-3 bg-white/80 backdrop-blur-md border-b sticky top-0 z-50">
                <Link href="/app" className="flex items-center gap-3 group">
                    {tenant?.logoUrl ? (
                        <img src={tenant.logoUrl} alt={tenant.name} className="h-9 w-9 object-contain rounded-lg transition-transform group-hover:scale-105" />
                    ) : (
                        <div className="h-9 w-9 bg-blue-600 rounded-lg flex items-center justify-center shadow-sm transition-transform group-hover:scale-105">
                            <span className="text-white font-bold text-sm">
                                {(tenant?.name || "C")[0].toUpperCase()}
                            </span>
                        </div>
                    )}
                    <div className="flex flex-col">
                        <span className="font-black text-lg tracking-tight leading-tight uppercase italic">
                            {tenant?.name || "CleanRoute"}
                        </span>
                        <span className="text-[9px] font-bold text-blue-600 tracking-widest uppercase leading-tight">
                            {tenant?.description || "Área do Cliente"}
                        </span>
                    </div>
                </Link>

                <nav className="flex items-center gap-1">
                    {links.map(link => (
                        <Link
                            key={link.href}
                            href={link.href}
                            className={cn(
                                "text-sm font-medium transition-all px-3 py-2 rounded-lg flex items-center gap-2",
                                pathname === link.href
                                    ? "text-blue-600 bg-blue-50"
                                    : "text-gray-500 hover:text-blue-600 hover:bg-gray-50",
                                link.highlight && "bg-blue-600 text-white hover:bg-blue-700 hover:text-white shadow-md shadow-blue-500/20 rounded-full px-5"
                            )}
                        >
                            <link.icon className="h-4 w-4" />
                            {link.label}
                        </Link>
                    ))}
                    <div className="w-px h-6 bg-gray-200 mx-2" />
                    <Button variant="ghost" size="sm" onClick={() => signOut()} className="text-gray-400 hover:text-red-500">
                        <LogOut className="h-4 w-4" />
                    </Button>
                </nav>
            </header>

            {/* Mobile Bottom Bar */}
            <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-xl border-t z-50 pb-safe shadow-[0_-4px_20px_rgba(0,0,0,0.06)]">
                <nav className="flex justify-around items-center h-16 px-2">
                    {links.map(link => (
                        <Link
                            key={link.href}
                            href={link.href}
                            className={cn(
                                "flex flex-col items-center justify-center w-full h-full space-y-0.5 transition-all",
                                pathname === link.href ? "text-blue-600" : "text-gray-400",
                                link.highlight && "text-blue-600"
                            )}
                        >
                            {link.highlight ? (
                                <div className="bg-blue-600 text-white p-3 rounded-2xl -mt-7 shadow-lg shadow-blue-500/30 border-4 border-white">
                                    <link.icon className="h-5 w-5" />
                                </div>
                            ) : (
                                <>
                                    <link.icon className={cn("h-5 w-5", pathname === link.href && "scale-110")} />
                                    <span className="text-[9px] font-bold tracking-tight">{link.label}</span>
                                </>
                            )}
                        </Link>
                    ))}
                </nav>
            </div>
        </>
    );
}
