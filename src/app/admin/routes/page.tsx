import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { getLiveRoutes } from "@/actions/get-live-routes";
import { RouteMonitor } from "@/components/admin/route-monitor";
import { format } from "date-fns";

export const dynamic = 'force-dynamic';

export default async function RoutesPage() {
    const session = await auth();
    if (!session) redirect("/login");

    const tenantId = session.user.tenantId;
    if (!tenantId) return <div className="p-8">Erro: Usuário sem tenant vinculado.</div>;

    try {
        const initialRoutes = await getLiveRoutes();

        return (
            <div className="p-8 space-y-8 h-full flex flex-col animate-in fade-in duration-500">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Rotas em Tempo Real</h2>
                    <p className="text-muted-foreground">
                        Logística e sequência de atendimentos para hoje, {format(new Date(), "dd/MM/yyyy")}.
                    </p>
                </div>

                <RouteMonitor initialRoutes={initialRoutes} />
            </div>
        );
    } catch (error) {
        console.error("Error loading routes page:", error);
        return (
            <div className="p-12 text-center space-y-4">
                <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto">
                    <span className="text-2xl font-bold">!</span>
                </div>
                <h2 className="text-xl font-bold">Erro ao carregar rotas</h2>
                <p className="text-muted-foreground">Ocorreu um problema ao buscar os dados em tempo real. Por favor, tente novamente.</p>
                <button
                    onClick={() => window.location.reload()}
                    className="px-4 py-2 bg-zinc-900 text-white rounded-lg font-bold"
                >
                    Recarregar Página
                </button>
            </div>
        );
    }
}
