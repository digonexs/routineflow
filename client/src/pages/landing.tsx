import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { CheckCircle2, ArrowRight, BarChart3, Zap } from "lucide-react";
import logo from "@assets/generated_images/minimalist_blue_abstract_habit_tracker_logo.png";

export default function Landing() {
  return (
    <div className="min-h-screen flex flex-col bg-background font-sans selection:bg-primary/20">
      <header className="px-4 md:px-6 py-4 flex items-center justify-between border-b sticky top-0 bg-background/80 backdrop-blur-md z-50">
        <Link href="/" className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity min-w-0">
          <img src={logo} alt="RoutineFlow" className="w-8 h-8 rounded-lg shrink-0" />
          <span className="font-heading font-bold text-lg md:text-xl tracking-tight text-foreground truncate">RoutineFlow</span>
        </Link>
        <div className="flex items-center gap-2 md:gap-4 shrink-0">
          <Link href="/login">
            <Button variant="ghost" size="sm" className="font-medium px-2 md:px-4">Entrar</Button>
          </Link>
          <Link href="/register">
            <Button size="sm" className="font-medium px-3 md:px-4">Começar Agora</Button>
          </Link>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="px-6 py-24 md:py-32 max-w-6xl mx-auto flex flex-col items-center text-center space-y-8">
          <div className="bg-primary/10 text-primary px-4 py-1.5 rounded-full text-sm font-medium flex items-center gap-2 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <Zap className="w-4 h-4 fill-primary" /> Organização simplificada para sua vida
          </div>
          
          <h1 className="text-5xl md:text-7xl font-heading font-bold tracking-tight text-foreground animate-in fade-in slide-in-from-bottom-6 duration-700 delay-100 max-w-4xl">
            Domine sua rotina. <br/>
            <span className="text-primary bg-clip-text">Um dia de cada vez.</span>
          </h1>
          
          <p className="text-xl text-muted-foreground max-w-2xl animate-in fade-in slide-in-from-bottom-8 duration-700 delay-200">
            Crie hábitos duradouros, organize suas tarefas diárias e visualize seu progresso com nossa interface intuitiva e motivadora.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 pt-4 animate-in fade-in slide-in-from-bottom-10 duration-700 delay-300">
            <Link href="/register">
              <Button size="lg" className="h-14 px-8 text-lg gap-2 shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all">
                Criar Conta Grátis <ArrowRight className="w-5 h-5" />
              </Button>
            </Link>
            <Link href="/login">
              <Button variant="outline" size="lg" className="h-14 px-8 text-lg bg-background/50">
                Já tenho conta
              </Button>
            </Link>
          </div>
        </section>

        {/* Features Grid */}
        <section className="px-6 py-20 bg-secondary/30">
          <div className="max-w-6xl mx-auto grid md:grid-cols-3 gap-8">
            <div className="bg-card p-8 rounded-2xl shadow-sm border border-border/50 hover:border-primary/50 transition-colors group">
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center mb-6 text-primary group-hover:scale-110 transition-transform">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h3 className="font-heading font-semibold text-xl mb-3">Checklists Semanais</h3>
              <p className="text-muted-foreground leading-relaxed">
                Configure suas tarefas recorrentes para cada dia da semana. Segunda é dia de academia? Terça de leitura? Nós lembramos você.
              </p>
            </div>

            <div className="bg-card p-8 rounded-2xl shadow-sm border border-border/50 hover:border-primary/50 transition-colors group">
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-xl flex items-center justify-center mb-6 text-green-600 group-hover:scale-110 transition-transform">
                <BarChart3 className="w-6 h-6" />
              </div>
              <h3 className="font-heading font-semibold text-xl mb-3">Métricas de Sucesso</h3>
              <p className="text-muted-foreground leading-relaxed">
                Acompanhe sua porcentagem diária de sucesso. Subtarefas contam para o total, dando uma visão real do seu progresso.
              </p>
            </div>

            <div className="bg-card p-8 rounded-2xl shadow-sm border border-border/50 hover:border-primary/50 transition-colors group">
              <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-xl flex items-center justify-center mb-6 text-purple-600 group-hover:scale-110 transition-transform">
                <div className="grid grid-cols-3 gap-0.5 opacity-80">
                   {[...Array(9)].map((_, i) => (
                     <div key={i} className={`w-1.5 h-1.5 rounded-[1px] ${i % 2 === 0 ? 'bg-current' : 'bg-current/30'}`} />
                   ))}
                </div>
              </div>
              <h3 className="font-heading font-semibold text-xl mb-3">Mapa de Calor</h3>
              <p className="text-muted-foreground leading-relaxed">
                Visualize sua consistência com um mapa de calor interativo. Veja seus dias mais produtivos brilharem.
              </p>
            </div>
          </div>
        </section>
      </main>

      <footer className="py-8 text-center text-sm text-muted-foreground border-t">
        <p>&copy; 2026 RoutineFlow. Todos os direitos reservados.</p>
        <p className="mt-2">
          Desenvolvido por{" "}
          <a 
            href="https://www.linkedin.com/in/rodrigocavalcantedebarros/" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-primary hover:underline font-medium"
          >
            Rodrigo Barros
          </a>
        </p>
      </footer>
    </div>
  );
}
