"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Play, Calendar, AlertCircle, CheckCircle2 } from "lucide-react";
import { runRecurringBillingJob } from "@/actions/run-recurring-billing";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

export function RecurringBillingManager() {
    const [isPending, setIsPending] = useState(false);
    const today = new Date();
    const billingDay = today.getDate();

    const handleRunBilling = async () => {
        if (!confirm(`Deseja processar o faturamento recorrente para clientes com dia de fechamento ${billingDay}?`)) return;

        setIsPending(true);
        try {
            const res = await runRecurringBillingJob();
            if (res.success) {
                toast.success(`Sucesso! ${res.invoicesGenerated} faturas geradas.`);
            } else {
                toast.error(res.error || "Falha ao processar.");
            }
        } catch (error) {
            toast.error("Erro inesperado.");
        } finally {
            setIsPending(false);
        }
    };

    return (
        <div className="space-y-6">
            <Card className="border-blue-100 bg-blue-50/30 dark:bg-blue-900/10 dark:border-blue-900/20">
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div className="space-y-1">
                            <CardTitle className="text-xl font-bold flex items-center gap-2">
                                <Calendar className="w-5 h-5 text-blue-500" />
                                Faturamento Automático
                            </CardTitle>
                            <CardDescription>
                                Processar faturas para clientes recorrentes com fechamento hoje.
                            </CardDescription>
                        </div>
                        <Badge variant="outline" className="bg-blue-100 text-blue-700 border-blue-200">
                            Dia de Hoje: {billingDay}
                        </Badge>
                    </div>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-start gap-4 p-4 rounded-lg bg-white dark:bg-zinc-900 border border-blue-100 dark:border-blue-900/30">
                        <AlertCircle className="w-5 h-5 text-blue-500 mt-0.5" />
                        <div className="text-sm space-y-2">
                            <p className="font-medium">Como funciona?</p>
                            <ul className="list-disc list-inside text-muted-foreground space-y-1">
                                <li>Busca agendamentos <strong>Concluídos</strong> ainda sem fatura.</li>
                                <li>Agrupa por cliente e gera uma <strong>Fatura Consolidada</strong>.</li>
                                <li>O vencimento é definido como a data de hoje.</li>
                            </ul>
                        </div>
                    </div>

                    <Button
                        onClick={handleRunBilling}
                        disabled={isPending}
                        className="w-full sm:w-auto font-bold gap-2"
                        size="lg"
                    >
                        {isPending ? (
                            "Processando..."
                        ) : (
                            <>
                                <Play className="w-4 h-4 fill-current" />
                                Disparar Ciclo de Faturamento
                            </>
                        )}
                    </Button>
                </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl border border-dashed flex flex-col items-center justify-center text-center space-y-2 py-8 opacity-60">
                    <div className="p-3 bg-zinc-100 rounded-full dark:bg-zinc-800">
                        <CheckCircle2 className="w-6 h-6 text-zinc-400" />
                    </div>
                    <div>
                        <p className="font-bold text-sm">Cron Job Ativado</p>
                        <p className="text-xs text-muted-foreground">O sistema roda este processo automaticamente às 04:00 AM.</p>
                    </div>
                </div>
                {/* Outros cards de configuração se necessário */}
            </div>
        </div>
    );
}
