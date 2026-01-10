import { useApp } from "@/lib/store";
import { Heatmap } from "@/components/heatmap";
import { BarChart3 } from "lucide-react";

export default function Analytics() {
  const { user } = useApp();

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20 pt-4 md:pt-8 max-w-6xl mx-auto w-full">
      <div>
        <h1 className="text-3xl font-heading font-bold tracking-tight">Histórico</h1>
        <p className="text-muted-foreground mt-1">
          Visualize sua consistência e progresso ao longo do tempo
        </p>
      </div>

      <div className="bg-card border shadow-sm rounded-xl p-6">
        <h3 className="font-heading font-semibold text-lg mb-6 flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-primary" />
          Mapa de Consistência
        </h3>
        <p className="text-sm text-muted-foreground mb-6">
          Quanto mais escuro o azul, melhor foi seu desempenho naquele dia.
        </p>
        <Heatmap />
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <div className="bg-card border rounded-xl p-6">
          <h4 className="font-heading font-semibold mb-2">Quanto mais consistente</h4>
          <p className="text-sm text-muted-foreground">Melhor será sua performance ao longo dos meses e você atingirá seus objetivos.</p>
        </div>
        <div className="bg-card border rounded-xl p-6">
          <h4 className="font-heading font-semibold mb-2">Acompanhe os padrões</h4>
          <p className="text-sm text-muted-foreground">Identifique quais dias você tem melhor desempenho e otimize sua rotina.</p>
        </div>
        <div className="bg-card border rounded-xl p-6">
          <h4 className="font-heading font-semibold mb-2">Motivação visual</h4>
          <p className="text-sm text-muted-foreground">Não quebre a corrente! Quanto mais dias em sequência, maior o impacto nos seus hábitos.</p>
        </div>
      </div>
    </div>
  );
}
