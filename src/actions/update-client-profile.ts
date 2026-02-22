"use server";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { geocodeAddress } from "@/lib/geocoding";

export async function updateClientProfile(formData: FormData) {
    const session = await auth();
    if (!session?.user?.id) {
        return { error: "Não autenticado." };
    }

    const user = await db.user.findUnique({
        where: { id: session.user.id },
        include: { customerProfile: true }
    });

    if (!user?.customerProfile) {
        return { error: "Perfil de cliente não encontrado." };
    }

    const name = formData.get("name") as string;
    const phone = formData.get("phone") as string;
    const address = formData.get("address") as string;
    const area = formData.get("area") as string;
    const bedrooms = formData.get("bedrooms") as string;
    const bathrooms = formData.get("bathrooms") as string;
    const footage = formData.get("footage") as string;
    const accessInfo = formData.get("accessInfo") as string;

    if (!address) {
        return { error: "Endereço é obrigatório." };
    }

    try {
        // Update name on User model
        await db.user.update({
            where: { id: session.user.id },
            data: { name }
        });

        // Geocoding if address changed or coordinates are missing
        let latitude = user.customerProfile.latitude;
        let longitude = user.customerProfile.longitude;

        if (address !== user.customerProfile.address || !latitude || !longitude) {
            const coords = await geocodeAddress(address);
            if (coords) {
                latitude = coords.lat;
                longitude = coords.lng;
            }
        }

        // Update customer profile fields
        await db.customer.update({
            where: { id: user.customerProfile.id },
            data: {
                phone,
                address,
                area,
                latitude,
                longitude,
                bedrooms: bedrooms ? parseInt(bedrooms) : null,
                bathrooms: bathrooms ? parseInt(bathrooms) : null,
                footage,
                accessInfo,
            }
        });

        revalidatePath("/app/profile");
        return { success: true };
    } catch (error) {
        console.error("Error updating client profile:", error);
        return { error: "Erro ao atualizar perfil." };
    }
}
