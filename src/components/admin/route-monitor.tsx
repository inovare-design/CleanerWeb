"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Navigation, Clock, User, CheckCircle2, PlayCircle, Map as MapIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { getLiveRoutes } from "@/actions/get-live-routes";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface RouteMonitorProps {
    initialRoutes: any[];
}

export function RouteMonitor({ initialRoutes }: RouteMonitorProps) {
    const [routes, setRoutes] = useState(initialRoutes);
    const [lastUpdate, setLastUpdate] = useState(new Date());
    const [isRefreshing, setIsRefreshing] = useState(false);

    const refresh = useCallback(async () => {
        setIsRefreshing(true);
        try {
            const freshData = await getLiveRoutes();
            setRoutes(freshData);
            setLastUpdate(new Date());
        } catch (error) {
            console.error("Failed to refresh routes:", error);
            toast.error("Erro ao atualizar rotas");
        } finally {
            setIsRefreshing(false);
        }
    }, []);

    useEffect(() => {
        const interval = setInterval(refresh, 30000); // 30s
        return () => clearInterval(interval);
    }, [refresh]);

    if (routes.length === 0) {
        return (
            <Card className="border-dashed">
                <CardContent className="flex flex-col items-center justify-center p-12 text-muted-foreground">
                    <MapPin className="w-12 h-12 mb-4 opacity-20" />
                    <p>Nenhum agendamento para as rotas de hoje.</p>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 h-full min-h-[600px]">
            {/* Sidebar with Stats & Info */}
            <div className="lg:col-span-3 space-y-4 overflow-y-auto pr-2 custom-scrollbar">
                <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between mb-2">
                        <h3 className="text-sm font-black uppercase tracking-widest text-zinc-400">Visão Geral</h3>
                        <Badge variant="outline" className="text-[10px] bg-emerald-50 text-emerald-700 border-emerald-100 flex gap-1">
                            <div className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" />
                            LIVE
                        </Badge>
                    </div>
                    <div className="grid grid-cols-1 gap-2">
                        <div className="bg-white dark:bg-zinc-900 p-4 rounded-2xl border shadow-sm">
                            <p className="text-[10px] font-bold text-muted-foreground uppercase">Ativos Agora</p>
                            <p className="text-2xl font-black">{routes.filter((r: any) => r.employee.latitude).length}</p>
                        </div>
                        <div className="bg-white dark:bg-zinc-900 p-4 rounded-2xl border shadow-sm">
                            <p className="text-[10px] font-bold text-muted-foreground uppercase">Em Serviço</p>
                            <p className="text-2xl font-black">
                                {routes.reduce((acc: number, r: any) => acc + r.appointments.filter((a: any) => a.status === 'IN_PROGRESS').length, 0)}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="pt-4 border-t">
                    <h3 className="text-sm font-black uppercase tracking-widest text-zinc-400 mb-4">Atualização</h3>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>Última vez: {format(lastUpdate, "HH:mm:ss")}</span>
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 text-[10px] font-bold hover:bg-zinc-100 dark:hover:bg-zinc-800"
                            onClick={refresh}
                            disabled={isRefreshing}
                        >
                            {isRefreshing ? "Atualizando..." : "Atualizar Agora"}
                        </Button>
                    </div>
                </div>
            </div>

            {/* Timelines Container */}
            <div className="lg:col-span-9 grid grid-cols-1 md:grid-cols-2 gap-6 pb-12">
                {routes.map((route: any) => (
                    <Card key={route.employee.id} className="border-0 shadow-xl overflow-hidden rounded-3xl flex flex-col h-fit">
                        <CardHeader className="bg-zinc-900 text-white p-6">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div
                                        className="w-12 h-12 rounded-2xl flex items-center justify-center text-white font-black text-lg shadow-inner ring-2 ring-white/10"
                                        style={{ backgroundColor: route.employee.color || '#4F46E5' }}
                                    >
                                        {route.employee.name.substring(0, 2).toUpperCase()}
                                    </div>
                                    <div>
                                        <CardTitle className="text-lg font-black tracking-tight">{route.employee.name}</CardTitle>
                                        <div className="flex items-center gap-2 mt-0.5">
                                            <div className={cn(
                                                "h-2 w-2 rounded-full",
                                                route.employee.latitude ? "bg-emerald-500 animate-pulse" : "bg-zinc-500"
                                            )} />
                                            <span className="text-[10px] font-black uppercase tracking-widest opacity-60">
                                                {route.employee.latitude ? "Localização Ativa" : "Sinal Perdido"}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-[10px] font-black uppercase tracking-widest opacity-40">Rotas de Hoje</p>
                                    <p className="text-xl font-black">{route.appointments.length}</p>
                                </div>
                            </div>
                        </CardHeader>

                        <CardContent className="p-8 bg-zinc-50 dark:bg-black/20">
                            <div className="relative">
                                {/* Vertical Path Line */}
                                <div className="absolute left-[19px] top-6 bottom-6 w-[3px] bg-zinc-200 dark:bg-zinc-800 rounded-full" />

                                <div className="space-y-12 relative">
                                    {route.appointments.map((apt: any, idx: number) => {
                                        const isEnRoute = apt.status === "EN_ROUTE";
                                        const isInProgress = apt.status === "IN_PROGRESS";
                                        const isCompleted = apt.status === "COMPLETED";

                                        return (
                                            <div key={apt.id} className="relative">
                                                {/* En Route Marker (Staff between points) */}
                                                <AnimatePresence>
                                                    {isEnRoute && (
                                                        <motion.div
                                                            initial={{ opacity: 0, y: -20 }}
                                                            animate={{ opacity: 1, y: -45 }}
                                                            exit={{ opacity: 0 }}
                                                            className="absolute left-[10px] top-0 z-20"
                                                        >
                                                            <div className="flex flex-col items-center">
                                                                <div className="bg-blue-600 text-white p-1.5 rounded-full shadow-lg ring-4 ring-blue-100 dark:ring-blue-900/50">
                                                                    <Navigation className="w-4 h-4 fill-white" />
                                                                </div>
                                                                <div className="mt-1 bg-blue-600 text-white text-[8px] font-black uppercase px-2 py-0.5 rounded-full shadow-md whitespace-nowrap">
                                                                    Em Deslocamento
                                                                </div>
                                                            </div>
                                                        </motion.div>
                                                    )}
                                                </AnimatePresence>

                                                <div className="flex gap-6 group">
                                                    {/* Timeline Node */}
                                                    <div className="relative z-10 pt-1">
                                                        <div className={cn(
                                                            "w-10 h-10 rounded-2xl flex items-center justify-center transition-all duration-500",
                                                            isCompleted ? "bg-zinc-900 text-white" :
                                                                isInProgress ? "bg-emerald-500 text-white scale-110 shadow-lg ring-4 ring-emerald-100 dark:ring-emerald-900/40" :
                                                                    "bg-white dark:bg-zinc-900 border-2 border-zinc-200 dark:border-zinc-800 text-zinc-400"
                                                        )}>
                                                            {isCompleted ? <CheckCircle2 className="w-5 h-5" /> :
                                                                isInProgress ? <PlayCircle className="w-6 h-6 animate-pulse" /> :
                                                                    <div className="text-xs font-black">{idx + 1}</div>}
                                                        </div>
                                                    </div>

                                                    {/* Content Card */}
                                                    <div className={cn(
                                                        "flex-1 p-5 rounded-2xl transition-all duration-300",
                                                        isInProgress ? "bg-white dark:bg-zinc-900 shadow-xl border-emerald-100 dark:border-emerald-900/30 border-2" :
                                                            "bg-white/50 dark:bg-zinc-900/30 border border-zinc-100 dark:border-zinc-800/10"
                                                    )}>
                                                        <div className="flex items-center justify-between mb-3">
                                                            <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">
                                                                {format(new Date(apt.startTime), "HH:mm")}
                                                            </span>
                                                            <Badge variant="outline" className={cn(
                                                                "text-[8px] px-1.5 h-4 font-black uppercase",
                                                                isInProgress && "bg-emerald-50 text-emerald-700 border-emerald-100",
                                                                isCompleted && "bg-zinc-100 text-zinc-600 border-zinc-200"
                                                            )}>
                                                                {apt.status}
                                                            </Badge>
                                                        </div>

                                                        <div className="space-y-1">
                                                            <h4 className="text-sm font-black text-zinc-800 dark:text-zinc-100 truncate">
                                                                {apt.customerName}
                                                            </h4>
                                                            <p className="text-xs text-muted-foreground font-medium">
                                                                {apt.serviceName}
                                                            </p>
                                                        </div>

                                                        <div className="mt-4 flex items-center text-[10px] text-zinc-500 gap-1.5 bg-zinc-50 dark:bg-zinc-800/50 p-2 rounded-lg">
                                                            <MapPin className="w-3 h-3 text-red-500" />
                                                            <span className="truncate flex-1">{apt.address}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}
