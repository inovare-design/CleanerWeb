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

export function CreateEmployeeModal() {
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
            // Opcional: Toast de sucesso
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className="bg-emerald-600 hover:bg-emerald-700">
                    <Plus className="mr-2 h-4 w-4" /> Novo Funcionário
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <form onSubmit={handleSubmit}>
                    <DialogHeader>
                        <DialogTitle>Novo Membro da Equipe</DialogTitle>
                        <DialogDescription>
                            Adicione um cleaner ou funcionário. Você define a senha e o acesso.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        {error && (
                            <div className="bg-red-100 text-red-600 p-2 rounded-md text-sm">
                                {error}
                            </div>
                        )}
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="name" className="text-right">
                                Nome
                            </Label>
                            <Input
                                id="name"
                                name="name"
                                placeholder="Maria Limpeza"
                                className="col-span-3"
                                required
                            />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="email" className="text-right">
                                Email
                            </Label>
                            <Input
                                id="email"
                                name="email"
                                type="email"
                                placeholder="maria@cleanfast.com"
                                className="col-span-3"
                                required
                            />
                        </div>
                        <div className="grid grid-cols-4 items-start gap-4">
                            <Label htmlFor="password" className="text-right mt-3">
                                Senha
                            </Label>
                            <div className="col-span-3 space-y-1">
                                <Input
                                    id="password"
                                    name="password"
                                    type="password"
                                    placeholder="Defina a senha dela"
                                    required
                                    minLength={6}
                                />
                                <p className="text-[10px] text-muted-foreground italic">Mínimo de 6 caracteres.</p>
                            </div>
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="phone" className="text-right">
                                Telefone
                            </Label>
                            <Input
                                id="phone"
                                name="phone"
                                placeholder="(11) 99999-9999"
                                className="col-span-3"
                            />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="color" className="text-right">
                                Cor Agenda
                            </Label>
                            <div className="col-span-3 flex items-center gap-2">
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
                    </div>
                    <DialogFooter>
                        <Button type="submit" disabled={isLoading} className="bg-emerald-600 hover:bg-emerald-700">
                            {isLoading ? "Salvando..." : "Salvar Funcionário"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
