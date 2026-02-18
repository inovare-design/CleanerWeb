"use client";

import * as z from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { FormError, FormSuccess } from "@/components/form-feedback";
import { login } from "@/actions/login";
import { Loader2 } from "lucide-react";

// Schema local igual ao do server action
const LoginSchema = z.object({
    email: z.string().email({ message: "Email inválido" }),
    password: z.string().min(1, { message: "Senha é obrigatória" }),
});

export default function LoginPage() {
    const [error, setError] = useState<string | undefined>("");
    const [success, setSuccess] = useState<string | undefined>("");
    const [isPending, startTransition] = useTransition();
    const router = useRouter();

    const form = useForm<z.infer<typeof LoginSchema>>({
        resolver: zodResolver(LoginSchema),
        defaultValues: {
            email: "",
            password: "",
        },
    });

    const onSubmit = (values: z.infer<typeof LoginSchema>) => {
        setError("");
        setSuccess("");

        startTransition(() => {
            login(values)
                .then((data) => {
                    if (data?.error) {
                        setError(data.error);
                    } else {
                        // Sucesso! Redirecionar.
                        // O redirecionamento real acontece no server action se não houver erro, 
                        // mas aqui podemos forçar ou mostrar sucesso.
                        // Para login com Auth.js, o redirect padrão é automático.
                        router.push('/admin');
                    }
                });
        });
    };

    return (
        <div className="flex h-screen items-center justify-center bg-gray-50 dark:bg-zinc-900">
            <Card className="w-[400px] shadow-md">
                <CardHeader>
                    <CardTitle className="text-2xl text-center">Login</CardTitle>
                    <CardDescription className="text-center">
                        Entre com suas credenciais
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Email</label>
                                <Input
                                    {...form.register("email")}
                                    disabled={isPending}
                                    placeholder="admin@cleanfast.com"
                                    type="email"
                                />
                                {form.formState.errors.email && (
                                    <p className="text-sm text-destructive">{form.formState.errors.email.message}</p>
                                )}
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Senha</label>
                                <Input
                                    {...form.register("password")}
                                    disabled={isPending}
                                    placeholder="******"
                                    type="password"
                                />
                                {form.formState.errors.password && (
                                    <p className="text-sm text-destructive">{form.formState.errors.password.message}</p>
                                )}
                            </div>
                        </div>

                        <FormError message={error} />
                        <FormSuccess message={success} />

                        <Button disabled={isPending} type="submit" className="w-full">
                            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Entrar
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
