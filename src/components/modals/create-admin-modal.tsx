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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Plus } from "lucide-react";
import { createAdminUser } from "@/actions/manage-admins";

interface CreateAdminModalProps {
    profiles: any[];
}

export function CreateAdminModal({ profiles }: CreateAdminModalProps) {
    const [open, setOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");

    async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setIsLoading(true);
        setError("");

        const formData = new FormData(event.currentTarget);
        const result = await createAdminUser(formData);

        setIsLoading(false);

        if (result.error) {
            setError(result.error);
        } else {
            setOpen(false);
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className="bg-blue-600 hover:bg-blue-700 font-bold">
                    <Plus className="mr-2 h-4 w-4" /> Novo Administrador
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <form onSubmit={handleSubmit}>
                    <DialogHeader>
                        <DialogTitle className="text-xl font-bold tracking-tight italic uppercase">Novo Administrador</DialogTitle>
                        <DialogDescription>
                            Crie um novo usuário com acesso administrativo e atribua um perfil de permissões.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        {error && (
                            <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm border border-red-100 font-medium">
                                {error}
                            </div>
                        )}
                        <div className="space-y-2">
                            <Label htmlFor="name">Nome</Label>
                            <Input id="name" name="name" placeholder="João Silva" required />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input id="email" name="email" type="email" placeholder="joao@exemplo.com" required />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="password">Senha</Label>
                            <Input id="password" name="password" type="password" required />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="profileId">Perfil de Acesso</Label>
                            <Select name="profileId" required>
                                <SelectTrigger>
                                    <SelectValue placeholder="Selecione um perfil" />
                                </SelectTrigger>
                                <SelectContent>
                                    {profiles.map((profile) => (
                                        <SelectItem key={profile.id} value={profile.id}>
                                            {profile.name}
                                        </SelectItem>
                                    ))}
                                    <SelectItem value="DEFAULT">Administrador Padrão (Full)</SelectItem>
                                </SelectContent>
                            </Select>
                            <p className="text-[10px] text-muted-foreground italic">Determine o que este usuário poderá acessar.</p>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="role">Nível Base</Label>
                            <Select name="role" defaultValue="ADMIN">
                                <SelectTrigger>
                                    <SelectValue placeholder="Selecione o nível" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="ADMIN">Administrador (ADMIN)</SelectItem>
                                    <SelectItem value="SUPER_ADMIN">Acesso Total (SUPER_ADMIN)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="submit" disabled={isLoading} className="bg-blue-600 hover:bg-blue-700 w-full font-bold">
                            {isLoading ? "Criando..." : "Criar Usuário"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
