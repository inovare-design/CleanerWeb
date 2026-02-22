"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
    Activity,
    AlertTriangle,
    CheckCircle2,
    Zap,
    TrendingUp,
    Map as MapIcon,
    ChevronRight,
    Search
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface DispatchSidebarProps {
    appointments: any[];
    employees: any[];
}

export function DispatchSidebar({ appointments, employees }: DispatchSidebarProps) {
    const completedCount = appointments.filter(a => a.status === "COMPLETED").length;
    const pendingCount = appointments.filter(a => a.status === "PENDING").length;
    const progressCount = appointments.filter(a => a.status === "IN_PROGRESS").length;

    const completionRate = appointments.length > 0 ? Math.round((completedCount / appointments.length) * 100) : 0;

    // Detect Conflicts (simplified overlap check)
    const conflicts = appointments.filter((a, i) => {
        return appointments.some((b, j) => {
            if (i === j) return false;
            if (a.employeeId !== b.employeeId || !a.employeeId) return false;

            const startA = new Date(a.startTime).getTime();
            const endA = new Date(a.endTime).getTime();
            const startB = new Date(b.startTime).getTime();
            const endB = new Date(b.endTime).getTime();

            return startA < endB && startB < endA;
        });
    });

    return (
        <div className="w-80 border-l bg-zinc-50/50 dark:bg-zinc-950/50 flex flex-col h-full overflow-hidden animate-in slide-in-from-right duration-500">
            <div className="p-6 border-b bg-white dark:bg-zinc-950 space-y-4">
                <div className="flex items-center justify-between font-black uppercase tracking-tighter text-sm italic">
                    <span className="flex items-center gap-2">
                        <Activity className="w-4 h-4 text-blue-500" />
                        Live Dispatch
                    </span>
                    <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-100 text-[10px] animate-pulse">
                        Active
                    </Badge>
                </div>

                <div className="grid grid-cols-2 gap-3">
                    <div className="bg-white dark:bg-zinc-900 p-4 rounded-2xl border shadow-sm flex flex-col items-center text-center">
                        <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1">Taxa de Conclusão</p>
                        <p className="text-2xl font-black text-blue-600">{completionRate}%</p>
                    </div>
                    <div className="bg-white dark:bg-zinc-900 p-4 rounded-2xl border shadow-sm flex flex-col items-center text-center">
                        <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1">Carga de Staff</p>
                        <p className="text-2xl font-black text-emerald-600">{appointments.length}</p>
                    </div>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
                {/* Optimization AI */}
                <div className="space-y-4">
                    <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-zinc-400 flex items-center justify-between">
                        Recomendações AI
                        <Badge className="bg-indigo-500 hover:bg-indigo-600 border-none text-[8px] h-4">PRO</Badge>
                    </h3>
                    <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-4 rounded-2xl text-white shadow-lg shadow-indigo-500/20">
                        <div className="flex items-center gap-2 mb-2 font-black text-xs uppercase tracking-widest">
                            <Zap className="w-4 h-4 fill-white" />
                            Smart Dispatch
                        </div>
                        <p className="text-[10px] font-medium leading-relaxed opacity-90">
                            Reatribuir a Rota #44 para Sophia reduziria o tempo de deslocamento em 12 minutos.
                        </p>
                        <button className="mt-3 w-full bg-white/20 hover:bg-white/30 backdrop-blur-md py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-colors">
                            Aplicar Reatribuição
                        </button>
                    </div>
                </div>

                {/* Conflicts Section */}
                <div className="space-y-4">
                    <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-zinc-400">Alertas de Conflito</h3>
                    <div className="space-y-3">
                        {conflicts.length > 0 ? (
                            conflicts.map((apt: any) => (
                                <div key={apt.id} className="bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/30 p-4 rounded-2xl flex items-start gap-3 group cursor-pointer hover:bg-red-100/50 transition-colors">
                                    <AlertTriangle className="w-4 h-4 text-red-500 shrink-0" />
                                    <div className="flex flex-col min-w-0">
                                        <p className="text-[11px] font-black text-red-900 dark:text-red-200 uppercase truncate">
                                            Sobreposição detectada
                                        </p>
                                        <p className="text-[10px] font-medium text-red-700/70 dark:text-red-400/70 truncate">
                                            {apt.customer.user.name} @ {new Date(apt.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </p>
                                    </div>
                                    <ChevronRight className="w-4 h-4 text-red-300 ml-auto group-hover:translate-x-1 transition-transform" />
                                </div>
                            ))
                        ) : (
                            <div className="flex flex-col items-center justify-center py-8 text-zinc-300">
                                <CheckCircle2 className="w-8 h-8 opacity-20 mb-2" />
                                <p className="text-[10px] font-bold uppercase tracking-widest">Sem conflitos</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Quick Stats Grid */}
                <div className="space-y-4">
                    <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-zinc-400">Eficiência de Frota</h3>
                    <div className="grid grid-cols-1 gap-3">
                        <div className="flex items-center justify-between p-3 bg-white dark:bg-zinc-900 border rounded-2xl shadow-sm">
                            <div className="flex items-center gap-3">
                                <div className="bg-emerald-50 p-2 rounded-xl">
                                    <TrendingUp className="w-4 h-4 text-emerald-500" />
                                </div>
                                <span className="text-xs font-bold text-zinc-600 dark:text-zinc-400">PONTUALIDADE</span>
                            </div>
                            <span className="text-sm font-black text-emerald-600">94%</span>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-white dark:bg-zinc-900 border rounded-2xl shadow-sm">
                            <div className="flex items-center gap-3">
                                <div className="bg-blue-50 p-2 rounded-xl">
                                    <MapIcon className="w-4 h-4 text-blue-500" />
                                </div>
                                <span className="text-xs font-bold text-zinc-600 dark:text-zinc-400">KM TOTAL HOJE</span>
                            </div>
                            <span className="text-sm font-black text-blue-600">412km</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="p-6 border-t bg-white dark:bg-zinc-950">
                <div className="relative group">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 group-focus-within:text-blue-500 transition-colors" />
                    <input
                        type="text"
                        placeholder="Pesquisar staff ou rota..."
                        className="w-full bg-zinc-100 dark:bg-zinc-900 border-none rounded-2xl py-3 pl-10 pr-4 text-xs font-medium focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                    />
                </div>
            </div>
        </div>
    );
}
