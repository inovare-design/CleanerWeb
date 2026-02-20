"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Calendar, PlusCircle, User, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "./ui/button";
import { signOut } from "next-auth/react";

import { APP_VERSION } from "@/lib/version";

export function ClientNav() {
    const pathname = usePathname();

    const links = [
        { href: "/app", label: "Início", icon: Home },
        { href: "/app/appointments", label: "Agendamentos", icon: Calendar },
        { href: "/app/book", label: "Agendar", icon: PlusCircle, highlight: true },
        { href: "/app/profile", label: "Perfil", icon: User },
    ];

    return (
        <>
            {/* Desktop Header */}
            <header className="hidden md:flex items-center justify-between px-6 py-4 bg-white/80 backdrop-blur-md border-b sticky top-0 z-50">
                <div className="flex items-center gap-2">
                    <div className="h-8 w-8 bg-blue-600 rounded-lg flex items-center justify-center">
                        <span className="text-white font-bold">C</span>
                    </div>
                    <div className="flex flex-col">
                        <span className="font-bold text-xl tracking-tight leading-tight">CleanRoute</span>
                        <span className="text-[9px] font-bold text-blue-600 tracking-widest uppercase leading-tight">{APP_VERSION}</span>
                    </div>
                </div>

                <nav className="flex items-center gap-6">
                    {links.map(link => (
                        <Link
                            key={link.href}
                            href={link.href}
                            className={cn(
                                "text-sm font-medium transition-colors hover:text-blue-600 flex items-center gap-2",
                                pathname === link.href ? "text-blue-600" : "text-gray-500",
                                link.highlight && "bg-blue-600 text-white px-4 py-2 rounded-full hover:text-white hover:bg-blue-700 shadow-md shadow-blue-500/20"
                            )}
                        >
                            <link.icon className="h-4 w-4" />
                            {link.label}
                        </Link>
                    ))}
                    <Button variant="ghost" size="sm" onClick={() => signOut()}>
                        <LogOut className="h-4 w-4" />
                    </Button>
                </nav>
            </header>

            {/* Mobile Bottom Bar */}
            <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-lg border-t z-50 pb-safe">
                <nav className="flex justify-around items-center h-16">
                    {links.map(link => (
                        <Link
                            key={link.href}
                            href={link.href}
                            className={cn(
                                "flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors",
                                pathname === link.href ? "text-blue-600" : "text-gray-400",
                                link.highlight && "text-blue-600"
                            )}
                        >
                            {link.highlight ? (
                                <div className="bg-blue-600 text-white p-3 rounded-full -mt-8 shadow-lg shadow-blue-500/30 border-4 border-white">
                                    <link.icon className="h-6 w-6" />
                                </div>
                            ) : (
                                <link.icon className="h-5 w-5" />
                            )}
                            {!link.highlight && <span className="text-[10px] font-medium">{link.label}</span>}
                        </Link>
                    ))}
                </nav>
            </div>
        </>
    );
}
