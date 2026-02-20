import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight, Calculator, MapPin, ShieldCheck, Users } from "lucide-react";
import { APP_VERSION } from "@/lib/version";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background p-6">
      <div className="absolute inset-0 -z-10 h-full w-full bg-white bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:14px_24px] dark:bg-zinc-950">
        <div className="absolute left-0 right-0 top-0 -z-10 m-auto h-[310px] w-[310px] rounded-full bg-primary/20 opacity-20 blur-[100px]"></div>
      </div>

      <div className="z-10 max-w-5xl w-full text-center space-y-8">
        <div className="space-y-4">
          <h1 className="text-5xl font-extrabold tracking-tight lg:text-7xl bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/60">
            CleanRoute SaaS {APP_VERSION}
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Sistema de Gestão - Versão {APP_VERSION}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-8">
          <Card className="border-primary/10 hover:border-primary/30 transition-all hover:shadow-lg">
            <CardHeader>
              <Users className="w-10 h-10 text-primary mb-2" />
              <CardTitle>Área do Cliente</CardTitle>
              <CardDescription>Para contratantes de serviços</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="text-sm text-left space-y-2 mb-4 text-muted-foreground">
                <li className="flex items-center gap-2"><MapPin className="w-4 h-4" /> Live Tracking</li>
                <li className="flex items-center gap-2"><Calculator className="w-4 h-4" /> Orçamento Instantâneo</li>
              </ul>
              <a href="/login">
                <Button className="w-full group">
                  Acessar App <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
              </a>
            </CardContent>
          </Card>

          <Card className="border-primary/10 hover:border-primary/30 transition-all hover:shadow-lg bg-primary/5">
            <CardHeader>
              <ShieldCheck className="w-10 h-10 text-primary mb-2" />
              <CardTitle>Painel Admin</CardTitle>
              <CardDescription>Gestão completa do negócio</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="text-sm text-left space-y-2 mb-4 text-muted-foreground">
                <li className="flex items-center gap-2"><Users className="w-4 h-4" /> Gestão de Equipes</li>
                <li className="flex items-center gap-2"><Calculator className="w-4 h-4" /> Controle Financeiro</li>
              </ul>
              <a href="/login">
                <Button variant="default" className="w-full group">
                  Acessar Dashboard
                </Button>
              </a>
            </CardContent>
          </Card>

          <Card className="border-primary/10 hover:border-primary/30 transition-all hover:shadow-lg">
            <CardHeader>
              <Users className="w-10 h-10 text-primary mb-2" />
              <CardTitle>App do Cleaner</CardTitle>
              <CardDescription>Para funcionários em campo</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="text-sm text-left space-y-2 mb-4 text-muted-foreground">
                <li className="flex items-center gap-2"><ArrowRight className="w-4 h-4" /> Offline First</li>
                <li className="flex items-center gap-2"><MapPin className="w-4 h-4" /> Rota Inteligente</li>
              </ul>
              <a href="/login">
                <Button variant="outline" className="w-full group">
                  Acessar Rota <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
              </a>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}
