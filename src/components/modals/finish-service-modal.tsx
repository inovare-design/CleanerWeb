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
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Camera, Loader2, CheckCircle2 } from "lucide-react";
import { uploadProofImages } from "@/actions/upload-images";
import { updateAppointmentStatus } from "@/actions/update-appointment-status";
import { finishAppointment } from "@/actions/finish-appointment";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

interface FinishServiceModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    appointmentId: string;
}

export function FinishServiceModal({ open, onOpenChange, appointmentId }: FinishServiceModalProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null);
    const [notes, setNotes] = useState("");
    const router = useRouter();

    async function handleFinish(event: React.FormEvent) {
        event.preventDefault();
        setIsLoading(true);

        try {
            let imageUrls: string[] = [];

            // 1. Upload das Imagens (se houver)
            if (selectedFiles && selectedFiles.length > 0) {
                const formData = new FormData();
                Array.from(selectedFiles).forEach(file => {
                    formData.append("images", file);
                });
                const uploadResult = await uploadProofImages(formData);
                imageUrls = uploadResult.urls || [];
            }

            // 2. Atualizar o Agendamento
            const result = await finishAppointment(appointmentId, imageUrls, notes);

            if (result.success) {
                toast.success("Serviço finalizado! Aguardando confirmação do cliente.");
                onOpenChange(false);
                router.refresh();
            } else {
                toast.error(result.error || "Erro ao finalizar serviço.");
            }
        } catch (error) {
            console.error("Erro no finish modal:", error);
            toast.error("Erro inesperado ao finalizar.");
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <form onSubmit={handleFinish}>
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                            Finalizar Serviço
                        </DialogTitle>
                        <DialogDescription>
                            Anexe fotos do trabalho feito e adicione observações finais.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="grid gap-6 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="images" className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                                <Camera className="w-4 h-4" /> Prova de Trabalho (Fotos)
                            </Label>
                            <input
                                id="images"
                                type="file"
                                multiple
                                accept="image/*"
                                className="w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-violet-50 file:text-violet-700 hover:file:bg-violet-100 cursor-pointer"
                                onChange={(e) => setSelectedFiles(e.target.files)}
                            />
                            {selectedFiles && (
                                <p className="text-xs text-muted-foreground italic">
                                    {selectedFiles.length} arquivo(s) selecionado(s).
                                </p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="notes" className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
                                Notas Finais (Opcional)
                            </Label>
                            <Textarea
                                id="notes"
                                placeholder="Ex: Chaves entregues ao porteiro, janelas fechadas..."
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                className="resize-none h-24"
                            />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button
                            type="submit"
                            disabled={isLoading}
                            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-12 shadow-md hover:shadow-lg transition-all"
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Finalizando...
                                </>
                            ) : (
                                "Concluir e Enviar para Aprovação"
                            )}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
