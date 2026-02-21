import { auth } from "@/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import { ProfileForm } from "@/components/client/profile-form";

export default async function ClientProfilePage() {
    const session = await auth();
    if (!session?.user?.id) redirect("/login");

    const user = await db.user.findUnique({
        where: { id: session.user.id },
        include: { customerProfile: true }
    });

    if (!user?.customerProfile) redirect("/app");

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-black tracking-tight text-zinc-900">Meu Perfil</h1>
                <p className="text-sm text-muted-foreground mt-1">Gerencie seus dados pessoais e do imóvel.</p>
            </div>

            <ProfileForm
                user={{ name: user.name || "", email: user.email || "" }}
                customer={{
                    phone: user.customerProfile.phone,
                    address: user.customerProfile.address,
                    bedrooms: user.customerProfile.bedrooms,
                    bathrooms: user.customerProfile.bathrooms,
                    footage: user.customerProfile.footage,
                    accessInfo: user.customerProfile.accessInfo,
                }}
            />
        </div>
    );
}
