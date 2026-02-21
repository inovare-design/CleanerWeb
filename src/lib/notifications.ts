import { db } from "./db";

export type NotificationType = "DAY_BEFORE" | "EN_ROUTE" | "STARTED" | "FINISHED";

export async function sendAppointmentNotification(
    appointmentId: string,
    type: NotificationType
) {
    try {
        const appointment = await db.appointment.findUnique({
            where: { id: appointmentId },
            include: {
                customer: { include: { user: true } },
                employee: { include: { user: true } },
                tenant: { include: { schedulingConfig: true } },
                service: true,
            },
        });

        if (!appointment) return { error: "Appointment not found" };

        const config = appointment.tenant.schedulingConfig;
        if (!config) return { error: "Scheduling config not found" };

        // Check global toggles
        const shouldNotify =
            (type === "DAY_BEFORE" && config.notifyDayBefore) ||
            (type === "EN_ROUTE" && config.notifyOnTheWay) ||
            (type === "STARTED" && config.notifyServiceStarted) ||
            (type === "FINISHED" && config.notifyServiceFinished);

        if (!shouldNotify) {
            console.log(`[Notification] Skip ${type} for appointment ${appointmentId} (config disabled)`);
            return { success: false, reason: "Disabled in config" };
        }

        // Prevent duplicate notifications of the same type
        const existingLog = await db.notificationLog.findFirst({
            where: { appointmentId, type, status: "SENT" }
        });

        if (existingLog && type !== "EN_ROUTE") { // EN_ROUTE might be sent multiple times if needed, but usually once is enough per trip
            console.log(`[Notification] Duplicate ${type} blocked for appointment ${appointmentId}`);
            return { success: false, reason: "Already sent" };
        }

        const customerEmail = appointment.customer.user.email;
        const customerName = appointment.customer.user.name;
        const staffName = appointment.employee?.user?.name || "Nosso profissional";

        console.log(`[Notification] Sending ${type} to ${customerEmail}`);

        // --- REAL EMAIL SENDING LOGIC WOULD GO HERE ---
        // For now, we simulate success and log it.
        // ---

        await db.notificationLog.create({
            data: {
                appointmentId,
                type,
                recipient: customerEmail,
                status: "SENT",
            }
        });

        return { success: true };
    } catch (error) {
        console.error(`[Notification] Error sending ${type}:`, error);
        return { error: "Failed to send notification" };
    }
}
