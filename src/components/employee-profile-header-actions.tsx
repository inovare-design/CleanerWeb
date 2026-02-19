"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Key, Trash2 } from "lucide-react";
import { deleteAdminUser } from "@/actions/manage-admins";
import { resetAdminPassword } from "@/actions/reset-admin-password";
import { useRouter } from "next/navigation";

interface EmployeeProfileHeaderActionsProps {
    userId: string;
}

export function EmployeeProfileHeaderActions({ userId }: EmployeeProfileHeaderActionsProps) {
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();

    async function onDelete() {
        if (!confirm("Tem certeza que deseja excluir este funcionário?")) return;
        setIsLoading(true);
        const result = await deleteAdminUser(userId);
        setIsLoading(false);
        if (result.success) {
            router.push("/admin/employees");
        } else {
            alert(result.error || "Erro ao excluir funcionário.");
        }
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
        <div className="flex gap-2">
            <Button variant="outline" onClick={onResetPassword} disabled={isLoading}>
                <Key className="mr-2 h-4 w-4" /> Resetar Senha
            </Button>
            <Button variant="destructive" onClick={onDelete} disabled={isLoading}>
                <Trash2 className="mr-2 h-4 w-4" /> Excluir Conta
            </Button>
        </div>
    );
}
