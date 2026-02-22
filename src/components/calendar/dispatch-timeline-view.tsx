"use client";

import { useDroppable } from "@dnd-kit/core";
import { format, differenceInMinutes, startOfDay, addMinutes, isSameDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { DraggableAppointment } from "./draggable-appointment";
import { User, HelpCircle, Clock, MapPin } from "lucide-react";

interface DispatchTimelineViewProps {
    date: Date;
    appointments: any[];
    employees: any[];
    onEdit: (appointment: any) => void;
    dragShadow?: any;
}

const HOURS = Array.from({ length: 12 }, (_, i) => i + 8); // 08:00 to 20:00
const PIXELS_PER_MINUTE = 1.5; // 90px per hour
const COLUMN_WIDTH = 60 * PIXELS_PER_MINUTE;

function TimelineRow({ employee, appointments, date, onEdit, dragShadow }: any) {
    const { setNodeRef, isOver } = useDroppable({
        id: employee.id,
        data: { employee }
    });

    const isUnassigned = employee.id === "unassigned";

    return (
        <div className="flex border-b group/row min-w-max">
            {/* Employee Info Column */}
            <div className="w-64 sticky left-0 z-20 bg-white dark:bg-zinc-950 border-r p-4 flex items-center gap-3 shrink-0 group-hover/row:bg-zinc-50 dark:group-hover/row:bg-zinc-900/50 transition-colors">
                <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold shadow-sm"
                    style={{ backgroundColor: employee.color || (isUnassigned ? "#eab308" : "#8b5cf6") }}
                >
                    {isUnassigned ? <HelpCircle className="w-5 h-5" /> : employee.name.substring(0, 2).toUpperCase()}
                </div>
                <div className="flex flex-col min-w-0">
                    <span className="font-bold text-sm truncate">{employee.name}</span>
                    <span className="text-[10px] uppercase tracking-widest text-zinc-400 font-bold">
                        {isUnassigned ? "Aguardando" : "Disponível"}
                    </span>
                </div>
            </div>

            {/* Timeline Column */}
            <div
                ref={setNodeRef}
                className={cn(
                    "relative flex-1 h-24 transition-colors",
                    isOver && "bg-blue-500/5 dark:bg-blue-500/10"
                )}
                style={{ width: `${HOURS.length * COLUMN_WIDTH}px` }}
            >
                {/* Hourly Grid Lines */}
                {HOURS.map((hour) => (
                    <div
                        key={hour}
                        className="absolute top-0 bottom-0 border-r border-zinc-100 dark:border-zinc-800/50"
                        style={{ left: `${(hour - 8) * COLUMN_WIDTH}px`, width: `${COLUMN_WIDTH}px` }}
                    >
                        <div className="absolute inset-0 border-r border-zinc-50 dark:border-zinc-800/20 border-dashed left-1/2" />
                    </div>
                ))}

                {/* Appointments */}
                {appointments.map((apt: any) => {
                    const start = new Date(apt.startTime);
                    const end = new Date(apt.endTime);

                    const startDiff = differenceInMinutes(start, addMinutes(startOfDay(date), 8 * 60));
                    const duration = differenceInMinutes(end, start);

                    const left = startDiff * PIXELS_PER_MINUTE;
                    const width = duration * PIXELS_PER_MINUTE;

                    const empColor = employee.color || "#8b5cf6";

                    return (
                        <DraggableAppointment
                            key={apt.id}
                            appointment={apt}
                            className={cn(
                                "absolute top-4 bottom-4 rounded-xl border-t-4 p-3 shadow-lg cursor-grab active:cursor-grabbing hover:scale-[1.02] transition-transform z-10",
                                isUnassigned ? "bg-amber-50 border-amber-500 text-amber-900" : "bg-white dark:bg-zinc-900"
                            )}
                            style={{
                                left: `${left}px`,
                                width: `${width}px`,
                                borderTopColor: isUnassigned ? undefined : empColor,
                            }}
                        >
                            <div className="h-full flex flex-col justify-between overflow-hidden" onDoubleClick={() => onEdit(apt)}>
                                <div className="flex items-start justify-between gap-2">
                                    <div className="flex flex-col min-w-0">
                                        <span className="font-black text-xs truncate leading-none mb-1">
                                            {apt.customer.user.name}
                                        </span>
                                        <div className="flex items-center gap-1 text-[9px] font-bold text-zinc-400 uppercase tracking-tighter">
                                            <Clock className="w-2.5 h-2.5" />
                                            {format(start, "HH:mm")} - {format(end, "HH:mm")}
                                        </div>
                                    </div>
                                    <Badge variant="outline" className="text-[8px] px-1 h-3.5 border-none bg-zinc-100 dark:bg-zinc-800 shrink-0">
                                        {apt.status}
                                    </Badge>
                                </div>

                                <div className="flex items-center gap-1 text-[10px] text-zinc-500 font-medium truncate">
                                    <MapPin className="w-2.5 h-2.5 shrink-0 text-red-400" />
                                    <span className="truncate">{apt.address}</span>
                                </div>
                            </div>
                        </DraggableAppointment>
                    );
                })}

                {/* Drag Shadow */}
                {dragShadow && dragShadow.employeeId === employee.id && (
                    <div
                        className="absolute top-4 bottom-4 border-2 border-dashed border-blue-500 bg-blue-500/10 rounded-xl z-50 pointer-events-none animate-pulse"
                        style={{
                            left: `${differenceInMinutes(dragShadow.startTime, addMinutes(startOfDay(date), 8 * 60)) * PIXELS_PER_MINUTE}px`,
                            width: `${appointments.find((a: any) => a.id === dragShadow.appointmentId)?.customDuration || 60}px` // Default 60 if not found
                        }}
                    />
                )}
            </div>
        </div>
    );
}

function Badge({ children, className, variant }: any) {
    return (
        <span className={cn(
            "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset",
            className
        )}>
            {children}
        </span>
    );
}

export function DispatchTimelineView({ date, appointments, employees, onEdit, dragShadow }: DispatchTimelineViewProps) {
    const resources = [
        { id: "unassigned", name: "Não Atribuído", color: "#eab308" },
        ...employees
    ];

    const todayAppointments = appointments.filter((a: any) => isSameDay(new Date(a.startTime), date));

    return (
        <div className="flex flex-col h-full bg-white dark:bg-zinc-950 overflow-hidden">
            {/* Timeline Header (Time Scale) */}
            <div className="flex border-b sticky top-0 z-30 bg-zinc-50 dark:bg-zinc-900/50 min-w-max">
                <div className="w-64 border-r p-4 flex items-center justify-center font-black uppercase tracking-widest text-xs text-zinc-400">
                    Equipe
                </div>
                <div className="flex flex-1" style={{ width: `${HOURS.length * COLUMN_WIDTH}px` }}>
                    {HOURS.map((hour) => (
                        <div
                            key={hour}
                            className="flex-none text-center py-3 border-r border-zinc-100 dark:border-zinc-800/30 relative"
                            style={{ width: `${COLUMN_WIDTH}px` }}
                        >
                            <span className="text-[10px] font-black text-zinc-900 dark:text-zinc-100 tabular-nums">
                                {hour.toString().padStart(2, '0')}:00
                            </span>
                            <div className="absolute bottom-0 left-0 right-0 h-1 bg-zinc-200 dark:bg-zinc-800" />
                        </div>
                    ))}
                </div>
            </div>

            {/* Timeline Body */}
            <div className="flex-1 overflow-auto custom-scrollbar">
                <div className="min-w-max">
                    {resources.map(emp => (
                        <TimelineRow
                            key={emp.id}
                            employee={emp}
                            date={date}
                            appointments={todayAppointments.filter(a => {
                                if (emp.id === "unassigned") return !a.employeeId;
                                return a.employeeId === emp.id;
                            })}
                            onEdit={onEdit}
                            dragShadow={dragShadow}
                        />
                    ))}
                </div>
            </div>

            {/* Footer / Summary */}
            <div className="p-4 border-t bg-zinc-50 dark:bg-zinc-900/50 flex items-center justify-between">
                <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-emerald-500 shadow-sm shadow-emerald-500/20" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Em Rota</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-blue-500 shadow-sm shadow-blue-500/20" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Agendado</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-amber-500 shadow-sm shadow-amber-500/20" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Pendente</span>
                    </div>
                </div>
                <div className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">
                    {todayAppointments.length} Operações Totais
                </div>
            </div>
        </div>
    );
}
