import { auth } from "@/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import MapView from "@/components/map-view";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { MapPin, Truck, RefreshCw, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { geocodeAllCustomers } from "@/actions/geocode-customers";

export default async function AdminMapPage(props: {
    searchParams?: Promise<{
        lat?: string;
        lng?: string;
        zoom?: string;
        cid?: string;
    }>;
}) {
    const session = await auth();
    if (!session?.user?.id) redirect("/login");

    const searchParams = await props.searchParams;
    const { lat, lng, zoom, cid } = searchParams || {};

    const customers = await db.customer.findMany({
        where: {
            tenantId: session.user.tenantId!,
            latitude: { not: null },
            longitude: { not: null }
        },
        include: {
            user: true
        }
    });

    const pendingGeocode = await db.customer.count({
        where: {
            tenantId: session.user.tenantId!,
            address: { not: null },
            OR: [
                { latitude: null },
                { longitude: null }
            ]
        }
    });

    const markers = customers.map((c: any) => ({
        id: c.id,
        position: [c.latitude!, c.longitude!] as [number, number],
        title: c.user.name || "Cliente",
        description: c.address || "",
        type: "client" as const
    }));

    const center: [number, number] | undefined = lat && lng ? [parseFloat(lat), parseFloat(lng)] : undefined;
    const initialZoom = zoom ? parseInt(zoom) : 12;

    const handleGeocode = async () => {
        "use server";
        await geocodeAllCustomers();
    };

    return (
        <div className="flex flex-col gap-6 p-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black italic tracking-tighter uppercase text-zinc-900 flex items-center gap-3">
                        <MapPin className="w-8 h-8 text-blue-600" />
                        Mapa de Clientes
                    </h1>
                    <p className="text-zinc-500 font-medium mt-1">Visualize a distribuição geográfica da sua base de clientes.</p>
                </div>

                {pendingGeocode > 0 && (
                    <form action={handleGeocode}>
                        <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-900/20 gap-2">
                            <RefreshCw className="w-4 h-4" />
                            Geocodificar {pendingGeocode} Clientes
                        </Button>
                    </form>
                )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                <Card className="lg:col-span-3 border-zinc-200 shadow-sm rounded-2xl overflow-hidden">
                    <CardHeader className="bg-zinc-50/50 border-b border-zinc-100">
                        <div className="flex items-center justify-between">
                            <CardTitle className="text-sm font-bold uppercase tracking-wider text-zinc-500">Mapa Interativo</CardTitle>
                            <Badge variant="outline" className="bg-blue-50 text-blue-600 border-blue-100 font-bold">
                                {customers.length} Localizados
                            </Badge>
                        </div>
                    </CardHeader>
                    <CardContent className="p-0 h-[600px] relative">
                        {markers.length > 0 ? (
                            <MapView markers={markers} center={center} zoom={initialZoom} referencePoint={center} className="h-full w-full" />
                        ) : (
                            <div className="h-full w-full flex flex-col items-center justify-center bg-zinc-50 gap-4">
                                <div className="w-16 h-16 bg-zinc-100 rounded-full flex items-center justify-center">
                                    <MapPin className="w-8 h-8 text-zinc-300" />
                                </div>
                                <div className="text-center">
                                    <p className="text-zinc-900 font-bold">Nenhum cliente geolocalizado</p>
                                    <p className="text-zinc-500 text-sm">Clique em geocodificar para processar os endereços.</p>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>

                <div className="space-y-6">
                    <Card className="border-zinc-200 shadow-sm rounded-2xl">
                        <CardHeader>
                            <CardTitle className="text-sm font-bold uppercase tracking-wider text-zinc-500">Estatísticas Geográficas</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center justify-between p-3 bg-zinc-50 rounded-xl border border-zinc-100">
                                <div className="flex items-center gap-3">
                                    <Users className="w-4 h-4 text-blue-600" />
                                    <span className="text-sm font-medium">Total de Clientes</span>
                                </div>
                                <span className="text-sm font-bold">{customers.length + pendingGeocode}</span>
                            </div>
                            <div className="flex items-center justify-between p-3 bg-green-50 rounded-xl border border-green-100 text-green-700">
                                <div className="flex items-center gap-3">
                                    <MapPin className="w-4 h-4" />
                                    <span className="text-sm font-medium">Localizados</span>
                                </div>
                                <span className="text-sm font-bold">{customers.length}</span>
                            </div>
                            <div className="flex items-center justify-between p-3 bg-orange-50 rounded-xl border border-orange-100 text-orange-700">
                                <div className="flex items-center gap-3">
                                    <RefreshCw className="w-4 h-4" />
                                    <span className="text-sm font-medium">Pendentes</span>
                                </div>
                                <span className="text-sm font-bold">{pendingGeocode}</span>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-zinc-200 shadow-sm rounded-2xl">
                        <CardHeader>
                            <CardTitle className="text-sm font-bold uppercase tracking-wider text-zinc-500">Legenda</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <div className="flex items-center gap-3">
                                <div className="w-3 h-3 rounded-full bg-blue-600 shadow-sm shadow-blue-900/20" />
                                <span className="text-xs font-medium text-zinc-600">Marcador de Cliente</span>
                            </div>
                            <p className="text-[10px] text-zinc-400 leading-relaxed">
                                Os marcadores mostram a localização aproximada baseada no endereço cadastrado.
                            </p>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}

function Badge({ children, className, variant }: { children: React.ReactNode, className?: string, variant?: string }) {
    return (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${className}`}>
            {children}
        </span>
    );
}
