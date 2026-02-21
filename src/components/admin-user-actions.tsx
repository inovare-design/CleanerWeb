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
import { MoreHorizontal, Key, UserCog, Trash2, ShieldCheck, UserCircle } from "lucide-react";
import { deleteAdminUser, updateAdminRole, updateUserProfile } from "@/actions/manage-admins";
import { resetAdminPassword } from "@/actions/reset-admin-password";
import { Role } from "@prisma/client";

interface AdminUserActionsProps {
    userId: string;
    currentRole: string;
    isSelf: boolean;
    profiles: any[];
    currentProfileId?: string | null;
}

export function AdminUserActions({ userId, currentRole, isSelf, profiles, currentProfileId }: AdminUserActionsProps) {
    const [isLoading, setIsLoading] = useState(false);

    async function onUpdateProfile(profileId: string | null) {
        if (!confirm("Alterar perfil de acesso deste usuário?")) return;
        setIsLoading(true);
        await updateUserProfile(userId, profileId);
        setIsLoading(false);
    }
    // ... rest of the functions

    async function onDelete() {
        if (!confirm("Tem certeza que deseja excluir este administrador?")) return;
        setIsLoading(true);
        await deleteAdminUser(userId);
        setIsLoading(false);
    }

    async function onToggleRole() {
        const newRole = (currentRole as string) === "SUPER_ADMIN" ? "ADMIN" : "SUPER_ADMIN";
        if (!confirm(`Mudar cargo para ${newRole}?`)) return;
        setIsLoading(true);
        await updateAdminRole(userId, newRole as Role);
        setIsLoading(false);
    }

    async function onResetPassword() {
        const newPassword = prompt("Digite a nova senha temporária para este usuário:");
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
                <DropdownMenuItem onClick={onResetPassword}>
                    <Key className="mr-2 h-4 w-4" /> <span>Resetar Senha</span>
                </DropdownMenuItem>

                <DropdownMenuSeparator />
                <DropdownMenuLabel>Perfil de Acesso</DropdownMenuLabel>
                <DropdownMenuItem
                    onClick={() => onUpdateProfile(null)}
                    className={!currentProfileId ? "bg-zinc-100" : ""}
                >
                    <UserCircle className="mr-2 h-4 w-4" /> <span>Padrão (ADMIN)</span>
                </DropdownMenuItem>
                {profiles.map((profile) => (
                    <DropdownMenuItem
                        key={profile.id}
                        onClick={() => onUpdateProfile(profile.id)}
                        className={currentProfileId === profile.id ? "bg-zinc-100" : ""}
                    >
                        <ShieldCheck className="mr-2 h-4 w-4" /> <span>{profile.name}</span>
                    </DropdownMenuItem>
                ))}

                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={onToggleRole}>
                    <UserCog className="mr-2 h-4 w-4" /> <span>Mudar Cargo ({currentRole})</span>
                </DropdownMenuItem>

                <DropdownMenuSeparator />
                <DropdownMenuItem
                    onClick={onDelete}
                    className="text-red-600 focus:text-red-00"
                    disabled={isSelf}
                >
                    <Trash2 className="mr-2 h-4 w-4" /> <span>Excluir Conta</span>
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
