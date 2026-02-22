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
import { Plus } from "lucide-react";
import { createEmployee } from "@/actions/create-employee";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";

interface CreateEmployeeModalProps {
    profiles: any[];
}

export function CreateEmployeeModal({ profiles }: CreateEmployeeModalProps) {
    const [open, setOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");

    async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setIsLoading(true);
        setError("");

        const formData = new FormData(event.currentTarget);
        const result = await createEmployee(formData);

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
                <Button className="bg-emerald-600 hover:bg-emerald-700 font-bold">
                    <Plus className="mr-2 h-4 w-4" /> Novo Funcionário
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <form onSubmit={handleSubmit}>
                    <DialogHeader>
                        <DialogTitle className="text-xl font-bold tracking-tight italic uppercase">Novo Membro da Equipe</DialogTitle>
                        <DialogDescription>
                            Adicione um cleaner ou funcionário e atribua um perfil de acesso.
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
                            <Input
                                id="name"
                                name="name"
                                placeholder="Maria Limpeza"
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                name="email"
                                type="email"
                                placeholder="maria@cleanfast.com"
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="password">Senha</Label>
                            <Input
                                id="password"
                                name="password"
                                type="password"
                                placeholder="Defina a senha dela"
                                required
                                minLength={6}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="profileId">Perfil de Acesso</Label>
                            <Select name="profileId" required>
                                <SelectTrigger>
                                    <SelectValue placeholder="Selecione o perfil" />
                                </SelectTrigger>
                                <SelectContent>
                                    {profiles.map((profile) => (
                                        <SelectItem key={profile.id} value={profile.id}>
                                            {profile.name}
                                        </SelectItem>
                                    ))}
                                    <SelectItem value="DEFAULT">Funcionalidade Padrão</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="phone">Telefone</Label>
                            <Input
                                id="phone"
                                name="phone"
                                placeholder="(11) 99999-9999"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="color">Cor Agenda</Label>
                            <div className="flex items-center gap-2">
                                <Input
                                    id="color"
                                    name="color"
                                    type="color"
                                    className="w-12 h-10 p-1 cursor-pointer"
                                    defaultValue="#10b981"
                                />
                                <span className="text-xs text-muted-foreground">Cor na agenda/mapa.</span>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="servedAreas">Regiões de Atendimento</Label>
                            <Input
                                id="servedAreas"
                                name="servedAreas"
                                placeholder="Centro, Jardins, Setor Bueno..."
                            />
                            <p className="text-[10px] text-muted-foreground italic">Separe por vírgulas (Ex: Centro, Bueno, Oeste)</p>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="submit" disabled={isLoading} className="bg-emerald-600 hover:bg-emerald-700 w-full font-bold">
                            {isLoading ? "Salvando..." : "Salvar Funcionário"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
