"use client";

import { useState } from "react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, Key, Trash2, Calendar } from "lucide-react";
import { deleteAdminUser } from "@/actions/manage-admins";
import { resetAdminPassword } from "@/actions/reset-admin-password";

interface EmployeeUserActionsProps {
    userId: string;
}

export function EmployeeUserActions({ userId }: EmployeeUserActionsProps) {
    const [isLoading, setIsLoading] = useState(false);

    async function onDelete() {
        if (!confirm("Tem certeza que deseja excluir este funcionário?")) return;
        setIsLoading(true);
        // Note: Reusing deleteAdminUser as it generically deletes a user from the tenant
        await deleteAdminUser(userId);
        setIsLoading(false);
    }

    async function onResetPassword() {
        const newPassword = prompt("Digite a nova senha para este funcionário:");
        if (!newPassword) return;
        setIsLoading(true);
        const result = await resetAdminPassword(userId, newPassword);
        setIsLoading(false);
        if (result.success) {
            alert("Senha alterada com sucesso!");
        } else {
            alert(result.error || "Erro ao resetar senha.");
        }
    }

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0" disabled={isLoading}>
                    <MoreHorizontal className="h-4 w-4" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuLabel>Ações</DropdownMenuLabel>
                <DropdownMenuItem onClick={() => window.location.href = `/admin/employees/${userId}`}>
                    <Calendar className="mr-2 h-4 w-4" /> <span>Ver Perfil</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => window.location.href = `/admin/calendar?employeeId=${userId}`}>
                    <Calendar className="mr-2 h-4 w-4" /> <span>Ver Agenda</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={onResetPassword}>
                    <Key className="mr-2 h-4 w-4" /> <span>Resetar Senha</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                    onClick={onDelete}
                    className="text-red-600 focus:text-red-600"
                >
                    <Trash2 className="mr-2 h-4 w-4" /> <span>Remover da Equipe</span>
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
