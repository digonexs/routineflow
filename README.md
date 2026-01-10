# RoutineFlow - Documentação Técnica

## 1. Visão Geral do Projeto

**RoutineFlow** é uma aplicação web mobile-first para rastreamento de hábitos e rotinas semanais. O app permite que usuários criem tarefas recorrentes para cada dia da semana, acompanhem seu progresso diário e visualizem sua consistência através de um mapa de calor interativo.

### Público-Alvo
- Pessoas que desejam organizar suas rotinas diárias
- Usuários que buscam construir hábitos duradouros
- Indivíduos que se motivam através de visualização de progresso

---

## 2. Funcionalidades Implementadas

### 2.1 Sistema de Autenticação
- **Cadastro de usuários**: Validação de nome (mínimo 3 caracteres), email e senha (mínimo 6 caracteres)
- **Login**: Verificação de credenciais com feedback visual via notificações toast
- **Logout**: Redirecionamento automático para a landing page
- **Persistência de sessão**: Usuário permanece logado até fazer logout manualmente
- **Dados isolados por usuário**: Cada conta possui suas próprias tarefas e histórico

### 2.2 Gerenciamento de Tarefas (Página "Configurar Rotina")
- **Criação de tarefas**: Associadas a dias específicos da semana (Domingo a Sábado)
- **Subtarefas**: Cada tarefa pode conter múltiplas subtarefas
- **Edição**: Modificação de títulos e subtarefas existentes
- **Exclusão**: Remoção de tarefas com confirmação visual
- **Organização visual**: Tarefas agrupadas por dia da semana em abas

### 2.3 Dashboard Diário (Página "Sua Rotina")
- **Seleção de data**: Dropdowns separados para dia, mês e ano
- **Anos dinâmicos**: Exibe automaticamente 2 anos anteriores até 7 anos futuros
- **Lista de tarefas do dia**: Exibe apenas tarefas configuradas para o dia da semana selecionado
- **Checkboxes interativos**: Marcar/desmarcar tarefas e subtarefas
- **Lógica inteligente de conclusão**:
  - Marcar tarefa pai automaticamente marca todas as subtarefas
  - Completar todas as subtarefas automaticamente marca a tarefa pai
  - Desmarcar uma subtarefa desmarca a tarefa pai
- **Porcentagem de progresso**: Cálculo em tempo real baseado em tarefas e subtarefas concluídas
- **Mensagens motivacionais**: Frases dinâmicas baseadas no dia da semana

### 2.4 Histórico e Mapa de Calor (Página "Histórico")
- **Mapa de calor responsivo**:
  - Mobile: 49 dias (7 semanas)
  - Desktop: 364 dias (1 ano completo)
- **Atualização automática**: Novo quadrado adicionado a cada dia
- **Escala de cores**:
  - Cinza: 0% de conclusão
  - Azul claro (30%): Baixa conclusão
  - Azul médio (60%): Conclusão moderada
  - Azul intenso (100%): Alta conclusão
- **Tooltips interativos**: Data e porcentagem de conclusão ao passar o mouse
- **Legenda dos dias**: Indicadores de dia da semana (S, T, Q, Q, S, S, D)

### 2.5 Interface e Experiência do Usuário
- **Design mobile-first**: Otimizado para smartphones
- **Menu responsivo**: Sidebar no desktop, menu hambúrguer no mobile
- **Notificações toast**: Feedback visual para ações do usuário
- **Animações suaves**: Transições e micro-interações
- **Tema escuro**: Interface em tons escuros com azul elétrico como cor primária

---

## 3. Regras de Negócio

### 3.1 Autenticação
| Regra | Descrição |
|-------|-----------|
| RN01 | Email deve ser único no sistema |
| RN02 | Senha deve ter mínimo de 6 caracteres |
| RN03 | Nome é obrigatório e deve ter mínimo de 3 caracteres |
| RN04 | Credenciais inválidas exibem mensagem de erro específica |

### 3.2 Tarefas
| Regra | Descrição |
|-------|-----------|
| RN05 | Cada tarefa pertence a exatamente um dia da semana |
| RN06 | Tarefas podem ter zero ou mais subtarefas |
| RN07 | Título da tarefa é obrigatório |
| RN08 | Subtarefas são opcionais |

### 3.3 Conclusão de Tarefas
| Regra | Descrição |
|-------|-----------|
| RN09 | Marcar tarefa pai = marca todas as subtarefas |
| RN10 | Todas subtarefas marcadas = tarefa pai marcada automaticamente |
| RN11 | Desmarcar qualquer subtarefa = tarefa pai desmarcada |
| RN12 | Progresso diário = (itens concluídos / total de itens) × 100 |

### 3.4 Mapa de Calor
| Regra | Descrição |
|-------|-----------|
| RN13 | Cores baseadas na porcentagem de conclusão do dia |
| RN14 | Dias sem tarefas configuradas = 0% (cinza) |
| RN15 | Mapa exibe janela móvel a partir da data atual |

---

## 4. Arquitetura da Aplicação

### 4.1 Estrutura de Diretórios
```
client/
├── src/
│   ├── components/
│   │   ├── ui/              # Componentes base (shadcn/ui)
│   │   ├── layout.tsx       # Layout principal com navegação
│   │   └── heatmap.tsx      # Componente do mapa de calor
│   ├── pages/
│   │   ├── landing.tsx      # Página inicial pública
│   │   ├── auth.tsx         # Login e cadastro
│   │   ├── dashboard.tsx    # Página "Sua Rotina"
│   │   ├── setup.tsx        # Página "Configurar Rotina"
│   │   └── analytics.tsx    # Página "Histórico"
│   ├── lib/
│   │   ├── store.tsx        # Context API - estado global
│   │   └── utils.ts         # Funções utilitárias
│   ├── hooks/
│   │   └── use-toast.ts     # Hook para notificações
│   └── App.tsx              # Rotas da aplicação
├── index.html
└── index.css                # Estilos globais e Tailwind
```

### 4.2 Padrão de Estado
A aplicação utiliza **React Context API** para gerenciamento de estado global:

```typescript
AppContext {
  user: User | null           // Usuário logado
  tasks: Task[]               // Lista de tarefas
  logs: Record<string, Record<string, boolean>>  // Histórico de conclusões
  
  // Ações
  login(name, email): void
  logout(): void
  addTask(title, dayOfWeek, subtasks): void
  updateTask(taskId, title, subtasks): void
  deleteTask(taskId): void
  toggleTask(date, taskId): void
  getDailyProgress(date): number
  getTaskStatus(date, taskId): boolean
}
```

### 4.3 Modelo de Dados

#### User
```typescript
{
  id: string
  name: string
  email: string
}
```

#### Task
```typescript
{
  id: string
  title: string
  dayOfWeek: number  // 0 = Domingo, 6 = Sábado
  subtasks: SubTask[]
}
```

#### SubTask
```typescript
{
  id: string
  title: string
}
```

### 4.4 Persistência
Atualmente, os dados são persistidos no **localStorage** do navegador:
- `routineflow_user` - Dados do usuário logado
- `routineflow_registered_users` - Lista de usuários cadastrados
- `routineflow_tasks_{email}` - Tarefas do usuário
- `routineflow_logs_{email}` - Histórico de conclusões do usuário

---

## 5. Stack Tecnológica

### 5.1 Frontend
| Tecnologia | Versão | Propósito |
|------------|--------|-----------|
| React | 18.x | Biblioteca de UI |
| TypeScript | 5.x | Tipagem estática |
| Vite | 5.x | Build tool e dev server |
| Tailwind CSS | 3.x | Framework de estilos |
| Wouter | 3.x | Roteamento |
| React Hook Form | 7.x | Gerenciamento de formulários |
| Zod | 3.x | Validação de schemas |
| date-fns | 3.x | Manipulação de datas |
| Framer Motion | 11.x | Animações |
| Lucide React | 0.x | Ícones |

### 5.2 Componentes UI
| Biblioteca | Propósito |
|------------|-----------|
| shadcn/ui | Componentes base (Button, Card, Input, etc.) |
| Radix UI | Primitivos acessíveis |
| Sonner | Notificações toast |

### 5.3 Fontes
- **Outfit** - Headings (fonte display moderna)
- **Inter** - Body text (fonte legível)

---

## 6. Decisões Técnicas

### 6.1 Por que React Context ao invés de Redux?
- Aplicação de escopo pequeno/médio
- Menor complexidade e boilerplate
- Suficiente para o número de estados gerenciados
- Performance adequada para o caso de uso

### 6.2 Por que localStorage ao invés de backend?
- Protótipo/MVP inicial
- Zero configuração de infraestrutura
- Funcionamento offline
- Simplicidade de implementação

### 6.3 Por que Tailwind CSS?
- Desenvolvimento rápido com classes utilitárias
- Design system consistente
- Responsividade fácil de implementar
- Bundle otimizado (purge de classes não utilizadas)

### 6.4 Por que Wouter ao invés de React Router?
- Bundle menor (~1.5KB vs ~10KB)
- API mais simples
- Suficiente para rotas básicas da aplicação

### 6.5 Design Mobile-First
- Público-alvo acessa majoritariamente via smartphone
- CSS organizado de mobile para desktop
- Breakpoints: `md:` (768px+) para desktop

---

## 7. Dependências do Projeto

### 7.1 Dependências de Produção
```json
{
  "react": "^18.x",
  "react-dom": "^18.x",
  "wouter": "^3.x",
  "react-hook-form": "^7.x",
  "@hookform/resolvers": "^3.x",
  "zod": "^3.x",
  "date-fns": "^3.x",
  "framer-motion": "^11.x",
  "lucide-react": "^0.x",
  "class-variance-authority": "^0.x",
  "clsx": "^2.x",
  "tailwind-merge": "^2.x",
  "@radix-ui/react-*": "^1.x"
}
```

### 7.2 Dependências de Desenvolvimento
```json
{
  "typescript": "^5.x",
  "vite": "^5.x",
  "@vitejs/plugin-react": "^4.x",
  "tailwindcss": "^3.x",
  "autoprefixer": "^10.x",
  "postcss": "^8.x"
}
```

---

## 8. Navegação e Rotas

| Rota | Página | Acesso |
|------|--------|--------|
| `/` | Landing Page | Público |
| `/login` | Tela de Login | Público |
| `/register` | Tela de Cadastro | Público |
| `/dashboard` | Sua Rotina | Autenticado |
| `/analytics` | Histórico | Autenticado |
| `/setup` | Configurar Rotina | Autenticado |

---

## 9. Responsividade

### Breakpoints
- **Mobile**: < 768px (padrão)
- **Desktop**: >= 768px (`md:` prefix)

### Adaptações por Dispositivo
| Elemento | Mobile | Desktop |
|----------|--------|---------|
| Menu | Hambúrguer overlay | Sidebar fixa |
| Mapa de calor | 49 dias | 364 dias |
| Seletores de data | Empilhados verticalmente | Em linha horizontal |
| Cards de tarefas | Full width | Grid de 2-3 colunas |

---

## 10. Cores e Tema

### Paleta Principal
| Variável | Valor | Uso |
|----------|-------|-----|
| `--primary` | `217 91% 60%` | Azul elétrico - CTAs e destaques |
| `--background` | `222 47% 11%` | Fundo escuro |
| `--card` | `217 33% 17%` | Fundo de cards |
| `--muted` | `215 20% 65%` | Texto secundário |

---

## 11. Créditos

**Desenvolvido por:** Rodrigo Barros  
**LinkedIn:** [linkedin.com/in/rodrigocavalcantedebarros](https://www.linkedin.com/in/rodrigocavalcantedebarros/)

---

## 12. Limitações Atuais e Próximos Passos

### Limitações (Versão Protótipo)
- Dados armazenados localmente (não sincronizados entre dispositivos)
- Sem recuperação de senha
- Sem backup automático

### Evolução Sugerida (Full-Stack)
- [ ] Integração com PostgreSQL (Supabase)
- [ ] API REST para persistência
- [ ] Autenticação com JWT
- [ ] Sincronização entre dispositivos
- [ ] Recuperação de senha por email
- [ ] Notificações push
- [ ] Exportação de dados

---

*Documentação gerada em Janeiro de 2026*
*Versão do documento: 1.0*
