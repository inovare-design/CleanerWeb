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
import { MoreHorizontal, Key, Trash2, Calendar, ShieldCheck, UserCircle } from "lucide-react";
import { deleteAdminUser, updateUserProfile } from "@/actions/manage-admins";
import { resetAdminPassword } from "@/actions/reset-admin-password";

interface EmployeeUserActionsProps {
    userId: string;
    profiles: any[];
    currentProfileId?: string | null;
}

export function EmployeeUserActions({ userId, profiles, currentProfileId }: EmployeeUserActionsProps) {
    const [isLoading, setIsLoading] = useState(false);

    async function onUpdateProfile(profileId: string | null) {
        if (!confirm("Alterar perfil de acesso deste funcionário?")) return;
        setIsLoading(true);
        await updateUserProfile(userId, profileId);
        setIsLoading(false);
    }

    async function onDelete() {
        // ... same onDelete logic
    }

    async function onResetPassword() {
        // ... same onResetPassword logic
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
                <DropdownMenuLabel>Perfil de Acesso</DropdownMenuLabel>
                <DropdownMenuItem
                    onClick={() => onUpdateProfile(null)}
                    className={!currentProfileId ? "bg-zinc-100" : ""}
                >
                    <UserCircle className="mr-2 h-4 w-4" /> <span>Padrão (CLEANER)</span>
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
