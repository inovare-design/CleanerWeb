"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CheckCircle, Calendar as CalendarIcon, User, MapPin, Clock, ChevronLeft, ChevronRight, Loader2, Star, AlertTriangle, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { bookAppointment } from "@/actions/book-appointment";
import { useRouter } from "next/navigation";
import { getStaffAvailability } from "@/actions/get-staff-availability";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// Tipos trazidos do Server Component
type Service = { id: string; name: string; description: string | null; price: number; durationMin: number };
type Employee = { id: string; user: { name: string | null }; color: string | null };

export default function BookWizard({
    services,
    employees,
    userAddress,
    userRegion,
    allRegions
}: {
    services: Service[],
    employees: Employee[],
    userAddress: string,
    userRegion: string,
    allRegions: string[]
}) {
    const [step, setStep] = useState(1);
    const [isLoading, setIsLoading] = useState(false);
    const [isFetchingStaff, setIsFetchingStaff] = useState(false);
    const [error, setError] = useState("");
    const router = useRouter();

    // Estado do Formulário
    const [selectedService, setSelectedService] = useState<Service | null>(null);
    const [selectedEmployee, setSelectedEmployee] = useState<string>("any");
    const [date, setDate] = useState<Date | undefined>(new Date());
    const [time, setTime] = useState<string>("");
    const [address, setAddress] = useState(userAddress);
    const [region, setRegion] = useState(userRegion);
    const [notes, setNotes] = useState("");
    const [warnings, setWarnings] = useState("");
    const [availableStaff, setAvailableStaff] = useState<any[]>([]);
    const [priorityAreas, setPriorityAreas] = useState("");
    const [customDuration, setCustomDuration] = useState("");
    const [agreedToTerms, setAgreedToTerms] = useState(false);

    const fetchStaff = async () => {
        if (!date || !region) return;
        setIsFetchingStaff(true);
        const result = await getStaffAvailability(date.toISOString().split('T')[0], region);
        if (result.staff) {
            setAvailableStaff(result.staff);
        }
        setIsFetchingStaff(false);
    };

    const handleNext = async () => {
        if (step === 1 && !selectedService) return;
        if (step === 2) {
            if (!date || !address || !region) return;
            await fetchStaff();
        }
        if (step === 3 && (!selectedEmployee || !time)) return;
        setStep(prev => prev + 1);
    };

    const handleBack = () => {
        setStep(prev => prev - 1);
    };

    const handleSubmit = async () => {
        setIsLoading(true);
        setError("");

        const formData = new FormData();
        formData.append("serviceId", selectedService!.id);
        formData.append("employeeId", selectedEmployee);
        formData.append("date", format(date!, "yyyy-MM-dd"));
        formData.append("time", time);
        formData.append("address", address);
        formData.append("notes", notes);
        formData.append("warnings", warnings);
        formData.append("region", region);
        formData.append("priorityAreas", priorityAreas);
        formData.append("customDuration", customDuration);
        formData.append("agreedToTerms", agreedToTerms ? "true" : "false");

        const result = await bookAppointment(formData);

        if (result.error) {
            setError(result.error);
            setIsLoading(false);
        } else {
            // Sucesso! Redirecionar
            router.push("/app?booked=true"); // Query param para exibir toast/confete
        }
    };

    const hours = ["08:00", "09:00", "10:00", "11:00", "13:00", "14:00", "15:00", "16:00", "17:00"];

    return (
        <div className="max-w-2xl mx-auto space-y-8">
            {/* Progress Steps */}
            <div className="flex justify-between items-center px-2">
                {[1, 2, 3, 4, 5].map((s) => (
                    <div key={s} className="flex flex-col items-center">
                        <div className={cn(
                            "w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm transition-colors",
                            step >= s ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-400"
                        )}>
                            {s}
                        </div>
                        <span className="text-[10px] mt-1 text-gray-500 uppercase font-medium text-center">
                            {s === 1 ? "Serviço" : s === 2 ? "Data / Local" : s === 3 ? "Equipe / Hora" : s === 4 ? "Detalhes" : "Revisão"}
                        </span>
                    </div>
                ))}
            </div>

            <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
                <CardContent className="p-6">
                    {/* STEP 1: SERVIÇO */}
                    {step === 1 && (
                        <div className="space-y-4">
                            <h2 className="text-xl font-semibold">Qual serviço você precisa?</h2>
                            <div className="grid gap-4">
                                {services.map(service => (
                                    <div
                                        key={service.id}
                                        onClick={() => setSelectedService(service)}
                                        className={cn(
                                            "p-4 rounded-xl border-2 cursor-pointer transition-all hover:border-blue-400 flex justify-between items-center group",
                                            selectedService?.id === service.id ? "border-blue-600 bg-blue-50/50" : "border-gray-100 bg-white"
                                        )}
                                    >
                                        <div>
                                            <h3 className="font-semibold text-gray-900">{service.name}</h3>
                                            <p className="text-sm text-gray-500">{service.description}</p>
                                        </div>
                                        <div className="text-right">
                                            <div className="font-bold text-blue-600">R$ {service.price.toFixed(2)}</div>
                                            <div className="text-xs text-gray-400">{service.durationMin} min</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* STEP 2: DATA E LOCAL */}
                    {step === 2 && (
                        <div className="space-y-6">
                            <h2 className="text-xl font-semibold text-center">Quando e onde?</h2>

                            <div className="flex flex-col md:flex-row gap-6 items-center md:items-start">
                                <div className="w-full bg-white rounded-xl border-0 md:border shadow-none md:shadow-sm p-1 md:p-4">
                                    <Calendar
                                        mode="single"
                                        selected={date}
                                        onSelect={setDate}
                                        className="w-full"
                                        locale={ptBR}
                                        disabled={(day) => day < new Date(new Date().setHours(0, 0, 0, 0))}
                                    />
                                </div>
                                <div className="flex-1 w-full space-y-6">
                                    <div className="space-y-4">
                                        <div className="p-4 rounded-xl bg-blue-50/50 border border-blue-100">
                                            <Label className="text-blue-600 font-bold uppercase text-[10px] tracking-widest block mb-2">Sua Região</Label>
                                            <div className="flex items-center justify-between">
                                                <span className="font-bold text-zinc-900">{region || "Não definida"}</span>
                                                <Button
                                                    variant="link"
                                                    className="h-auto p-0 text-blue-600 text-xs font-bold"
                                                    onClick={() => router.push('/app/profile')}
                                                >
                                                    Alterar no Perfil
                                                </Button>
                                            </div>
                                            <p className="text-[10px] text-muted-foreground mt-2">Mostraremos apenas os profissionais que atendem sua área.</p>
                                        </div>

                                        {!region && (
                                            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-[11px] text-amber-700 font-medium">
                                                Atenção: Você precisa definir sua região no perfil para ver profissionais disponíveis.
                                            </div>
                                        )}
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="address">Endereço Completo</Label>
                                        <div className="relative">
                                            <MapPin className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                                            <Input
                                                id="address"
                                                placeholder="Rua, Número, Complemento..."
                                                value={address}
                                                onChange={(e) => setAddress(e.target.value)}
                                                className="pl-9"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* STEP 3: EQUIPE E HORA */}
                    {step === 3 && (
                        <div className="space-y-6">
                            <div className="text-center space-y-1">
                                <h2 className="text-xl font-semibold">Escolha quem e quando</h2>
                                <p className="text-xs text-muted-foreground">Profissionais disponíveis em {region} em {date && format(date, "dd/MM")}</p>
                            </div>

                            {isFetchingStaff ? (
                                <div className="flex flex-col items-center justify-center py-12 space-y-4">
                                    <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                                    <p className="text-sm text-muted-foreground">Buscando profissionais disponíveis...</p>
                                </div>
                            ) : availableStaff.length === 0 ? (
                                <div className="text-center py-12 border-2 border-dashed rounded-xl space-y-2">
                                    <User className="w-8 h-8 mx-auto text-gray-300" />
                                    <p className="text-sm font-medium text-gray-500">Nenhum profissional disponível para esta data/região.</p>
                                    <Button variant="link" onClick={() => setStep(2)} className="text-blue-600">Tentar outra data ou área</Button>
                                </div>
                            ) : (
                                <div className="space-y-6">
                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                        {availableStaff.map(staff => (
                                            <div
                                                key={staff.id}
                                                onClick={() => {
                                                    setSelectedEmployee(staff.id);
                                                    setTime(""); // Reset time when staff changes
                                                }}
                                                className={cn(
                                                    "p-3 rounded-xl border-2 cursor-pointer transition-all flex flex-col items-center text-center gap-2",
                                                    selectedEmployee === staff.id ? "border-blue-600 bg-blue-50/50" : "border-gray-100 bg-white"
                                                )}
                                            >
                                                <div
                                                    className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm"
                                                    style={{ backgroundColor: staff.color || '#000' }}
                                                >
                                                    {staff.name.substring(0, 2).toUpperCase()}
                                                </div>
                                                <span className="font-medium text-xs truncate w-full">{staff.name}</span>
                                            </div>
                                        ))}
                                    </div>

                                    {selectedEmployee && (
                                        <div className="space-y-3 pt-4 border-t">
                                            <h4 className="text-sm font-semibold flex items-center gap-2">
                                                <Clock className="w-4 h-4 text-blue-600" />
                                                Horários Disponíveis
                                            </h4>
                                            <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                                                {/* Gerar slots baseado na workday e appointments do staff selecionado */}
                                                {(() => {
                                                    const staff = availableStaff.find(s => s.id === selectedEmployee);
                                                    if (!staff) return null;

                                                    // Gerar slots a cada 30 mins das 08:00 às 18:00 (simplificado para exemplo)
                                                    const slots = [];
                                                    for (let h = 8; h < 18; h++) {
                                                        const HH = h.toString().padStart(2, '0');
                                                        slots.push(`${HH}:00`, `${HH}:30`);
                                                    }

                                                    return slots.map(s => {
                                                        const isBooked = staff.booked.some((b: any) => s >= b.start && s < b.end);
                                                        return (
                                                            <Button
                                                                key={s}
                                                                variant={time === s ? "default" : "outline"}
                                                                size="sm"
                                                                disabled={isBooked}
                                                                onClick={() => setTime(s)}
                                                                className={cn(
                                                                    "h-8 text-[10px]",
                                                                    time === s && "bg-blue-600 hover:bg-blue-700",
                                                                    isBooked && "opacity-20 cursor-not-allowed bg-gray-50"
                                                                )}
                                                            >
                                                                {s}
                                                            </Button>
                                                        );
                                                    });
                                                })()}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}

                    {/* STEP 4: DETALHES ADICIONAIS */}
                    {step === 4 && (
                        <div className="space-y-6">
                            <h2 className="text-xl font-semibold">Detalhes do Atendimento</h2>

                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="duration">Quantas horas deseja contratar? (Opcional)</Label>
                                    <Input
                                        id="duration"
                                        type="number"
                                        min="1"
                                        max="24"
                                        placeholder={`Padrão: ${selectedService?.durationMin} min`}
                                        value={customDuration}
                                        onChange={(e) => setCustomDuration(e.target.value)}
                                    />
                                    <p className="text-[10px] text-muted-foreground italic">Deixe vazio para usar a duração padrão do serviço.</p>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="priority">Ranking de Prioridade (Quais locais limpar primeiro?)</Label>
                                    <Textarea
                                        id="priority"
                                        placeholder="Ex: 1. Cozinha, 2. Banheiros, 3. Quartos..."
                                        value={priorityAreas}
                                        onChange={(e) => setPriorityAreas(e.target.value)}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="warnings">Avisos e Cuidados Especiais</Label>
                                    <Textarea
                                        id="warnings"
                                        placeholder="Ex: Cuidado com o pet, o portão trava, não mexer na prataria..."
                                        value={warnings}
                                        onChange={(e) => setWarnings(e.target.value)}
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* STEP 5: REVISÃO */}
                    {step === 5 && (
                        <div className="space-y-6">
                            <h2 className="text-xl font-semibold text-center">Tudo certo?</h2>

                            <div className="bg-blue-50 p-6 rounded-2xl space-y-4">
                                <div className="flex justify-between items-center border-b border-blue-100 pb-4">
                                    <div>
                                        <p className="text-sm text-blue-600 font-medium">Serviço</p>
                                        <h3 className="font-bold text-lg">{selectedService?.name}</h3>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm text-blue-600 font-medium">Valor Estimado</p>
                                        <h3 className="font-bold text-lg">R$ {selectedService?.price.toFixed(2)}</h3>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-xs text-blue-600 uppercase font-bold mb-1">Data e Hora</p>
                                        <p className="text-sm font-medium flex items-center">
                                            <CalendarIcon className="w-4 h-4 mr-2 opacity-70" />
                                            {date && format(date, "dd 'de' MMMM", { locale: ptBR })}
                                        </p>
                                        <p className="text-sm text-muted-foreground ml-6">
                                            às {time} ({customDuration ? `${customDuration} horas` : `${selectedService?.durationMin} min`})
                                        </p>
                                    </div>

                                    <div>
                                        <p className="text-xs text-blue-600 uppercase font-bold mb-1">Profissional</p>
                                        <p className="text-sm font-medium flex items-center">
                                            <User className="w-4 h-4 mr-2 opacity-70" />
                                            {selectedEmployee === "any"
                                                ? "Qualquer disponível"
                                                : availableStaff.find(e => e.id === selectedEmployee)?.name || employees.find(e => e.id === selectedEmployee)?.user.name}
                                        </p>
                                    </div>
                                </div>

                                <div>
                                    <p className="text-xs text-blue-600 uppercase font-bold mb-1">Local & Região</p>
                                    <p className="text-sm font-medium flex items-center">
                                        <MapPin className="w-4 h-4 mr-2 opacity-70" />
                                        {address} ({region})
                                    </p>
                                </div>

                                {(priorityAreas || warnings || notes) && (
                                    <div className="pt-4 border-t border-blue-100 space-y-2">
                                        {priorityAreas && (
                                            <div>
                                                <p className="text-[10px] text-blue-600 uppercase font-bold">Prioridades</p>
                                                <p className="text-sm">{priorityAreas}</p>
                                            </div>
                                        )}
                                        {warnings && (
                                            <div>
                                                <p className="text-[10px] text-blue-600 uppercase font-bold">Cuidados</p>
                                                <p className="text-sm">{warnings}</p>
                                            </div>
                                        )}
                                        {notes && (
                                            <div>
                                                <p className="text-[10px] text-blue-600 uppercase font-bold">Notas Gerais</p>
                                                <p className="text-sm">{notes}</p>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="notes">Outras Observações (Opcional)</Label>
                                <Textarea
                                    id="notes"
                                    placeholder="Algo mais que queira nos dizer?"
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                />
                            </div>

                            {/* Cancellation Policy Agreement */}
                            <div className="bg-amber-50 border-2 border-amber-200 rounded-2xl p-5 space-y-3">
                                <div className="flex items-start gap-3">
                                    <AlertTriangle className="w-5 h-5 text-amber-500 mt-0.5 flex-shrink-0" />
                                    <div>
                                        <p className="font-bold text-amber-800 text-sm">Política de Cancelamento</p>
                                        <ul className="text-xs text-amber-700 mt-2 space-y-1.5 leading-relaxed">
                                            <li>• Cancelamentos devem ser feitos com <strong>no mínimo 24 horas</strong> de antecedência.</li>
                                            <li>• Cancelamentos com menos de 24h poderão ter cobrança parcial.</li>
                                            <li>• Reagendamentos estão sujeitos à disponibilidade da equipe.</li>
                                            <li>• Não comparecimento sem aviso prévio será considerado serviço prestado.</li>
                                        </ul>
                                    </div>
                                </div>
                                <label className={cn(
                                    "flex items-center gap-3 cursor-pointer p-3 rounded-xl border-2 transition-all",
                                    agreedToTerms ? "border-emerald-400 bg-emerald-50" : "border-amber-200 bg-white hover:border-amber-300"
                                )}>
                                    <input
                                        type="checkbox"
                                        checked={agreedToTerms}
                                        onChange={(e) => setAgreedToTerms(e.target.checked)}
                                        className="w-5 h-5 accent-emerald-600 rounded"
                                    />
                                    <span className={cn(
                                        "text-sm font-bold",
                                        agreedToTerms ? "text-emerald-700" : "text-zinc-600"
                                    )}>
                                        {agreedToTerms && <ShieldCheck className="w-4 h-4 inline mr-1" />}
                                        Li e concordo com a política de cancelamento
                                    </span>
                                </label>
                            </div>

                            {error && (
                                <div className="bg-red-100 text-red-600 p-3 rounded-md text-sm text-center">
                                    {error}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex justify-between mt-8 pt-4 border-t">
                        <Button
                            variant="ghost"
                            onClick={handleBack}
                            disabled={step === 1 || isLoading}
                            className="text-muted-foreground"
                        >
                            <ChevronLeft className="w-4 h-4 mr-2" /> Voltar
                        </Button>

                        {step < 5 ? (
                            <Button
                                onClick={handleNext}
                                disabled={
                                    (step === 1 && !selectedService) ||
                                    (step === 2 && (!date || !address || !region)) ||
                                    (step === 3 && (!selectedEmployee || !time)) ||
                                    isFetchingStaff
                                }
                                className="bg-blue-600 hover:bg-blue-700"
                            >
                                {isFetchingStaff ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                                Próximo <ChevronRight className="w-4 h-4 ml-2" />
                            </Button>
                        ) : (
                            <Button
                                onClick={handleSubmit}
                                disabled={isLoading || !agreedToTerms}
                                className="bg-green-600 hover:bg-green-700 w-full ml-4"
                            >
                                {isLoading ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Processando...
                                    </>
                                ) : (
                                    <>
                                        Confirmar Agendamento <CheckCircle className="w-4 h-4 ml-2" />
                                    </>
                                )}
                            </Button>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
