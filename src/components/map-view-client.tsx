"use client";

import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useEffect } from "react";
import { calculateDistance } from "@/lib/geocoding";

// Fix for default marker icons in Leaflet with Next.js
const DefaultIcon = L.icon({
    iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
    shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
});

L.Marker.prototype.options.icon = DefaultIcon;

interface MapMarker {
    id: string;
    position: [number, number];
    title: string;
    description?: string;
    type?: "client" | "employee";
}

interface MapViewProps {
    markers: MapMarker[];
    center?: [number, number];
    zoom?: number;
    className?: string;
    referencePoint?: [number, number];
}

function ChangeView({ center, zoom }: { center: [number, number], zoom: number }) {
    const map = useMap();
    useEffect(() => {
        map.setView(center, zoom);
    }, [center, zoom, map]);
    return null;
}

export default function MapView({ markers, center, zoom = 13, className = "h-full w-full", referencePoint }: MapViewProps) {
    const defaultCenter: [number, number] = center || (markers.length > 0 ? markers[0].position : [51.505, -0.09]);

    return (
        <MapContainer
            center={defaultCenter}
            zoom={zoom}
            className={className}
            scrollWheelZoom={true}
            style={{ minHeight: "300px" }}
        >
            <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {markers.map((marker) => {
                const distance = referencePoint ? calculateDistance(
                    { lat: referencePoint[0], lng: referencePoint[1] },
                    { lat: marker.position[0], lng: marker.position[1] }
                ) : null;

                return (
                    <Marker key={marker.id} position={marker.position}>
                        <Popup>
                            <div className="p-1">
                                <h3 className="font-bold text-sm text-zinc-900">{marker.title}</h3>
                                {marker.description && <p className="text-[10px] leading-tight text-zinc-500 mt-1 max-w-[150px]">{marker.description}</p>}

                                <div className="mt-2 flex flex-wrap gap-1 items-center">
                                    {marker.type && (
                                        <span className={`text-[9px] uppercase font-black px-1.5 py-0.5 rounded ${marker.type === 'client' ? 'bg-blue-100 text-blue-600 border border-blue-200' : 'bg-green-100 text-green-600 border border-green-200'
                                            }`}>
                                            {marker.type === 'client' ? 'Cliente' : 'Funcionário'}
                                        </span>
                                    )}
                                    {distance !== null && (
                                        <span className="text-[9px] font-bold bg-zinc-100 text-zinc-600 px-1.5 py-0.5 rounded border border-zinc-200">
                                            {distance} km
                                        </span>
                                    )}
                                </div>
                            </div>
                        </Popup>
                    </Marker>
                );
            })}
            {center && <ChangeView center={center} zoom={zoom} />}
        </MapContainer>
    );
}
