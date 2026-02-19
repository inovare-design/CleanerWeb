"use client";

import { useMemo } from "react";

interface DataPoint {
    label: string;
    value: number;
}

interface DashboardChartProps {
    data: DataPoint[];
    title?: string;
}

export function RevenueChart({ data, title }: DashboardChartProps) {
    const maxValue = useMemo(() => Math.max(...data.map(d => d.value), 1), [data]);

    return (
        <div className="w-full h-full flex flex-col">
            {title && <h3 className="text-sm font-bold mb-6 text-zinc-500 uppercase tracking-widest">{title}</h3>}
            <div className="flex-1 flex items-end justify-between gap-3 min-h-[150px] px-2">
                {data.map((point, i) => {
                    const height = (point.value / maxValue) * 100;
                    return (
                        <div key={i} className="flex-1 flex flex-col items-center gap-3 group h-full justify-end">
                            <div className="relative w-full flex flex-col items-center">
                                {/* Tooltip on hover */}
                                <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-[10px] font-black px-3 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none whitespace-nowrap z-50 shadow-xl scale-75 group-hover:scale-100">
                                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(point.value)}
                                    <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-zinc-900 dark:bg-zinc-100 rotate-45" />
                                </div>

                                <div
                                    className="w-full max-w-[42px] bg-blue-500/10 group-hover:bg-blue-600 transition-all duration-500 rounded-t-md relative overflow-hidden"
                                    style={{
                                        height: `${height}%`,
                                        minHeight: '6px',
                                        transitionDelay: `${i * 50}ms`
                                    }}
                                >
                                    {/* Glass reflection effect */}
                                    <div className="absolute inset-0 bg-gradient-to-t from-white/0 via-white/10 to-white/0 translate-y-full group-hover:translate-y-[-200%] transition-transform duration-1000" />
                                </div>
                            </div>
                            <span className="text-[10px] font-bold text-zinc-400 group-hover:text-zinc-900 dark:group-hover:text-zinc-100 transition-colors uppercase tracking-tighter">
                                {point.label}
                            </span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
