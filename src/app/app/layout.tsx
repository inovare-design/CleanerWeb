import { ClientNav } from "@/components/client-nav";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";

export default async function ClientLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const session = await auth();

    if (!session) {
        redirect("/login");
    }

    if (session.user.role !== "CLIENT" && session.user.role !== "ADMIN" && session.user.role !== "SUPER_ADMIN") {
        redirect("/");
    }

    const tenant = session.user.tenantId ? await db.tenant.findUnique({
        where: { id: session.user.tenantId },
        select: { name: true, logoUrl: true, description: true }
    }) : null;

    return (
        <div className="min-h-screen bg-gray-50/50 flex flex-col">
            <ClientNav tenant={tenant} />
            <main className="flex-1 container max-w-4xl mx-auto px-4 py-6 md:py-8 mb-20 md:mb-0">
                {children}
            </main>
        </div>
    );
}
