import { useRef, useEffect } from "react";
import {
    format,
    startOfDay,
    endOfDay,
    isSameDay,
    differenceInMinutes,
    addMinutes
} from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { User, HelpCircle } from "lucide-react";
import { useDroppable } from "@dnd-kit/core";
import { DraggableAppointment } from "./draggable-appointment";

type DayResourceViewProps = {
    date: Date;
    appointments: any[];
    employees: any[];
    onEdit?: (appointment: any) => void;
    dragShadow?: any;
};

function ResourceColumn({ employee, appointments, slots, onEdit, dragShadow }: any) {
    const { setNodeRef, isOver } = useDroppable({
        id: employee.id, // The droppable ID is the resource ID (employeeId or "unassigned")
        data: { employee }
    });

    return (
        <div
            ref={setNodeRef}
            className={cn(
                "flex-1 border-r last:border-r-0 relative min-w-[150px] transition-colors",
                isOver && "bg-blue-50/50 dark:bg-blue-900/10"
            )}
        >
            {slots.map((slot: number, index: number) => {
                const isHour = Number.isInteger(slot);
                const isHalfHour = Math.abs((slot % 1) - 0.5) < 0.01;
                return (
                    <div
                        key={index}
                        className={cn(
                            "h-4 border-b border-gray-100 dark:border-gray-800",
                            isHour ? "border-solid border-gray-200 dark:border-gray-700" :
                                isHalfHour ? "border-dashed opacity-60" : "border-dotted opacity-30"
                        )}
                    />
                );
            })}

            {/* Appointments */}
            {appointments.map((apt: any) => {
                const start = new Date(apt.startTime);
                const end = new Date(apt.endTime);

                // Calculate Position
                const startHour = start.getHours();
                const startMin = start.getMinutes();

                const PIXELS_PER_HOUR = 96;

                const topOffset = (startHour * PIXELS_PER_HOUR) + ((startMin / 60) * PIXELS_PER_HOUR);
                const durationMin = differenceInMinutes(end, start);
                const height = (durationMin / 60) * PIXELS_PER_HOUR;

                if (topOffset < 0) return null;

                const empColor = apt.employee?.color || "#8b5cf6"; // Default violet if none
                const isUnassigned = !apt.employeeId || apt.employeeId === "unassigned";

                return (
                    <DraggableAppointment
                        key={apt.id}
                        appointment={apt}
                        className={cn(
                            "absolute left-1 right-1 rounded px-2 py-1 text-xs border-l-4 overflow-hidden hover:z-50 transition-all hover:scale-[1.02] shadow-sm cursor-grab active:cursor-grabbing",
                            isUnassigned && "bg-yellow-100 border-yellow-500 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-100"
                        )}
                        style={{
                            top: `${topOffset}px`,
                            height: `${height}px`,
                            position: 'absolute',
                            backgroundColor: !isUnassigned ? `${empColor}15` : undefined, // 15 is hex for ~8% opacity
                            borderColor: !isUnassigned ? empColor : undefined,
                            color: !isUnassigned ? empColor : undefined,
                        }}
                    >
                        <div
                            className="h-full w-full overflow-hidden leading-snug relative group"
                        >
                            <div
                                className="cursor-pointer"
                                onDoubleClick={(e) => {
                                    e.stopPropagation();
                                    onEdit && onEdit(apt);
                                }}
                            >
                                <div className="flex items-center gap-1.5 overflow-hidden pr-4">
                                    <span className="font-bold shrink-0">{format(start, "HH:mm")}</span>
                                    <span className="truncate font-medium">{apt.customer.user.name}</span>
                                </div>
                                <div className="truncate opacity-70 text-[10px] mt-0.5 leading-none">
                                    {apt.service.name}
                                </div>
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
                    </DraggableAppointment>
                );
            })}

            {/* Drag Shadow / Preview */}
            {dragShadow && dragShadow.employeeId === employee.id && (
                (() => {
                    // In DayResourceView, appointments are filtered by day.
                    // The appointment being dragged is likely in one of the columns.
                    // Since dragShadow is global, we might need to find the appointment metadata.
                    // For now, let's assume we can at least show the time.
                    const start = dragShadow.startTime;

                    const startHour = start.getHours();
                    const startMin = start.getMinutes();
                    const PIXELS_PER_HOUR = 96;
                    const topOffset = (startHour * PIXELS_PER_HOUR) + ((startMin / 60) * PIXELS_PER_HOUR);

                    // We need the duration. Ideally we'd have the whole appointment object in dragShadow.
                    // For simplicity, let's try to find it in the current column's appointments first.
                    const apt = appointments.find(a => a.id === dragShadow.appointmentId);
                    const durationInMin = apt ? differenceInMinutes(new Date(apt.endTime), new Date(apt.startTime)) : 60;
                    const height = (durationInMin / 60) * PIXELS_PER_HOUR;

                    if (topOffset < 0) return null;

                    return (
                        <div
                            className="absolute left-1.5 right-1.5 rounded border-2 border-dashed border-blue-500 bg-blue-500/10 pointer-events-none z-[100] flex flex-col px-2 py-1 overflow-hidden backdrop-blur-[1px] animate-pulse"
                            style={{ top: `${topOffset}px`, height: `${height}px` }}
                        >
                            <div className="flex items-center justify-between">
                                <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400">{format(start, "HH:mm")}</span>
                                <span className="text-[8px] font-black uppercase text-blue-500/50">Preview</span>
                            </div>
                            {apt && <div className="text-[10px] font-semibold text-blue-700 dark:text-blue-300 truncate">{apt.customer.user.name}</div>}
                        </div>
                    );
                })()
            )}
        </div>
    );
}

export function DayResourceView({ date, appointments, employees, onEdit, dragShadow }: DayResourceViewProps) {
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (scrollRef.current) {
            const currentHour = new Date().getHours();
            const scrollHour = currentHour > 2 ? currentHour - 1 : currentHour;
            const PIXELS_PER_HOUR = 96;
            scrollRef.current.scrollTop = scrollHour * PIXELS_PER_HOUR;
        }
    }, []);

    const slots: number[] = [];
    for (let i = 0; i < 24; i++) {
        for (let j = 0; j < 6; j++) {
            slots.push(i + j / 6); // 10-min intervals
        }
    }

    // Filter for day
    const daysAppointments = appointments.filter(apt =>
        isSameDay(new Date(apt.startTime), date)
    );

    console.log("DayResourceView", { date, totalArgs: appointments.length, filtered: daysAppointments.length, daysAppointments });

    const resources = [
        ...employees,
        { id: "unassigned", name: "Não Atribuído", isUnassigned: true }
    ];

    return (
        <div className="flex flex-col h-full bg-white dark:bg-gray-950 overflow-hidden">
            {/* Header: Employees */}
            <div className="flex border-b pl-14 overflow-x-auto scrollbar-hide">
                {resources.map((emp, i) => (
                    <div
                        key={emp.id}
                        className={cn(
                            "flex-1 text-center py-3 border-r last:border-r-0 min-w-[150px] flex flex-col items-center justify-center bg-gray-50/50 dark:bg-gray-900/50",
                            emp.isUnassigned && "bg-yellow-50/50 dark:bg-yellow-900/10"
                        )}
                    >
                        <div className="flex items-center space-x-2">
                            {emp.isUnassigned ? (
                                <div className="w-8 h-8 rounded-full bg-yellow-100 flex items-center justify-center text-yellow-600">
                                    <HelpCircle className="w-4 h-4" />
                                </div>
                            ) : (
                                <div className="w-8 h-8 rounded-full bg-violet-100 flex items-center justify-center text-violet-600">
                                    <User className="w-4 h-4" />
                                </div>
                            )}
                            <span className="font-semibold text-sm truncate max-w-[120px]">{emp.name}</span>
                        </div>
                    </div>
                ))}
            </div>

            {/* Body: Time Grid */}
            <div
                ref={scrollRef}
                className="flex-1 overflow-y-auto flex relative"
            >
                {/* Time Labels */}
                <div className="w-14 flex-none border-r bg-gray-50/50 dark:bg-gray-900/50 sticky left-0 z-10 bg-white dark:bg-gray-950">
                    {slots.map((slot, index) => {
                        const isHour = Number.isInteger(slot);
                        const isHalfHour = Math.abs((slot % 1) - 0.5) < 0.01;
                        return (
                            <div key={index} className="h-4 border-b text-[9px] text-muted-foreground text-right pr-2 relative flex items-center justify-end">
                                {isHour && <span className="absolute -top-1.5 right-2 text-[10px] font-bold text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-950 px-0.5">{Math.floor(slot)}:00</span>}
                                {isHalfHour && <span className="opacity-40">30</span>}
                            </div>
                        );
                    })}
                </div>

                {/* Grid Columns (Resources) */}
                <div className="flex flex-1 min-w-[600px]">
                    {resources.map((emp) => {
                        const employeeAppointments = daysAppointments.filter(apt => {
                            if (emp.isUnassigned) return !apt.employeeId;
                            return apt.employeeId === emp.id;
                        });

                        return (
                            <ResourceColumn
                                key={emp.id}
                                employee={emp}
                                appointments={employeeAppointments}
                                slots={slots}
                                onEdit={onEdit}
                                dragShadow={dragShadow}
                            />
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
