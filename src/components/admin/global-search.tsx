"use client";

import { useState, useEffect, useRef } from "react";
import { Search, Loader2, User, Calendar, Briefcase, Layers, X, MoveRight } from "lucide-react";
import { globalSearch } from "@/actions/global-search";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { useClickAway } from "react-use";

export function GlobalSearch() {
    const [query, setQuery] = useState("");
    const [results, setResults] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    const router = useRouter();
    const containerRef = useRef<HTMLDivElement>(null);

    useClickAway(containerRef, () => setIsOpen(false));

    useEffect(() => {
        const delayDebounceFn = setTimeout(async () => {
            if (query.length >= 2) {
                setIsLoading(true);
                setIsOpen(true);
                try {
                    const data = await globalSearch(query);
                    setResults(data);
                } catch (error) {
                    console.error("Search error:", error);
                } finally {
                    setIsLoading(false);
                }
            } else {
                setResults([]);
                setIsOpen(false);
            }
        }, 300);

        return () => clearTimeout(delayDebounceFn);
    }, [query]);

    const handleSelect = (href: string) => {
        router.push(href);
        setIsOpen(false);
        setQuery("");
    };

    const getTypeIcon = (type: string) => {
        switch (type) {
            case "Cliente": return <User className="w-4 h-4 text-orange-400" />;
            case "Funcionário": return <Briefcase className="w-4 h-4 text-emerald-400" />;
            case "Agendamento": return <Calendar className="w-4 h-4 text-violet-400" />;
            case "Serviço": return <Layers className="w-4 h-4 text-indigo-400" />;
            default: return <Search className="w-4 h-4" />;
        }
    };

    return (
        <div ref={containerRef} className="relative px-3 mb-4">
            <div className="relative group">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500 group-focus-within:text-blue-400 transition-colors" />
                <input
                    type="text"
                    placeholder="Busca universal (Ctrl+K)..."
                    className="w-full bg-[#1f2937]/50 border border-[#374151] rounded-xl pl-10 pr-4 py-2 text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-600/50 focus:border-blue-600/50 transition-all font-medium"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onFocus={() => query.length >= 2 && setIsOpen(true)}
                />
                {isLoading && (
                    <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-3 w-3 text-blue-500 animate-spin" />
                )}
                {query && !isLoading && (
                    <button
                        onClick={() => setQuery("")}
                        className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md hover:bg-white/10 p-0.5"
                    >
                        <X className="h-3 w-3 text-gray-500" />
                    </button>
                )}
            </div>

            {/* Results Dropdown */}
            {isOpen && (
                <div className="absolute top-full left-3 right-3 mt-2 bg-[#1f2937] border border-[#374151] rounded-2xl shadow-2xl z-[100] overflow-hidden animate-in fade-in zoom-in-95 duration-200 backdrop-blur-xl">
                    <div className="max-h-[350px] overflow-y-auto p-2 space-y-1 custom-scrollbar">
                        {results.length > 0 ? (
                            results.map((res) => (
                                <button
                                    key={`${res.type}-${res.id}`}
                                    onClick={() => handleSelect(res.href)}
                                    className="w-full text-left group flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 transition-colors border border-transparent hover:border-white/5"
                                >
                                    <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center shrink-0">
                                        {getTypeIcon(res.type)}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <p className="text-sm font-bold text-gray-100 truncate">{res.title}</p>
                                            <span className="text-[9px] font-black uppercase tracking-widest text-gray-500 px-1.5 py-0.5 bg-white/5 rounded">
                                                {res.type}
                                            </span>
                                        </div>
                                        <p className="text-xs text-gray-500 truncate">{res.subtitle}</p>
                                    </div>
                                    <MoveRight className="w-3 h-3 text-gray-600 opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all" />
                                </button>
                            ))
                        ) : (
                            <div className="p-8 text-center">
                                <Search className="w-8 h-8 text-gray-700 mx-auto mb-3" />
                                <p className="text-sm text-gray-500 font-medium">Nenhum resultado encontrado para &quot;{query}&quot;</p>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

// Custom hook to detect key combos if we want to add Ctrl+K later
