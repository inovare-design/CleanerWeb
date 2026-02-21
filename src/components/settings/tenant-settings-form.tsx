"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";
import { updateTenantSettings } from "@/actions/update-tenant-settings";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
    CheckCircle2,
    Building2,
    Image as ImageIcon,
    Loader2
} from "lucide-react";
import { toast } from "sonner";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";

interface TenantSettingsFormProps {
    tenant: any;
}

export function TenantSettingsForm({ tenant }: TenantSettingsFormProps) {
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);
    const [isSuccessOpen, setIsSuccessOpen] = useState(false);
    const [formData, setFormData] = useState<FormData | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    async function handleFormSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        const data = new FormData(e.currentTarget);
        setFormData(data);
        setIsConfirmOpen(true);
    }

    async function confirmUpdate() {
        if (!formData) return;

        setIsConfirmOpen(false);
        setIsLoading(true);

        try {
            const result = await updateTenantSettings(formData);
            if (result.success) {
                setIsSuccessOpen(true);
                toast.success("Configurações atualizadas com sucesso!");
            } else {
                toast.error(result.error || "Erro ao atualizar configurações.");
            }
        } catch (error) {
            toast.error("Erro inesperado ao atualizar configurações.");
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <div className="space-y-6">
            <Card className="border-none shadow-none bg-transparent">
                <CardContent className="p-0">
                    <form onSubmit={handleFormSubmit} className="space-y-6">
                        {/* Seção Dados Básicos */}
                        <div className="grid gap-6 md:grid-cols-2">
                            <div className="space-y-2">
                                <Label htmlFor="name" className="text-sm font-bold">Nome da Empresa</Label>
                                <Input
                                    id="name"
                                    name="name"
                                    defaultValue={tenant.name}
                                    className="h-11 rounded-xl bg-white dark:bg-zinc-900"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="email" className="text-sm font-bold">Email de Contato</Label>
                                <Input
                                    id="email"
                                    name="email"
                                    defaultValue={tenant.email || ""}
                                    className="h-11 rounded-xl bg-white dark:bg-zinc-900"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="phone" className="text-sm font-bold">Telefone</Label>
                                <Input
                                    id="phone"
                                    name="phone"
                                    defaultValue={tenant.phone || ""}
                                    className="h-11 rounded-xl bg-white dark:bg-zinc-900"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="taxId" className="text-sm font-bold">CNPJ / Documento</Label>
                                <Input
                                    id="taxId"
                                    name="taxId"
                                    defaultValue={tenant.taxId || ""}
                                    className="h-11 rounded-xl bg-white dark:bg-zinc-900"
                                />
                            </div>
                        </div>

                        {/* Seção Branding */}
                        <div className="space-y-4 pt-4 border-t border-zinc-100 dark:border-zinc-800">
                            <h3 className="text-sm font-black uppercase tracking-widest text-zinc-500">Identidade Visual (White-Label)</h3>
                            <div className="grid gap-6 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="logoUrl" className="text-sm font-bold flex items-center gap-2">
                                        <ImageIcon className="w-4 h-4 text-blue-500" />
                                        URL do Logotipo
                                    </Label>
                                    <Input
                                        id="logoUrl"
                                        name="logoUrl"
                                        placeholder="https://exemplo.com/logo.png"
                                        defaultValue={tenant.logoUrl || ""}
                                        className="h-11 rounded-xl bg-white dark:bg-zinc-900"
                                    />
                                    <p className="text-[10px] text-zinc-500 italic">Insira o link da imagem (PNG, SVG ou JPG) para personalizar o topo do site.</p>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="description" className="text-sm font-bold">Slogan ou Descrição</Label>
                                    <Input
                                        id="description"
                                        name="description"
                                        placeholder="Ex: Excelência em Limpeza Profissional"
                                        defaultValue={tenant.description || ""}
                                        className="h-11 rounded-xl bg-white dark:bg-zinc-900"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="address" className="text-sm font-bold">Endereço Completo</Label>
                            <Input
                                id="address"
                                name="address"
                                defaultValue={tenant.address || ""}
                                className="h-11 rounded-xl bg-white dark:bg-zinc-900"
                            />
                        </div>

                        <Button
                            type="submit"
                            disabled={isLoading}
                            className="bg-zinc-900 hover:bg-zinc-800 text-white rounded-xl h-12 px-8 font-bold text-lg shadow-lg hover:shadow-zinc-900/10 transition-all dark:bg-blue-600 dark:hover:bg-blue-500"
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                                    Salvando...
                                </>
                            ) : "Salvar Alterações"}
                        </Button>
                    </form>
                </CardContent>
            </Card>

            {/* Modal de Confirmação */}
            <Dialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
                <DialogContent className="sm:max-w-[400px] rounded-3xl">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-bold flex items-center gap-2">
                            Confirmar Alterações?
                        </DialogTitle>
                        <DialogDescription className="text-zinc-500 pt-2">
                            As informações da sua empresa serão atualizadas em todo o sistema. Isso inclui o nome e a logomarca exibidos no portal Admin.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="gap-2 sm:gap-0">
                        <Button variant="outline" onClick={() => setIsConfirmOpen(false)} className="rounded-xl border-zinc-200">
                            Cancelar
                        </Button>
                        <Button onClick={confirmUpdate} className="bg-zinc-900 hover:bg-zinc-800 text-white rounded-xl dark:bg-blue-600">
                            Sim, Atualizar
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Modal de Sucesso */}
            <Dialog open={isSuccessOpen} onOpenChange={setIsSuccessOpen}>
                <DialogContent className="sm:max-w-[400px] text-center p-12 rounded-3xl">
                    <div className="w-20 h-20 bg-emerald-100 dark:bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                        <CheckCircle2 className="w-10 h-10 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-black italic uppercase text-center">
                            Sucesso!
                        </DialogTitle>
                        <DialogDescription className="text-center text-zinc-500 pt-2">
                            As informações da empresa foram atualizadas com sucesso. O sistema já está operando com a nova identidade visual.
                        </DialogDescription>
                    </DialogHeader>
                    <Button
                        onClick={() => setIsSuccessOpen(false)}
                        className="mt-8 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl h-12 w-full font-bold shadow-lg shadow-emerald-500/20"
                    >
                        Entendido
                    </Button>
                </DialogContent>
            </Dialog>
        </div>
    );
}
