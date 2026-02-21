"use server";

import { db } from "@/lib/db";
import { auth } from "@/auth";

export async function updateStaffLocation(lat: number, lng: number) {
    try {
        const session = await auth();
        if (!session?.user?.id || session.user.role !== "CLEANER") {
            return { error: "Unauthorized" };
        }

        const employee = await db.employee.findUnique({
            where: { userId: session.user.id }
        });

        if (!employee) return { error: "Employee profile not found" };

        await db.employee.update({
            where: { id: employee.id },
            data: {
                latitude: lat,
                longitude: lng,
                lastLocationUpdate: new Date(),
            }
        });

        return { success: true };
    } catch (error) {
        console.error("Error updating staff location:", error);
        return { error: "Failed to update location" };
    }
}
