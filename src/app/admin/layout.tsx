import { AdminSidebar } from "@/components/admin-sidebar";
import { auth } from "@/auth";
import { redirect } from "next/navigation";

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

    return (
        <div className="h-full relative">
            <div className="hidden h-full md:flex md:w-60 md:flex-col md:fixed md:inset-y-0 z-[80]">
                <AdminSidebar user={session.user} />
            </div>
            <main className="md:pl-60 h-full bg-slate-50 dark:bg-zinc-950">
                {children}
            </main>
        </div>
    );
}
