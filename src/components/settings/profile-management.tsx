"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Settings2, Trash2 } from "lucide-react";
import { ADMIN_PERMISSIONS, STAFF_PERMISSIONS } from "@/lib/permissions";
import { createPermissionProfile, updatePermissionProfile, deletePermissionProfile } from "@/actions/manage-profiles";
import { toast } from "sonner";

interface CreateProfileModalProps {
    type: "ADMIN" | "STAFF";
    profile?: any; // For editing
}

export function CreateProfileModal({ type, profile }: CreateProfileModalProps) {
    const [open, setOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const permissionsList = type === "ADMIN" ? ADMIN_PERMISSIONS : STAFF_PERMISSIONS;

    async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setIsLoading(true);

        const formData = new FormData(event.currentTarget);
        formData.append("type", type);

        let result;
        if (profile) {
            result = await updatePermissionProfile(profile.id, formData);
        } else {
            result = await createPermissionProfile(formData);
        }

        setIsLoading(false);

        if (result.error) {
            toast.error(result.error);
        } else {
            toast.success(result.success);
            setOpen(false);
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {profile ? (
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <Settings2 className="h-4 w-4" />
                    </Button>
                ) : (
                    <Button className={type === "ADMIN" ? "bg-blue-600 hover:bg-blue-700" : "bg-emerald-600 hover:bg-emerald-700"}>
                        <Plus className="mr-2 h-4 w-4" /> Novo Perfil {type === "ADMIN" ? "Admin" : "Staff"}
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
                <form onSubmit={handleSubmit}>
                    <DialogHeader>
                        <DialogTitle>{profile ? "Editar" : "Novo"} Perfil de Acesso</DialogTitle>
                        <DialogDescription>
                            Defina o nome e as permissões para este perfil de {type === "ADMIN" ? "administradores" : "equipe"}.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">Nome do Perfil</Label>
                            <Input
                                id="name"
                                name="name"
                                defaultValue={profile?.name}
                                placeholder={type === "ADMIN" ? "ex: Gerente Financeiro" : "ex: Junior Cleaner"}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="description">Descrição (Opcional)</Label>
                            <Input
                                id="description"
                                name="description"
                                defaultValue={profile?.description}
                                placeholder="Breve explicação do que este perfil permite"
                            />
                        </div>

                        <div className="space-y-3 mt-2">
                            <Label>Permissões Selecionadas</Label>
                            <div className="grid gap-3 border rounded-lg p-4 bg-zinc-50 dark:bg-zinc-900/50">
                                {permissionsList.map((perm) => (
                                    <div key={perm.key} className="flex items-start space-x-3">
                                        <Checkbox
                                            id={perm.key}
                                            name="permissions"
                                            value={perm.key}
                                            defaultChecked={profile?.permissions?.includes(perm.key)}
                                        />
                                        <div className="grid gap-1 leading-none">
                                            <label
                                                htmlFor={perm.key}
                                                className="text-sm font-bold leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                            >
                                                {perm.label}
                                            </label>
                                            <p className="text-[10px] text-muted-foreground">
                                                {perm.description}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                    <DialogFooter className="flex items-center justify-between sm:justify-between w-full">
                        {profile && (
                            <Button
                                type="button"
                                variant="destructive"
                                size="sm"
                                onClick={async () => {
                                    if (confirm("Tem certeza? Esta ação não pode ser desfeita.")) {
                                        const res = await deletePermissionProfile(profile.id);
                                        if (res.error) toast.error(res.error);
                                        else {
                                            toast.success(res.success);
                                            setOpen(false);
                                        }
                                    }
                                }}
                            >
                                <Trash2 className="w-4 h-4 mr-2" /> Excluir
                            </Button>
                        )}
                        <Button type="submit" disabled={isLoading} className={type === "ADMIN" ? "bg-blue-600 hover:bg-blue-700" : "bg-emerald-600 hover:bg-emerald-700"}>
                            {isLoading ? "Salvando..." : "Salvar Perfil"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

export function ProfileList({ profiles, type }: { profiles: any[], type: "ADMIN" | "STAFF" }) {
    return (
        <div className="rounded-md border">
            <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50 uppercase">
                    <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 tracking-wider">Nome</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 tracking-wider">Descrição</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 tracking-wider text-center">Permissões</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 tracking-wider">Ações</th>
                    </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                    {profiles.map((p) => (
                        <tr key={p.id}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">{p.name}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{p.description || "-"}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                                <span className="p-1 px-2 rounded-md bg-zinc-100 font-mono text-xs">
                                    {p.permissions.length} itens
                                </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                <CreateProfileModal type={type} profile={p} />
                            </td>
                        </tr>
                    ))}
                    {profiles.length === 0 && (
                        <tr>
                            <td colSpan={4} className="px-6 py-12 text-center text-sm text-muted-foreground italic">
                                Nenhum perfil criado.
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );
}
