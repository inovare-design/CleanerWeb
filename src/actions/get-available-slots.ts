"use server";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { addMinutes, format, isSameDay, parse, setHours, setMinutes, startOfDay } from "date-fns";

type AvailabilitySlot = {
    time: string; // "09:00"
    available: boolean;
};

export async function getAvailableSlots(dateStr: string, serviceDurationMin: number) {
    if (!dateStr) return { error: "Data não fornecida" };

    try {
        const session = await auth();
        const tenantId = session?.user?.tenantId;
        if (!tenantId) return { error: "Tenant não encontrado na sessão" };

        const config = await db.schedulingConfig.findUnique({
            where: { tenantId: tenantId }
        });

        // 1. Check Holidays
        if (config?.holidays) {
            const holidays = JSON.parse(config.holidays) as string[];
            if (holidays.includes(dateStr)) {
                return { slots: [], reason: "Feriado/Folga" };
            }
        }

        const date = parse(dateStr, "yyyy-MM-dd", new Date());
        const dayOfWeek = date.getDay(); // 0 = Domingo, 1 = Segunda...

        // 2. Get Configured Ranges for this Day
        let ranges: { start: string; end: string }[] = [];
        if (config?.availability) {
            const availability = JSON.parse(config.availability);
            // Assuming structure: { "1": [{start: "08:00", end: "12:00"}, {start: "13:00", end: "18:00"}] }
            // Note: Keys might be strings "0".."6"
            ranges = availability[String(dayOfWeek)] || [];
        }

        if (ranges.length === 0) {
            return { slots: [], reason: "Dia fechado" };
        }

        // 3. Fetch Existing Appointments for this Date
        // We need to check overlap.
        const startOfDayDate = startOfDay(date);
        const nextDayDate = addMinutes(startOfDayDate, 24 * 60);

        const appointments = await db.appointment.findMany({
            where: {
                tenantId: tenantId,
                startTime: {
                    gte: startOfDayDate,
                    lt: nextDayDate
                },
                status: {
                    not: "CANCELLED"
                }
            }
        });

        // 4. Generate Slots
        const slots: AvailabilitySlot[] = [];
        const step = 30; // 30 min granularity

        for (const range of ranges) {
            const [startHour, startMin] = range.start.split(":").map(Number);
            const [endHour, endMin] = range.end.split(":").map(Number);

            let current = setMinutes(setHours(date, startHour), startMin);
            const end = setMinutes(setHours(date, endHour), endMin);

            while (addMinutes(current, serviceDurationMin) <= end) {
                const slotStart = current;
                const slotEnd = addMinutes(current, serviceDurationMin);

                // Check collision
                const isBusy = appointments.some((apt: { startTime: Date; endTime: Date }) => {
                    // Overlap logic: (StartA < EndB) and (EndA > StartB)
                    return (slotStart < apt.endTime && slotEnd > apt.startTime);
                });

                slots.push({
                    time: format(slotStart, "HH:mm"),
                    available: !isBusy
                });

                current = addMinutes(current, step);
            }
        }

        return { slots };

    } catch (error) {
        console.error("Erro ao calcular slots:", error);
        return { error: "Erro ao calcular horários." };
    }
}
