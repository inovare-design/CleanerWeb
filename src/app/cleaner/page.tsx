import { auth } from "@/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import { CleanerDashboardClient } from "@/components/cleaner/dashboard-client";
import { startOfDay, endOfDay } from "date-fns";

export default async function CleanerDashboardPage() {
    const session = await auth();

    if (!session?.user || session.user.role !== "CLEANER") {
        redirect("/login");
    }

    const employee = await db.employee.findUnique({
        where: { userId: session.user.id },
        include: {
            user: true,
            appointments: {
                where: {
                    startTime: {
                        gte: startOfDay(new Date()),
                        lte: endOfDay(new Date()),
                    },
                    status: { notIn: ["CANCELLED"] }
                },
                include: {
                    service: true,
                    customer: { include: { user: true } }
                },
                orderBy: { startTime: "asc" }
            }
        }
    });

    if (!employee) {
        return (
            <div className="p-8 text-center">
                <h1 className="text-2xl font-bold text-red-600">Perfil não encontrado.</h1>
                <p>Entre em contato com o administrador.</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-zinc-50 pb-20">
            <header className="bg-white border-b p-4 sticky top-0 z-10 shadow-sm">
                <div className="max-w-md mx-auto flex items-center justify-between">
                    <div>
                        <h1 className="text-xl font-bold text-zinc-900 leading-none">Minha Rota</h1>
                        <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest mt-1">
                            {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-[10px] font-bold uppercase">Online</span>
                    </div>
                </div>
            </header>

            <main className="max-w-md mx-auto p-4 space-y-6">
                <CleanerDashboardClient
                    appointments={JSON.parse(JSON.stringify(employee.appointments))}
                />
            </main>
        </div>
    );
}
