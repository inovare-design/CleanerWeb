"use client";

import { Button } from "@/components/ui/button";
import { MessageCircle } from "lucide-react";
import { EditClientModal } from "@/components/modals/edit-client-modal";

interface ClientProfileHeaderActionsProps {
    client: any;
}

export function ClientProfileHeaderActions({ client }: ClientProfileHeaderActionsProps) {
    const handleSendMessage = () => {
        const phone = client.customerProfile?.phone?.replace(/\D/g, "");
        if (phone) {
            window.open(`https://wa.me/55${phone}`, "_blank");
        } else {
            alert("Cliente sem telefone cadastrado.");
        }
    };

    return (
        <div className="flex gap-2">
            <Button variant="outline" onClick={handleSendMessage}>
                <MessageCircle className="mr-2 h-4 w-4" /> Enviar Mensagem
            </Button>
            <EditClientModal client={client} />
        </div>
    );
}
