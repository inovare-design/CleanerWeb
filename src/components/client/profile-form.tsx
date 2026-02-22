"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
import { User, Home, LogOut, Save, Loader2, BedDouble, Bath, Ruler, Lock, Eye, EyeOff } from "lucide-react";
import { updateClientProfile } from "@/actions/update-client-profile";
import { changeClientPassword } from "@/actions/change-client-password";
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
        area?: string | null;
        bedrooms?: number | null;
        bathrooms?: number | null;
        footage?: string | null;
        accessInfo?: string | null;
    };
}

export function ProfileForm({ user, customer }: ProfileFormProps) {
    const [saving, setSaving] = useState(false);
    const [changingPw, setChangingPw] = useState(false);
    const [showPw, setShowPw] = useState(false);
    const [pwDialogOpen, setPwDialogOpen] = useState(false);

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
        <div className="space-y-6">
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
                            <Label htmlFor="address" className="text-xs font-bold text-zinc-500">Endereço Completo</Label>
                            <Input id="address" name="address" defaultValue={customer.address || ""} placeholder="Rua, número, cidade" required className="h-12 rounded-xl border-zinc-200 focus:border-blue-500 font-medium" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="area" className="text-xs font-bold text-zinc-500">Sua Região / Bairro</Label>
                            <div className="grid grid-cols-2 gap-2">
                                {['NORTH', 'SOUTH', 'EAST', 'WEST'].map((r) => (
                                    <label
                                        key={r}
                                        className={`flex items-center justify-center h-12 rounded-xl border-2 cursor-pointer transition-all font-bold text-sm ${customer.area === r
                                                ? "border-blue-600 bg-blue-50 text-blue-600"
                                                : "border-zinc-100 bg-white text-zinc-400 hover:border-zinc-200"
                                            }`}
                                    >
                                        <input
                                            type="radio"
                                            name="area"
                                            value={r}
                                            defaultChecked={customer.area === r}
                                            className="sr-only"
                                        />
                                        {r}
                                    </label>
                                ))}
                            </div>
                            <p className="text-[10px] text-zinc-400">Isso nos ajuda a encontrar o melhor profissional para você.</p>
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

                {/* Save Profile */}
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
            </form>

            {/* Password Change + Logout buttons */}
            <div className="flex gap-3">
                <Dialog open={pwDialogOpen} onOpenChange={setPwDialogOpen}>
                    <DialogTrigger asChild>
                        <Button
                            type="button"
                            variant="outline"
                            className="flex-1 h-12 font-bold gap-2 rounded-xl border-zinc-200 hover:bg-zinc-50 active:scale-[0.98] transition-all"
                        >
                            <Lock className="w-4 h-4" />
                            Alterar Senha
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-md rounded-2xl">
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2 text-lg font-black">
                                <Lock className="w-5 h-5 text-blue-600" />
                                Alterar Senha
                            </DialogTitle>
                            <DialogDescription>
                                Digite sua senha atual e escolha uma nova senha.
                            </DialogDescription>
                        </DialogHeader>
                        <form
                            action={async (formData) => {
                                setChangingPw(true);
                                try {
                                    const result = await changeClientPassword(formData);
                                    if (result.error) {
                                        toast.error(result.error);
                                    } else {
                                        toast.success(result.success);
                                        setPwDialogOpen(false);
                                    }
                                } catch {
                                    toast.error("Erro ao alterar senha.");
                                } finally {
                                    setChangingPw(false);
                                }
                            }}
                            className="space-y-4 pt-2"
                        >
                            <div className="space-y-2">
                                <Label htmlFor="currentPassword" className="text-xs font-bold text-zinc-500">Senha Atual</Label>
                                <div className="relative">
                                    <Input
                                        id="currentPassword"
                                        name="currentPassword"
                                        type={showPw ? "text" : "password"}
                                        placeholder="••••••••"
                                        className="h-12 rounded-xl border-zinc-200 focus:border-blue-500 font-medium pr-12"
                                        required
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPw(!showPw)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600"
                                    >
                                        {showPw ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                    </button>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="newPassword" className="text-xs font-bold text-zinc-500">Nova Senha</Label>
                                <Input
                                    id="newPassword"
                                    name="newPassword"
                                    type="password"
                                    placeholder="Mínimo 6 caracteres"
                                    className="h-12 rounded-xl border-zinc-200 focus:border-blue-500 font-medium"
                                    required
                                    minLength={6}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="confirmPassword" className="text-xs font-bold text-zinc-500">Confirmar Nova Senha</Label>
                                <Input
                                    id="confirmPassword"
                                    name="confirmPassword"
                                    type="password"
                                    placeholder="Repita a nova senha"
                                    className="h-12 rounded-xl border-zinc-200 focus:border-blue-500 font-medium"
                                    required
                                    minLength={6}
                                />
                            </div>
                            <Button
                                type="submit"
                                disabled={changingPw}
                                className="w-full h-12 bg-blue-600 hover:bg-blue-700 font-bold gap-2 rounded-xl active:scale-[0.98] transition-all"
                            >
                                {changingPw ? (
                                    <><Loader2 className="w-4 h-4 animate-spin" /> Alterando...</>
                                ) : (
                                    <><Lock className="w-4 h-4" /> Confirmar Alteração</>
                                )}
                            </Button>
                        </form>
                    </DialogContent>
                </Dialog>

                <Button
                    type="button"
                    variant="ghost"
                    onClick={() => signOut()}
                    className="flex-1 h-12 text-red-500 hover:text-red-600 hover:bg-red-50 font-bold gap-2 rounded-xl"
                >
                    <LogOut className="w-4 h-4" />
                    Sair
                </Button>
            </div>
        </div>
    );
}

