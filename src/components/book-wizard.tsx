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
import { CheckCircle, Calendar as CalendarIcon, User, MapPin, Clock, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { bookAppointment } from "@/actions/book-appointment";
import { useRouter } from "next/navigation";

// Tipos trazidos do Server Component
type Service = { id: string; name: string; description: string | null; price: number; durationMin: number };
type Employee = { id: string; user: { name: string | null }; color: string | null };

export default function BookWizard({
    services,
    employees,
    userAddress
}: {
    services: Service[],
    employees: Employee[],
    userAddress: string
}) {
    const [step, setStep] = useState(1);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");
    const router = useRouter();

    // Estado do Formulário
    const [selectedService, setSelectedService] = useState<Service | null>(null);
    const [selectedEmployee, setSelectedEmployee] = useState<string>("any");
    const [date, setDate] = useState<Date | undefined>(new Date());
    const [time, setTime] = useState<string>("");
    const [address, setAddress] = useState(userAddress);
    const [notes, setNotes] = useState("");

    const handleNext = () => {
        if (step === 1 && !selectedService) return;
        if (step === 3 && (!date || !time)) return;
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
                {[1, 2, 3, 4].map((s) => (
                    <div key={s} className="flex flex-col items-center">
                        <div className={cn(
                            "w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm transition-colors",
                            step >= s ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-400"
                        )}>
                            {s}
                        </div>
                        <span className="text-[10px] mt-1 text-gray-500 uppercase font-medium">
                            {s === 1 ? "Serviço" : s === 2 ? "Equipe" : s === 3 ? "Data" : "Revisão"}
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

                    {/* STEP 2: PROFISSIONAL */}
                    {step === 2 && (
                        <div className="space-y-4">
                            <h2 className="text-xl font-semibold">Prefere alguém específico?</h2>
                            <div className="grid grid-cols-2 gap-4">
                                <div
                                    onClick={() => setSelectedEmployee("any")}
                                    className={cn(
                                        "p-4 rounded-xl border-2 cursor-pointer transition-all flex flex-col items-center text-center gap-2",
                                        selectedEmployee === "any" ? "border-blue-600 bg-blue-50/50" : "border-gray-100 bg-white"
                                    )}
                                >
                                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-blue-600">
                                        <Clock className="w-6 h-6" />
                                    </div>
                                    <span className="font-medium text-sm">Qualquer disponível</span>
                                    <span className="text-[10px] text-gray-400">Mais rápido</span>
                                </div>
                                {employees.map(emp => (
                                    <div
                                        key={emp.id}
                                        onClick={() => setSelectedEmployee(emp.id)}
                                        className={cn(
                                            "p-4 rounded-xl border-2 cursor-pointer transition-all flex flex-col items-center text-center gap-2",
                                            selectedEmployee === emp.id ? "border-blue-600 bg-blue-50/50" : "border-gray-100 bg-white"
                                        )}
                                    >
                                        <div
                                            className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold"
                                            style={{ backgroundColor: emp.color || '#000' }}
                                        >
                                            {emp.user.name?.substring(0, 2).toUpperCase()}
                                        </div>
                                        <span className="font-medium text-sm">{emp.user.name}</span>
                                        <div className="flex items-center text-[10px] text-yellow-500">
                                            <Star className="w-3 h-3 fill-current" /> 4.9
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* STEP 3: DATA E HORA */}
                    {step === 3 && (
                        <div className="space-y-6">
                            <h2 className="text-xl font-semibold">Quando podemos ir?</h2>

                            <div className="flex flex-col md:flex-row gap-6">
                                <Calendar
                                    mode="single"
                                    selected={date}
                                    onSelect={setDate}
                                    className="rounded-md border mx-auto"
                                    locale={ptBR}
                                    disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                                />
                                <div className="flex-1">
                                    <h4 className="text-sm font-medium mb-3 text-muted-foreground">Horários Disponíveis</h4>
                                    <div className="grid grid-cols-3 gap-2">
                                        {hours.map(h => (
                                            <Button
                                                key={h}
                                                variant={time === h ? "default" : "outline"}
                                                size="sm"
                                                onClick={() => setTime(h)}
                                                className={cn(time === h && "bg-blue-600 hover:bg-blue-700")}
                                            >
                                                {h}
                                            </Button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="address">Endereço do Serviço</Label>
                                <div className="relative">
                                    <MapPin className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                                    <Input
                                        id="address"
                                        value={address}
                                        onChange={(e) => setAddress(e.target.value)}
                                        className="pl-9"
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* STEP 4: REVISÃO */}
                    {step === 4 && (
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
                                            às {time}
                                        </p>
                                    </div>

                                    <div>
                                        <p className="text-xs text-blue-600 uppercase font-bold mb-1">Profissional</p>
                                        <p className="text-sm font-medium flex items-center">
                                            <User className="w-4 h-4 mr-2 opacity-70" />
                                            {selectedEmployee === "any"
                                                ? "Qualquer disponível"
                                                : employees.find(e => e.id === selectedEmployee)?.user.name}
                                        </p>
                                    </div>
                                </div>

                                <div>
                                    <p className="text-xs text-blue-600 uppercase font-bold mb-1">Local</p>
                                    <p className="text-sm font-medium flex items-center">
                                        <MapPin className="w-4 h-4 mr-2 opacity-70" />
                                        {address}
                                    </p>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="notes">Observações (Opcional)</Label>
                                <Textarea
                                    id="notes"
                                    placeholder="Ex: Tem cachorro bravo, portão com defeito..."
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                />
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

                        {step < 4 ? (
                            <Button
                                onClick={handleNext}
                                disabled={
                                    (step === 1 && !selectedService) ||
                                    (step === 3 && (!date || !time || !address))
                                }
                                className="bg-blue-600 hover:bg-blue-700"
                            >
                                Próximo <ChevronRight className="w-4 h-4 ml-2" />
                            </Button>
                        ) : (
                            <Button
                                onClick={handleSubmit}
                                disabled={isLoading}
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
