"use client";

import { useState } from "react";
import {
    format,
    addMonths,
    subMonths,
    startOfMonth,
    endOfMonth,
    startOfWeek,
    endOfWeek,
    addWeeks,
    subWeeks,
    addDays,
    subDays,
    isSameMonth,
    isSameDay,
    parseISO,
    addMinutes
} from "date-fns";
import { ptBR } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, List, Grid } from "lucide-react";
import { cn } from "@/lib/utils";
import { DndContext, DragEndEvent, DragOverlay, MouseSensor, TouchSensor, useSensor, useSensors } from "@dnd-kit/core";

import { MonthView } from "@/components/calendar/month-view";
import { WeekView } from "@/components/calendar/week-view";
import { DayResourceView } from "@/components/calendar/day-resource-view";
import { updateAppointmentResource, updateAppointmentTime } from "@/actions/update-appointment-time";
import { EditAppointmentModal } from "@/components/modals/edit-appointment-modal";

type ViewType = "month" | "week" | "day";

export function CalendarShell({ appointments, employees, clients, services }: { appointments: any[], employees: any[], clients: any[], services: any[] }) {
    const [date, setDate] = useState(new Date());
    const [view, setView] = useState<ViewType>("day");
    const [activeAppointment, setActiveAppointment] = useState<any>(null);
    const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>("all");
    const [filterType, setFilterType] = useState<string>("all");

    // Modal State
    const [editingAppointment, setEditingAppointment] = useState<any>(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);

    // Drag Shadow State
    const [dragShadow, setDragShadow] = useState<{ appointmentId: string, startTime: Date, employeeId?: string, dateIso?: string } | null>(null);

    const handleEdit = (appointment: any) => {
        setEditingAppointment(appointment);
        setIsEditModalOpen(true);
    };

    // Filter Logic
    const filteredAppointments = appointments.filter(a => {
        // 1. Filter by Employee
        const empMatch = selectedEmployeeId === "all" ||
            (selectedEmployeeId === "unassigned" ? !a.employeeId : a.employeeId === selectedEmployeeId);
        if (!empMatch) return false;

        // 2. Filter by Type
        if (filterType !== "all") {
            const customerFreq = a.customer?.frequency;
            if (filterType === "recurring") {
                return customerFreq === "WEEKLY" || customerFreq === "BIWEEKLY" || customerFreq === "MONTHLY";
            }
            if (filterType === "one-time") {
                return customerFreq === "ONE_TIME" || !customerFreq;
            }
        }

        return true;
    });

    const filteredEmployees = selectedEmployeeId === "all"
        ? employees
        : employees.filter(e => e.id === selectedEmployeeId);

    // Navigation Handlers
    const handlePrev = () => {
        if (view === "month") setDate(subMonths(date, 1));
        if (view === "week") setDate(subWeeks(date, 1));
        if (view === "day") setDate(subDays(date, 1));
    };

    const handleNext = () => {
        if (view === "month") setDate(addMonths(date, 1));
        if (view === "week") setDate(addWeeks(date, 1));
        if (view === "day") setDate(addDays(date, 1));
    };

    const handleToday = () => setDate(new Date());

    // DnD Sensors
    const sensors = useSensors(
        useSensor(MouseSensor, { activationConstraint: { distance: 10 } }),
        useSensor(TouchSensor, { activationConstraint: { delay: 100, tolerance: 5 } })
    );

    const handleDragStart = (event: any) => {
        setActiveAppointment(event.active.data.current.appointment);
    };

    const handleDragMove = (event: any) => {
        const { active, over, delta } = event;

        if (!active || !over) {
            if (dragShadow) setDragShadow(null);
            return;
        }

        const appointment = active.data.current?.appointment;
        if (!appointment) return;

        const PIXELS_PER_HOUR = 96; // Increased from 56 for better 10-min resolution (16px per 10 min)
        const minutesMoved = Math.round((delta.y / PIXELS_PER_HOUR) * 60);
        const snappedMinutes = Math.round(minutesMoved / 10) * 10; // 10-min snap

        const currentStart = new Date(appointment.startTime);
        const newStartTime = addMinutes(currentStart, snappedMinutes);

        if (view === "day") {
            setDragShadow({
                appointmentId: appointment.id,
                startTime: newStartTime,
                employeeId: String(over.id)
            });
        } else if (view === "week") {
            setDragShadow({
                appointmentId: appointment.id,
                startTime: newStartTime,
                dateIso: String(over.id)
            });
        }
    };

    const handleDragEnd = async (event: DragEndEvent) => {
        const { active, over, delta } = event;
        setActiveAppointment(null);
        setDragShadow(null);

        if (!active || !over) return;

        console.log("Drag End", { active, over, delta });

        const appointment = active.data.current?.appointment;
        // const employeeId = over.id as string; // Resource ID dropped onto

        if (!appointment) return;

        // Calculate Time Change
        // PIXELS_PER_HOUR is 56 (defined in views).
        const PIXELS_PER_HOUR = 56;
        const minutesMoved = Math.round((delta.y / PIXELS_PER_HOUR) * 60);
        const snappedMinutes = Math.round(minutesMoved / 10) * 10; // 10-min snap

        const currentStart = new Date(appointment.startTime);
        let newStartTime = addMinutes(currentStart, snappedMinutes);

        // Determine if we dropped on a Resource or a Day
        // In "day" view, id is employeeId (or "unassigned")
        // In "week" view, id is yyyy-MM-dd date string

        if (view === "day") {
            const originalEmployeeId = appointment.employeeId || "unassigned";
            const newEmployeeId = String(over.id);

            // If resource changed
            if (originalEmployeeId !== newEmployeeId) {
                await updateAppointmentResource(appointment.id, newEmployeeId, newStartTime);
            } else {
                if (snappedMinutes !== 0) {
                    await updateAppointmentTime(appointment.id, newStartTime);
                }
            }
        } else if (view === "week") {
            const originalDateIso = format(currentStart, "yyyy-MM-dd");
            const newDateIso = String(over.id);

            // If date changed
            if (originalDateIso !== newDateIso) {
                // Calculate difference in days to shift the date part of newStartTime
                // Actually, simpler: Set the Date part of newStartTime to newDateIso
                const newDate = parseISO(newDateIso);

                // newStartTime currently has the *Time Shift* applied to the *Old Date*
                // We want to apply the *Time Shift* to the *New Date*

                // Extract time from newStartTime (which has the shift)
                const hours = newStartTime.getHours();
                const minutes = newStartTime.getMinutes();

                // Set this time on the New Date
                const finalDate = new Date(newDate);
                finalDate.setHours(hours, minutes, 0, 0);

                await updateAppointmentTime(appointment.id, finalDate);

            } else {
                // Same day, just time shift
                if (snappedMinutes !== 0) {
                    await updateAppointmentTime(appointment.id, newStartTime);
                }
            }
        } else {
            // Month view or others - handle similarly if needed, or ignore time shift logic if simplistic
            if (snappedMinutes !== 0) {
                await updateAppointmentTime(appointment.id, newStartTime);
            }
        }
    };

    return (
        <DndContext
            sensors={sensors}
            onDragStart={handleDragStart}
            onDragMove={handleDragMove}
            onDragEnd={handleDragEnd}
        >
            <div className="flex flex-col h-full space-y-4">
                {/* Header */}
                <div className="flex flex-col sm:flex-row items-center justify-between space-y-2 sm:space-y-0 pb-4 border-b">
                    <div className="flex items-center space-x-4">
                        <h2 className="text-2xl font-bold capitalize text-gray-900 dark:text-gray-100 min-w-[200px]">
                            {format(date, view === 'day' ? "dd 'de' MMMM" : "MMMM yyyy", { locale: ptBR })}
                        </h2>
                        <div className="flex items-center space-x-1 border rounded-md p-0.5 bg-muted/50">
                            <Button variant="ghost" size="icon" onClick={handlePrev} className="h-8 w-8">
                                <ChevronLeft className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={handleToday} className="h-8 px-2 text-xs font-medium">
                                Hoje
                            </Button>
                            <Button variant="ghost" size="icon" onClick={handleNext} className="h-8 w-8">
                                <ChevronRight className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>

                    <div className="flex items-center space-x-4 max-w-full sm:max-w-[60%]">
                        {/* Employee Chips */}
                        <div className="flex items-center space-x-1 overflow-x-auto scrollbar-hide py-1">
                            <Button
                                variant={selectedEmployeeId === "all" ? "default" : "outline"}
                                size="sm"
                                onClick={() => setSelectedEmployeeId("all")}
                                className="h-7 px-2.5 text-[11px] rounded-full whitespace-nowrap"
                            >
                                Todos
                            </Button>
                            <Button
                                variant={selectedEmployeeId === "unassigned" ? "default" : "outline"}
                                size="sm"
                                onClick={() => setSelectedEmployeeId("unassigned")}
                                className={cn(
                                    "h-7 px-2.5 text-[11px] rounded-full whitespace-nowrap",
                                    selectedEmployeeId === "unassigned" && "bg-yellow-500 hover:bg-yellow-600 text-white border-none"
                                )}
                            >
                                Sem Equipe
                            </Button>
                            {employees.map(emp => {
                                const isActive = selectedEmployeeId === emp.id;
                                return (
                                    <Button
                                        key={emp.id}
                                        variant={isActive ? "default" : "outline"}
                                        size="sm"
                                        onClick={() => setSelectedEmployeeId(emp.id)}
                                        className={cn(
                                            "h-7 px-2.5 text-[11px] rounded-full whitespace-nowrap transition-all",
                                            isActive && "border-none text-white"
                                        )}
                                        style={isActive ? { backgroundColor: emp.color || "#8b5cf6" } : {}}
                                    >
                                        <div
                                            className="w-2 h-2 rounded-full mr-1.5 shrink-0"
                                            style={{ backgroundColor: emp.color || "#8b5cf6" }}
                                        />
                                        {(emp.name || "N/A").split(' ')[0]}
                                    </Button>
                                );
                            })}
                        </div>

                        {/* Type Filter */}
                        <div className="w-[140px] shrink-0">
                            <Select value={filterType} onValueChange={setFilterType}>
                                <SelectTrigger className="h-7 text-[11px]">
                                    <SelectValue placeholder="Tipo" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Todos Tipos</SelectItem>
                                    <SelectItem value="recurring">Recorrentes</SelectItem>
                                    <SelectItem value="one-time">Avulsos</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="flex items-center border rounded-md p-0.5 bg-muted/50 shrink-0">
                            {(['month', 'week', 'day'] as const).map((v) => (
                                <Button
                                    key={v}
                                    variant={view === v ? "secondary" : "ghost"}
                                    size="sm"
                                    onClick={() => setView(v)}
                                    className={cn(
                                        "h-7 px-3 text-[11px] font-medium transition-all capitalize",
                                        view === v && "bg-white dark:bg-gray-800 shadow-sm"
                                    )}
                                >
                                    {v === 'month' ? 'Mês' : v === 'week' ? 'Semana' : 'Dia'}
                                </Button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Content Area */}
                <div className="flex-1 overflow-auto bg-white dark:bg-gray-950 rounded-lg border shadow-sm items-start relative">
                    {view === "month" && <MonthView date={date} appointments={filteredAppointments} onEdit={handleEdit} />}
                    {view === "week" && <WeekView date={date} appointments={filteredAppointments} onEdit={handleEdit} dragShadow={dragShadow} />}
                    {view === "day" && <DayResourceView date={date} appointments={filteredAppointments} employees={filteredEmployees} onEdit={handleEdit} dragShadow={dragShadow} />}
                </div>

                {editingAppointment && (
                    <EditAppointmentModal
                        open={isEditModalOpen}
                        onOpenChange={setIsEditModalOpen}
                        appointment={editingAppointment}
                        clients={clients}
                        services={services}
                        employees={employees}
                    />
                )}
            </div>
        </DndContext>
    );
}
