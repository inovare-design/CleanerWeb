"use server";

import { db } from "@/lib/db";
import { geocodeAddress } from "@/lib/geocoding";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";

/**
 * Iterates through all customers in the tenant and geocodes their addresses if coordinates are missing.
 */
export async function geocodeAllCustomers() {
    const session = await auth();
    if (!session?.user?.tenantId) return { error: "Não autorizado" };

    try {
        const customers = await db.customer.findMany({
            where: {
                tenantId: session.user.tenantId,
                address: { not: null },
                OR: [
                    { latitude: null },
                    { longitude: null }
                ]
            }
        });

        let updatedCount = 0;

        for (const customer of customers) {
            if (customer.address) {
                const coords = await geocodeAddress(customer.address);
                if (coords) {
                    await db.customer.update({
                        where: { id: customer.id },
                        data: {
                            latitude: coords.lat,
                            longitude: coords.lng
                        }
                    });
                    updatedCount++;
                }
                // Delay to respect Nominatim usage limits (1 req/sec)
                await new Promise(resolve => setTimeout(resolve, 1100));
            }
        }

        revalidatePath("/admin/customers");
        return { success: true, count: updatedCount };
    } catch (error) {
        console.error("Geocoding action error:", error);
        return { error: "Erro ao geocodificar clientes" };
    }
}
