"use server";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function updateTenantSettings(formData: FormData) {
    const session = await auth();

    if (!session?.user || session.user.role !== "SUPER_ADMIN") {
        throw new Error("Unauthorized: Only SUPER_ADMIN can update these settings.");
    }

    const tenantId = session.user.tenantId;
    if (!tenantId) throw new Error("Tenant context not found.");

    const name = formData.get("name") as string;
    const email = formData.get("email") as string;
    const phone = formData.get("phone") as string;
    const address = formData.get("address") as string;
    const taxId = formData.get("taxId") as string;
    const bankName = formData.get("bankName") as string;
    const bankAgency = formData.get("bankAgency") as string;
    const bankAccount = formData.get("bankAccount") as string;
    const idealId = formData.get("idealId") as string;

    try {
        await db.tenant.update({
            where: { id: tenantId },
            data: {
                name,
                email,
                phone,
                address,
                taxId,
                bankName,
                bankAgency,
                bankAccount,
                idealId
            }
        });

        revalidatePath("/admin/settings");
        return { success: true };
    } catch (error) {
        console.error("Failed to update tenant settings:", error);
        return { success: false, error: "Failed to update tenant settings." };
    }
}
