"use client";

import dynamic from "next/dynamic";
import { Skeleton } from "@/components/ui/skeleton";

const MapViewClient = dynamic(() => import("./map-view-client"), {
    ssr: false,
    loading: () => (
        <div className="w-full h-full min-h-[300px] flex items-center justify-center bg-zinc-50 rounded-xl border border-dashed border-zinc-200">
            <div className="flex flex-col items-center gap-2">
                <Skeleton className="h-full w-full absolute inset-0" />
                <span className="text-zinc-400 text-sm z-10 font-medium">Carregando Mapa...</span>
            </div>
        </div>
    )
});

export default MapViewClient;
