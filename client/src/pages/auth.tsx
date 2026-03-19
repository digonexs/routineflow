import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import logo from "@assets/generated_images/minimalist_blue_abstract_habit_tracker_logo.png";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";

const authSchema = z.object({
  email: z.string().email("Por favor, insira um email válido"),
  password: z.string().min(6, "A senha deve ter pelo menos 6 caracteres"),
  name: z
    .string()
    .min(3, "O nome é obrigatório e deve ter pelo menos 3 caracteres")
    .optional(),
});

type AuthForm = z.infer<typeof authSchema>;

export default function AuthPage({ type }: { type: "login" | "register" }) {
  const [_, setLocation] = useLocation();
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<AuthForm>({
    resolver: zodResolver(authSchema),
  });

  const onSubmit = async (data: AuthForm) => {
    setIsLoading(true);

    try {
      if (type === "register") {
        const { error } = await supabase.auth.signUp({
          email: data.email,
          password: data.password,
          options: {
            data: {
              name: data.name || "",
            },
          },
        });

        if (error) {
          toast({
            title: "Erro no cadastro",
            description: error.message,
            variant: "destructive",
          });
          return;
        }

        toast({
          title: "Cadastro realizado!",
          description: "Confira seu e-mail para confirmar o acesso.",
        });

        setLocation("/login");
        return;
      }

      const { error } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });

      if (error) {
        toast({
          title: "Erro de acesso",
          description: error.message,
          variant: "destructive",
        });
        return;
      }

      setLocation("/dashboard");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-muted/40">
      <header className="px-4 md:px-6 py-4 flex items-center justify-between border-b bg-background/80 backdrop-blur-md z-50">
        <Link
          href="/"
          className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity min-w-0"
        >
          <img src={logo} alt="RoutineFlow" className="w-8 h-8 rounded-lg shrink-0" />
          <span className="font-heading font-bold text-lg md:text-xl tracking-tight text-foreground truncate">
            RoutineFlow
          </span>
        </Link>
        <div className="flex items-center gap-2 md:gap-4 shrink-0">
          <Link href={type === "login" ? "/register" : "/login"}>
            <Button variant="ghost" size="sm" className="font-medium px-2 md:px-4">
              {type === "login" ? "Criar Conta" : "Entrar"}
            </Button>
          </Link>
        </div>
      </header>

      <div className="flex-1 flex items-center justify-center p-4">
        <Card className="w-full max-w-md border-border/50 shadow-xl">
          <CardHeader className="space-y-1 text-center pb-2">
            <CardTitle className="text-2xl font-bold">
              {type === "login" ? "Bem-vindo de volta" : "Crie sua conta"}
            </CardTitle>
            <CardDescription>
              {type === "login"
                ? "Entre com suas credenciais para acessar sua rotina"
                : "Comece a organizar sua vida hoje mesmo"}
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {type === "register" && (
                <div className="space-y-2">
                  <Label htmlFor="name" className="font-medium">
                    Nome
                  </Label>
                  <Input
                    id="name"
                    placeholder="Digite seu nome completo"
                    {...register("name")}
                    className={errors.name ? "border-destructive" : ""}
                  />
                  {errors.name && (
                    <span className="text-xs text-destructive font-medium flex items-center gap-1">
                      ⚠ {errors.name.message}
                    </span>
                  )}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="email" className="font-medium">
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  {...register("email")}
                  className={errors.email ? "border-destructive" : ""}
                />
                {errors.email && (
                  <span className="text-xs text-destructive font-medium flex items-center gap-1">
                    ⚠ {errors.email.message}
                  </span>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="font-medium">
                  Senha
                </Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Mínimo 6 caracteres"
                  {...register("password")}
                  className={errors.password ? "border-destructive" : ""}
                />
                {errors.password && (
                  <span className="text-xs text-destructive font-medium flex items-center gap-1">
                    ⚠ {errors.password.message}
                  </span>
                )}
              </div>

              <Button type="submit" className="w-full font-medium mt-2" disabled={isLoading}>
                {isLoading ? "Processando..." : type === "login" ? "Entrar" : "Criar Conta"}
              </Button>
            </form>
          </CardContent>

          <CardFooter className="flex justify-center border-t p-6">
            <p className="text-sm text-muted-foreground">
              {type === "login" ? "Não tem uma conta? " : "Já tem uma conta? "}
              <Link href={type === "login" ? "/register" : "/login"}>
                <span className="text-primary font-medium hover:underline cursor-pointer">
                  {type === "login" ? "Cadastre-se" : "Faça login"}
                </span>
              </Link>
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}