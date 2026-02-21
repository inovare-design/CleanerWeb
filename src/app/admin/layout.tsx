import { AdminSidebar } from "@/components/admin-sidebar";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";

export default async function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const session = await auth();

    // Segurança adicional (além do middleware)
    if (!session) {
        redirect("/login");
    }

    if (session.user.role !== "ADMIN" && session.user.role !== "SUPER_ADMIN") {
        redirect("/");
    }

    const tenant = await db.tenant.findUnique({
        where: { id: session.user.tenantId! },
        select: {
            name: true,
            logoUrl: true,
            description: true
        }
    });

    return (
        <div className="h-full relative">
            <div className="hidden h-full md:flex md:w-60 md:flex-col md:fixed md:inset-y-0 z-[80]">
                <AdminSidebar user={session.user} tenant={tenant} />
            </div>
            <main className="md:pl-60 h-full bg-slate-50 dark:bg-zinc-950">
                {children}
            </main>
        </div>
    );
}
