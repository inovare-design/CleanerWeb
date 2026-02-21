"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { User, Home, Phone, MapPin, LogOut, Save, Loader2, CheckCircle2, BedDouble, Bath, Ruler } from "lucide-react";
import { updateClientProfile } from "@/actions/update-client-profile";
import { signOut } from "next-auth/react";
import { toast } from "sonner";

interface ProfileFormProps {
    user: {
        name: string;
        email: string;
    };
    customer: {
        phone?: string | null;
        address?: string | null;
        bedrooms?: number | null;
        bathrooms?: number | null;
        footage?: string | null;
        accessInfo?: string | null;
    };
}

export function ProfileForm({ user, customer }: ProfileFormProps) {
    const [saving, setSaving] = useState(false);

    async function handleSubmit(formData: FormData) {
        setSaving(true);
        try {
            const result = await updateClientProfile(formData);
            if (result.error) {
                toast.error(result.error);
            } else {
                toast.success("Perfil atualizado com sucesso!");
            }
        } catch {
            toast.error("Erro ao salvar.");
        } finally {
            setSaving(false);
        }
    }

    return (
        <form action={handleSubmit} className="space-y-6">
            {/* Personal Info */}
            <Card className="border-0 shadow-sm">
                <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-black uppercase tracking-widest text-zinc-400 flex items-center gap-2">
                        <User className="w-4 h-4" />
                        Dados Pessoais
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 pb-6">
                    <div className="space-y-2">
                        <Label htmlFor="name" className="text-xs font-bold text-zinc-500">Nome Completo</Label>
                        <Input id="name" name="name" defaultValue={user.name} className="h-12 rounded-xl border-zinc-200 focus:border-blue-500 font-medium" />
                    </div>
                    <div className="space-y-2">
                        <Label className="text-xs font-bold text-zinc-500">E-mail</Label>
                        <Input value={user.email} disabled className="h-12 rounded-xl bg-zinc-50 font-medium text-zinc-400" />
                        <p className="text-[10px] text-zinc-400">O e-mail não pode ser alterado.</p>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="phone" className="text-xs font-bold text-zinc-500">Telefone</Label>
                        <Input id="phone" name="phone" defaultValue={customer.phone || ""} placeholder="+351 912 345 678" className="h-12 rounded-xl border-zinc-200 focus:border-blue-500 font-medium" />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="address" className="text-xs font-bold text-zinc-500">Endereço</Label>
                        <Input id="address" name="address" defaultValue={customer.address || ""} placeholder="Rua, número, cidade" className="h-12 rounded-xl border-zinc-200 focus:border-blue-500 font-medium" />
                    </div>
                </CardContent>
            </Card>

            {/* Property Info */}
            <Card className="border-0 shadow-sm">
                <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-black uppercase tracking-widest text-zinc-400 flex items-center gap-2">
                        <Home className="w-4 h-4" />
                        Seu Imóvel
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 pb-6">
                    <div className="grid grid-cols-3 gap-3">
                        <div className="space-y-2">
                            <Label htmlFor="bedrooms" className="text-xs font-bold text-zinc-500 flex items-center gap-1">
                                <BedDouble className="w-3 h-3" /> Quartos
                            </Label>
                            <Input id="bedrooms" name="bedrooms" type="number" min="0" defaultValue={customer.bedrooms ?? ""} className="h-12 rounded-xl border-zinc-200 focus:border-blue-500 font-medium text-center" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="bathrooms" className="text-xs font-bold text-zinc-500 flex items-center gap-1">
                                <Bath className="w-3 h-3" /> Banheiros
                            </Label>
                            <Input id="bathrooms" name="bathrooms" type="number" min="0" defaultValue={customer.bathrooms ?? ""} className="h-12 rounded-xl border-zinc-200 focus:border-blue-500 font-medium text-center" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="footage" className="text-xs font-bold text-zinc-500 flex items-center gap-1">
                                <Ruler className="w-3 h-3" /> Área (m²)
                            </Label>
                            <Input id="footage" name="footage" defaultValue={customer.footage || ""} placeholder="80" className="h-12 rounded-xl border-zinc-200 focus:border-blue-500 font-medium text-center" />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="accessInfo" className="text-xs font-bold text-zinc-500">Informações de Acesso</Label>
                        <Textarea id="accessInfo" name="accessInfo" defaultValue={customer.accessInfo || ""} placeholder="Código do portão, instruções especiais..." className="rounded-xl border-zinc-200 focus:border-blue-500 font-medium min-h-[80px] resize-none" />
                    </div>
                </CardContent>
            </Card>

            {/* Actions */}
            <div className="space-y-3">
                <Button
                    type="submit"
                    disabled={saving}
                    className="w-full h-14 bg-blue-600 hover:bg-blue-700 text-lg font-black gap-3 rounded-2xl shadow-lg shadow-blue-200 active:scale-[0.98] transition-all"
                >
                    {saving ? (
                        <><Loader2 className="w-5 h-5 animate-spin" /> Salvando...</>
                    ) : (
                        <><Save className="w-5 h-5" /> Salvar Alterações</>
                    )}
                </Button>

                <Button
                    type="button"
                    variant="ghost"
                    onClick={() => signOut()}
                    className="w-full h-12 text-red-500 hover:text-red-600 hover:bg-red-50 font-bold gap-2 rounded-2xl"
                >
                    <LogOut className="w-5 h-5" />
                    Sair da Conta
                </Button>
            </div>
        </form>
    );
}
