"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Star, CheckCircle2, Loader2, Send } from "lucide-react";
import { confirmService } from "@/actions/confirm-service";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

interface ConfirmServiceFormProps {
    appointmentId: string;
}

export function ConfirmServiceForm({ appointmentId }: ConfirmServiceFormProps) {
    const [rating, setRating] = useState(0);
    const [hoveredRating, setHoveredRating] = useState(0);
    const [saving, setSaving] = useState(false);
    const [confirmed, setConfirmed] = useState(false);
    const router = useRouter();

    async function handleSubmit(formData: FormData) {
        if (rating === 0) {
            toast.error("Por favor, selecione uma avaliação.");
            return;
        }

        setSaving(true);
        try {
            formData.set("appointmentId", appointmentId);
            formData.set("rating", String(rating));
            const result = await confirmService(formData);
            if (result.error) {
                toast.error(result.error);
            } else {
                toast.success(result.success);
                setConfirmed(true);
                router.refresh();
            }
        } catch {
            toast.error("Erro ao confirmar.");
        } finally {
            setSaving(false);
        }
    }

    if (confirmed) {
        return (
            <Card className="border-2 border-emerald-200 shadow-sm bg-emerald-50/50">
                <CardContent className="p-6 text-center space-y-3">
                    <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto">
                        <CheckCircle2 className="w-8 h-8 text-emerald-600" />
                    </div>
                    <div>
                        <p className="font-bold text-emerald-900 text-lg">Serviço Confirmado!</p>
                        <p className="text-sm text-emerald-700">Obrigado pela sua avaliação.</p>
                    </div>
                    <div className="flex justify-center gap-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                                key={star}
                                className={cn(
                                    "w-6 h-6",
                                    star <= rating ? "text-amber-400 fill-amber-400" : "text-zinc-200"
                                )}
                            />
                        ))}
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="border-2 border-blue-200 shadow-md bg-gradient-to-b from-blue-50/80 to-white">
            <CardHeader className="pb-3">
                <CardTitle className="text-sm font-black uppercase tracking-widest text-blue-600 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4" />
                    Confirmar Serviço
                </CardTitle>
                <p className="text-sm text-zinc-500 mt-1">
                    O profissional finalizou o serviço. Confirme e avalie a qualidade do trabalho.
                </p>
            </CardHeader>
            <CardContent className="pb-6">
                <form action={handleSubmit} className="space-y-5">
                    {/* Star Rating */}
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Avaliação</label>
                        <div className="flex items-center gap-2 justify-center py-3">
                            {[1, 2, 3, 4, 5].map((star) => (
                                <button
                                    key={star}
                                    type="button"
                                    className="focus:outline-none transition-transform hover:scale-125 active:scale-95"
                                    onMouseEnter={() => setHoveredRating(star)}
                                    onMouseLeave={() => setHoveredRating(0)}
                                    onClick={() => setRating(star)}
                                >
                                    <Star
                                        className={cn(
                                            "w-10 h-10 transition-colors",
                                            star <= (hoveredRating || rating)
                                                ? "text-amber-400 fill-amber-400 drop-shadow-sm"
                                                : "text-zinc-200"
                                        )}
                                    />
                                </button>
                            ))}
                        </div>
                        {rating > 0 && (
                            <p className="text-center text-sm font-medium text-zinc-500">
                                {rating === 1 && "Ruim"}
                                {rating === 2 && "Regular"}
                                {rating === 3 && "Bom"}
                                {rating === 4 && "Muito Bom"}
                                {rating === 5 && "Excelente!"}
                            </p>
                        )}
                    </div>

                    {/* Comment */}
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">
                            Comentário <span className="text-zinc-300 font-normal">(opcional)</span>
                        </label>
                        <Textarea
                            name="comment"
                            placeholder="Como foi a experiência? O profissional foi pontual e atencioso?"
                            className="rounded-xl border-zinc-200 focus:border-blue-500 min-h-[80px] resize-none"
                        />
                    </div>

                    {/* Submit */}
                    <Button
                        type="submit"
                        disabled={saving || rating === 0}
                        className={cn(
                            "w-full h-14 text-lg font-black gap-3 rounded-2xl shadow-lg active:scale-[0.98] transition-all",
                            rating > 0
                                ? "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-200"
                                : "bg-zinc-300 cursor-not-allowed"
                        )}
                    >
                        {saving ? (
                            <><Loader2 className="w-5 h-5 animate-spin" /> Confirmando...</>
                        ) : (
                            <><Send className="w-5 h-5" /> Confirmar e Avaliar</>
                        )}
                    </Button>
                </form>
            </CardContent>
        </Card>
    );
}
