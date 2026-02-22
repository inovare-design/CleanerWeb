"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { updateEmployeeProfile } from "@/actions/update-employee-profile";
import { createEmployeePayment } from "@/actions/manage-payments";
import { submitFeedback } from "@/actions/submit-feedback";
import { useRouter } from "next/navigation";

interface FormProps {
    employee: any;
}

export function EmployeePaymentForm({ employee }: FormProps) {
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();

    const handleRegisterPayment = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setIsLoading(true);
        const formData = new FormData(event.currentTarget);
        const result = await createEmployeePayment(formData);
        setIsLoading(false);
        if (result.success) {
            toast.success("Pagamento registrado!");
            event.currentTarget.reset();
            router.refresh();
        } else {
            toast.error(result.error || "Erro ao registrar pagamento.");
        }
    };

    return (
        <Card className="md:col-span-1">
            <CardHeader>
                <CardTitle>Registrar Pagamento</CardTitle>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleRegisterPayment} className="space-y-4">
                    <input type="hidden" name="employeeId" value={employee.id} />
                    <div className="space-y-2">
                        <Label>Valor (R$)</Label>
                        <Input name="amount" type="number" step="0.01" required />
                    </div>
                    <div className="space-y-2">
                        <Label>Tipo</Label>
                        <Select name="type" defaultValue="SALARY">
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="SALARY">Salário</SelectItem>
                                <SelectItem value="BONUS">Bônus / Extra</SelectItem>
                                <SelectItem value="TIP">Tips (Repasse)</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label>Observação</Label>
                        <Input name="notes" placeholder="Ex: Referente a Jan/2026" />
                    </div>
                    <Button type="submit" className="w-full" disabled={isLoading}>
                        {isLoading ? "Registrando..." : "Registrar"}
                    </Button>
                </form>
            </CardContent>
        </Card>
    );
}

export function EmployeeFeedbackForm({ employee }: FormProps) {
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();

    const handleSubmitFeedback = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setIsLoading(true);
        const formData = new FormData(event.currentTarget);
        const result = await submitFeedback(formData);
        setIsLoading(false);
        if (result.success) {
            toast.success("Feedback registrado!");
            event.currentTarget.reset();
            router.refresh();
        } else {
            toast.error(result.error || "Erro ao registrar feedback.");
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Registrar Nova Avaliação</CardTitle>
                <CardDescription>Adicione um feedback manual de um cliente ou uma avaliação interna da equipe.</CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmitFeedback} className="grid md:grid-cols-2 gap-4 items-end">
                    <input type="hidden" name="toEmployeeId" value={employee.id} />
                    <div className="space-y-2">
                        <Label>Tipo de Avaliação</Label>
                        <Select name="type" defaultValue="CLIENT_TO_EMPLOYEE">
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="CLIENT_TO_EMPLOYEE">Cliente para Funcionário</SelectItem>
                                <SelectItem value="TEAMMATE_RATING">Equipe para Funcionário (Interno)</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label>Nota (1 a 5 Estrelas)</Label>
                        <Select name="rating" defaultValue="5">
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="5">5 Estrelas - Excelente</SelectItem>
                                <SelectItem value="4">4 Estrelas - Bom</SelectItem>
                                <SelectItem value="3">3 Estrelas - Regular</SelectItem>
                                <SelectItem value="2">2 Estrelas - Ruim</SelectItem>
                                <SelectItem value="1">1 Estrela - Insatisfeito</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="md:col-span-2 space-y-2">
                        <Label>Comentário / Observação</Label>
                        <Input name="comment" placeholder="Descreva brevemente o feedback..." required />
                    </div>
                    <div className="md:col-span-2">
                        <Button type="submit" className="w-full md:w-auto" disabled={isLoading}>
                            {isLoading ? "Registrando..." : "Registrar Avaliação"}
                        </Button>
                    </div>
                </form>
            </CardContent>
        </Card>
    );
}

export function EmployeeSettingsForm({ employee }: FormProps) {
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();

    const handleUpdateProfile = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setIsLoading(true);
        const formData = new FormData(event.currentTarget);
        const result = await updateEmployeeProfile(formData);
        setIsLoading(false);
        if (result.success) {
            toast.success("Perfil atualizado com sucesso!");
            router.refresh();
        } else {
            toast.error(result.error || "Erro ao atualizar perfil.");
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Editar Perfil Profissional</CardTitle>
                <CardDescription>Atualize os detalhes de contato e visualização.</CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleUpdateProfile} className="space-y-4 max-w-md">
                    <input type="hidden" name="userId" value={employee.id} />
                    <div className="space-y-2">
                        <Label htmlFor="phone">Telefone de Contato</Label>
                        <Input id="phone" name="phone" defaultValue={employee.employeeProfile?.phone || ""} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="color">Cor Identificadora (Calendário)</Label>
                        <div className="flex items-center gap-3">
                            <Input id="color" name="color" type="color" className="w-12 h-10 p-1 cursor-pointer" defaultValue={employee.employeeProfile?.color || "#10b981"} />
                            <span className="text-sm text-muted-foreground">Esta cor facilita a identificação rápida na agenda geral.</span>
                        </div>
                    </div>
                    <div className="space-y-3">
                        <Label>Regiões de Atendimento</Label>
                        <div className="grid grid-cols-2 gap-3 p-4 border rounded-lg bg-muted/20">
                            {['NORTH', 'SOUTH', 'EAST', 'WEST'].map((r) => (
                                <div key={r} className="flex items-center space-x-2">
                                    <input
                                        type="checkbox"
                                        id={`edit-region-${r}`}
                                        name="servedAreas"
                                        value={r}
                                        defaultChecked={employee.employeeProfile?.servedAreas.includes(r)}
                                        className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-600"
                                    />
                                    <label
                                        htmlFor={`edit-region-${r}`}
                                        className="text-sm font-medium leading-none"
                                    >
                                        {r}
                                    </label>
                                </div>
                            ))}
                        </div>
                        <p className="text-[10px] text-muted-foreground italic">Selecione as regiões onde este profissional atua.</p>
                    </div>
                    <Button type="submit" disabled={isLoading}>
                        {isLoading ? "Salvando..." : "Salvar Alterações"}
                    </Button>
                </form>
            </CardContent>
        </Card>
    );
}
