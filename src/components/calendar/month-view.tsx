"use client";

import {
    format,
    startOfMonth,
    endOfMonth,
    startOfWeek,
    endOfWeek,
    eachDayOfInterval,
    isSameMonth,
    isSameDay,
    isToday
} from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";

type MonthViewProps = {
    date: Date;
    appointments: any[];
    onEdit?: (appointment: any) => void;
};

export function MonthView({ date, appointments, onEdit }: MonthViewProps) {
    const monthStart = startOfMonth(date);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);

    const dateFormat = "d";
    const rows = [];
    let days = [];
    let day = startDate;
    let formattedDate = "";

    const weekDays = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

    // Header dos dias da semana
    const header = weekDays.map((d, i) => (
        <div key={i} className="text-center font-semibold text-xs py-2 uppercase tracking-wide text-muted-foreground border-b">
            {d}
        </div>
    ));

    const dayCells = eachDayOfInterval({ start: startDate, end: endDate });

    return (
        <div className="flex flex-col h-full bg-white dark:bg-gray-950">
            <div className="grid grid-cols-7 border-b">
                {header}
            </div>
            <div className="flex-1 grid grid-cols-7 grid-rows-5 auto-rows-fr">
                {dayCells.map((dayItem, idx) => {
                    // Filter appointments for this day
                    const daysAppointments = appointments.filter(apt =>
                        isSameDay(new Date(apt.startTime), dayItem)
                    );

                    return (
                        <div
                            key={dayItem.toString()}
                            className={cn(
                                "min-h-[100px] border-r border-b p-1 flex flex-col transition-colors hover:bg-muted/20",
                                !isSameMonth(dayItem, monthStart) && "bg-gray-50/50 dark:bg-gray-900/50 text-muted-foreground",
                                isToday(dayItem) && "bg-blue-50/30 dark:bg-blue-900/10"
                            )}
                        >
                            <div className="flex justify-between items-start">
                                <span className={cn(
                                    "text-sm font-medium w-6 h-6 flex items-center justify-center rounded-full mr-1",
                                    isToday(dayItem) && "bg-violet-600 text-white"
                                )}>
                                    {format(dayItem, dateFormat)}
                                </span>
                            </div>

                            <div className="flex-1 space-y-1 mt-1 overflow-y-auto max-h-[120px]">
                                {daysAppointments.map(apt => {
                                    const empColor = apt.employee?.color || "#8b5cf6";
                                    const isUnassigned = !apt.employeeId || apt.employeeId === "unassigned";

                                    return (
                                        <div
                                            key={apt.id}
                                            className={cn(
                                                "text-xs p-1 rounded truncate transition-all hover:opacity-80 border-l-2 shadow-sm relative group",
                                                isUnassigned
                                                    ? "bg-yellow-100 text-yellow-800 border-yellow-500 dark:bg-yellow-900/30 dark:text-yellow-200"
                                                    : ""
                                            )}
                                            style={!isUnassigned ? {
                                                backgroundColor: `${empColor}15`,
                                                borderColor: empColor,
                                                color: empColor,
                                            } : {}}
                                            title={`${apt.customer.user.name} - ${apt.service.name}`}
                                        >
                                            <div
                                                className="flex-1 truncate cursor-pointer pr-4"
                                                onClick={() => onEdit && onEdit(apt)}
                                            >
                                                <span className="font-bold mr-1">{format(new Date(apt.startTime), "HH:mm")}</span>
                                                {apt.customer.user.name}
                                            </div>

                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    onEdit && onEdit(apt);
                                                }}
                                                className="absolute right-0.5 top-0.5 opacity-0 group-hover:opacity-100 transition-opacity p-0.5 rounded hover:bg-black/10 dark:hover:bg-white/10"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-pencil"><path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z" /><path d="m15 5 4 4" /></svg>
                                            </button>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
