"use client";

import { Badge } from "@/components/ui/badge";
import { toggleClientStatus } from "@/actions/toggle-client-status";
import { useState, useTransition } from "react";
import { Loader2 } from "lucide-react";

interface ClientStatusBadgeProps {
    customerId: string;
    initialStatus: boolean;
}

export function ClientStatusBadge({ customerId, initialStatus }: ClientStatusBadgeProps) {
    const [isPending, startTransition] = useTransition();
    const [isActive, setIsActive] = useState(initialStatus);

    const handleToggle = () => {
        startTransition(async () => {
            const result = await toggleClientStatus(customerId, isActive);
            if (result.success && result.newStatus !== undefined) {
                setIsActive(result.newStatus);
            }
        });
    };

    return (
        <Badge
            variant={isActive ? "outline" : "destructive"}
            className={`cursor-pointer select-none hover:bg-muted ${isActive ? "text-green-600 border-green-600" : "bg-red-100 text-red-600 border-red-200"}`}
            onClick={handleToggle}
        >
            {isPending ? (
                <Loader2 className="h-3 w-3 animate-spin mr-1" />
            ) : null}
            {isActive ? "Cliente Ativo" : "Cliente Inativo"}
        </Badge>
    );
}
