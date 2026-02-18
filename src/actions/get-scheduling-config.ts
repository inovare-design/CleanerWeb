"use server";

import { db } from "@/lib/db";
import { auth } from "@/auth";

export async function getSchedulingConfig() {
    const session = await auth();
    if (!session) return null;

    const tenantId = session.user.tenantId;
    if (!tenantId) return null;

    const config = await db.schedulingConfig.findUnique({
        where: { tenantId }
    });

    if (!config) {
        // Return default structure if not found
        return {
            availability: "{}",
            holidays: "[]",
            rateNormal: 50,
            rateNormal2: 75,
            rateUrgent: 100
        };
    }

    return {
        ...config,
        rateNormal: Number(config.rateNormal),
        rateNormal2: Number(config.rateNormal2),
        rateUrgent: Number(config.rateUrgent)
    };
}
