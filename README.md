# RoutineFlow

> Aplicação web mobile-first para rastreamento de hábitos e rotinas semanais.

**Produção:** [routineflow-sepia.vercel.app](https://routineflow-sepia.vercel.app/)

---

## Sumário

1. [Visão Geral](#1-visão-geral)
2. [Funcionalidades](#2-funcionalidades)
3. [Arquitetura](#3-arquitetura)
4. [Stack Tecnológica](#4-stack-tecnológica)
5. [Decisões Técnicas](#5-decisões-técnicas)
6. [Modelo de Dados](#6-modelo-de-dados)
7. [Regras de Negócio](#7-regras-de-negócio)
8. [Rotas da Aplicação](#8-rotas-da-aplicação)
9. [Responsividade e Design System](#9-responsividade-e-design-system)
10. [Como Executar Localmente](#10-como-executar-localmente)
11. [Variáveis de Ambiente](#11-variáveis-de-ambiente)
12. [Deploy](#12-deploy)
13. [Créditos](#13-créditos)

---

## 1. Visão Geral

**RoutineFlow** é uma SPA (Single Page Application) para gerenciamento de rotinas e hábitos pessoais. O usuário configura tarefas recorrentes por dia da semana e tarefas avulsas para datas específicas, marcando conclusões diariamente e visualizando sua consistência ao longo do tempo em um mapa de calor.

Toda a persistência é feita via Supabase (PostgreSQL + Auth), sem nenhum servidor próprio. O frontend é servido pelo Vercel.

---

## 2. Funcionalidades

### Autenticação
- Cadastro com nome, e-mail e senha
- Login com persistência de sessão via Supabase Auth (JWT)
- Logout com limpeza de estado local e redirecionamento automático
- Dados completamente isolados por usuário (Row Level Security no Supabase)

### Configurar Rotina — tarefas recorrentes
- Criar tarefas associadas a um dia fixo da semana (0 = Domingo … 6 = Sábado)
- Adicionar, editar e remover subtarefas por tarefa
- Reordenar tarefas via drag-and-drop (posição persistida no banco)
- Editar título e subtarefas de tarefas existentes
- Excluir tarefas

### Dashboard Diário
- Seletor de data independente (dia, mês e ano via dropdowns)
- Exibe tarefas recorrentes do dia da semana correspondente à data selecionada
- Exibe tarefas avulsas criadas para aquela data exata
- Criar, editar e excluir tarefas avulsas diretamente no dashboard
- Checkboxes com lógica hierárquica:
  - Marcar a tarefa pai → todas as subtarefas são marcadas
  - Completar todas as subtarefas → pai é marcado automaticamente
  - Desmarcar qualquer subtarefa → pai é desmarcado
- Barra de progresso por tarefa (% de subtarefas concluídas)
- Percentual de sucesso do dia em tempo real
- Mensagem motivacional por dia da semana
- Animações de entrada e saída com Framer Motion

### Histórico — Mapa de Calor
- **Mobile:** 49 dias (7 semanas)
- **Desktop:** 364 dias (1 ano)
- Escala de cores pela % de conclusão do dia (cinza → azul claro → azul médio → azul intenso)
- Tooltip com data e percentual ao passar o cursor
- Legenda de dias da semana

---

## 3. Arquitetura

### Fluxo de entrada

```
main.tsx
  └── App.tsx
        └── QueryClientProvider
              └── AppProvider  (React Context — estado global)
                    └── TooltipProvider
                          └── Router (Wouter)
                                ├── /               → landing.tsx
                                ├── /login          → auth.tsx
                                ├── /register       → auth.tsx
                                ├── /dashboard      → dashboard.tsx  [protegida]
                                ├── /setup          → setup.tsx      [protegida]
                                └── /analytics      → analytics.tsx  [protegida]
```

Rotas protegidas são envolvidas por `ProtectedRoute`, que redireciona para `/login` quando não há sessão ativa.

### Estrutura de diretórios

```
routineflow/
├── client/
│   ├── index.html
│   └── src/
│       ├── App.tsx                  # Roteamento e proteção de rotas
│       ├── main.tsx                 # Entry point — ReactDOM.createRoot
│       ├── index.css                # Variáveis CSS + tema Tailwind v4
│       ├── components/
│       │   ├── ui/                  # 12 componentes shadcn/ui (apenas os utilizados)
│       │   │   ├── button.tsx
│       │   │   ├── calendar.tsx
│       │   │   ├── card.tsx
│       │   │   ├── dialog.tsx
│       │   │   ├── input.tsx
│       │   │   ├── label.tsx
│       │   │   ├── popover.tsx
│       │   │   ├── progress.tsx
│       │   │   ├── select.tsx
│       │   │   ├── toast.tsx
│       │   │   ├── toaster.tsx
│       │   │   └── tooltip.tsx
│       │   ├── layout.tsx           # Shell da aplicação: sidebar (desktop) + menu hambúrguer (mobile)
│       │   └── heatmap.tsx          # Mapa de calor interativo com tooltip
│       ├── pages/
│       │   ├── landing.tsx          # Página pública com hero + features
│       │   ├── auth.tsx             # Login e cadastro (componente único, controlado pela prop `type`)
│       │   ├── dashboard.tsx        # Rastreamento diário — tarefas recorrentes e avulsas
│       │   ├── setup.tsx            # Configuração da rotina semanal com drag-and-drop
│       │   ├── analytics.tsx        # Histórico e mapa de calor
│       │   └── not-found.tsx        # Página 404
│       ├── lib/
│       │   ├── store.tsx            # AppContext — todo o estado e lógica de negócio
│       │   ├── supabase.ts          # Inicialização do cliente Supabase
│       │   ├── queryClient.ts       # Configuração do TanStack Query (instância global)
│       │   └── utils.ts             # Helper `cn` (clsx + tailwind-merge)
│       └── hooks/
│           └── use-toast.ts         # Sistema de notificações toast (estado externo)
├── attached_assets/
│   └── generated_images/
│       └── minimalist_blue_abstract_habit_tracker_logo.png
├── package.json
├── tsconfig.json
├── vite.config.ts
├── postcss.config.js
└── vercel.json
```

### Gerenciamento de estado

Todo o estado da aplicação vive no `AppProvider` ([client/src/lib/store.tsx](client/src/lib/store.tsx)), exposto via `useApp()`. As páginas consomem apenas o que precisam — nenhuma lógica de negócio fica fora do store.

O contexto sincroniza com o Supabase Auth via `onAuthStateChange` e carrega os dados do banco quando o `userId` muda.

```typescript
type AppContextType = {
  // Estado
  user: User | null
  tasks: Task[]            // tarefas recorrentes (por dia da semana)
  dailyTasks: DailyTask[]  // tarefas avulsas (por data específica)
  logs: Record<string, Record<string, boolean>>  // date → { itemId: done }

  // Auth
  logout(): void

  // Tarefas recorrentes
  addTask(title, dayOfWeek, subtasks?): Promise<void>
  updateTask(taskId, title, subtasks): Promise<void>
  deleteTask(taskId): Promise<void>
  reorderTasks(dayOfWeek, orderedIds): Promise<void>

  // Tarefas avulsas
  addDailyTask(title, date, subtasks?): Promise<void>
  updateDailyTask(taskId, title, subtasks): Promise<void>
  deleteDailyTask(taskId): Promise<void>

  // Rastreamento
  toggleTask(date, itemId): Promise<void>
  getDailyProgress(date): number
  getTaskStatus(date, itemId): boolean
  getDailyTasksForDate(date): DailyTask[]
}
```

### Backend — Supabase

Sem servidor próprio. Toda a persistência usa o SDK do Supabase direto do cliente.

| Tabela | Descrição |
|---|---|
| `users` | Gerenciada pelo Supabase Auth |
| `tasks` | Tarefas recorrentes — `user_id`, `title`, `day_of_week`, `position` |
| `task_subtasks` | Subtarefas de tarefas recorrentes — `task_id`, `title` |
| `daily_tasks` | Tarefas avulsas — `user_id`, `title`, `date` |
| `daily_subtasks` | Subtarefas de tarefas avulsas — `daily_task_id`, `title` |
| `checks` | Log de conclusões — `user_id`, `date`, `item_id`, `done` (unique: user_id + date + item_id) |

---

## 4. Stack Tecnológica

### Core

| Tecnologia | Versão | Propósito |
|---|---|---|
| React | 19.2.0 | Biblioteca de UI |
| TypeScript | 5.6.3 | Tipagem estática |
| Vite | 7.1.9 | Build tool e dev server |

### Roteamento e Estado

| Tecnologia | Versão | Propósito |
|---|---|---|
| Wouter | 3.3.5 | Roteamento leve no cliente (~1.5 KB) |
| React Context API | — | Estado global da aplicação |
| TanStack React Query | 5.60.5 | Instância de QueryClient (disponível para uso futuro) |

### Backend as a Service

| Tecnologia | Versão | Propósito |
|---|---|---|
| Supabase JS | 2.90.1 | Auth (JWT) + banco PostgreSQL + RLS |

### UI e Estilos

| Tecnologia | Versão | Propósito |
|---|---|---|
| Tailwind CSS | 4.1.14 | Framework CSS utilitário via plugin Vite |
| shadcn/ui + Radix UI | — | 12 componentes acessíveis e sem estilo próprio |
| Framer Motion | 12.23.24 | Animações, transições e drag-and-drop (Reorder) |
| Lucide React | 0.545.0 | Ícones |
| react-day-picker | 9.11.1 | Componente de calendário |

### Formulários e Validação

| Tecnologia | Versão | Propósito |
|---|---|---|
| React Hook Form | 7.66.0 | Gerenciamento de formulários |
| Zod | 3.25.76 | Validação de schemas |
| @hookform/resolvers | 3.10.0 | Integração RHF + Zod |

### Utilitários

| Tecnologia | Versão | Propósito |
|---|---|---|
| date-fns | 3.6.0 | Formatação e manipulação de datas |
| clsx + tailwind-merge | — | Composição condicional de classes CSS |

### Tipografia

- **Outfit** — Headings (`font-heading`)
- **Inter** — Body text

---

## 5. Decisões Técnicas

### React Context API em vez de Zustand/Redux
O escopo de estado da aplicação é limitado: um usuário, suas tarefas e seus logs. O Context API é suficiente para essa carga e evita dependência extra. O `useMemo` no value do provider previne re-renders desnecessários.

### Supabase como BaaS
- PostgreSQL gerenciado sem configuração de servidor
- Auth com JWT integrado — sem precisar construir autenticação
- SDK JavaScript com tipagem completa
- Row Level Security para isolamento de dados por usuário
- Elimina a necessidade de uma API REST própria

### Wouter em vez de React Router
Bundle ~7× menor (1.5 KB vs ~10 KB). A API cobre todas as necessidades da aplicação: rotas simples, redirecionamento e guards via componente.

### Tailwind CSS v4
A v4 integra via plugin Vite, sem `tailwind.config.js` externo. Todo o design system (cores, fontes, raios) é definido como variáveis CSS no `index.css`, tornando o tema facilmente customizável sem tocar em JavaScript.

### Dois modelos de tarefa: `Task` e `DailyTask`
- **`Task`** — recorrente, atrelada a um `dayOfWeek` (0–6). Aparece toda vez que aquele dia da semana chegar.
- **`DailyTask`** — avulsa, atrelada a uma data exata (`YYYY-MM-DD`). Aparece apenas naquele dia.

Ambos contribuem igualmente para o cálculo de progresso, permitindo flexibilidade sem poluir a rotina semanal com exceções.

### Drag-and-drop com Framer Motion Reorder
A reordenação de tarefas usa `Reorder.Group` e `Reorder.Item` do Framer Motion. A ordem é persistida no banco na coluna `position` da tabela `tasks`, sendo carregada ordenada pelo servidor.

### Otimistic UI no `toggleTask`
A função `toggleTask` aplica a mudança localmente de forma imediata (`applyLocal`) e persiste no banco em seguida. O usuário vê o feedback visual instantâneo, sem esperar o round-trip ao Supabase.

### Carregamento de checks com janela de 120 dias
O histórico (`checks`) não é carregado infinitamente — apenas os últimos 120 dias. Isso mantém o payload inicial pequeno e é suficiente para o mapa de calor (máximo 364 dias configurável).

### SPA routing no Vercel
O `vercel.json` redireciona todas as rotas para `index.html`, permitindo que o Wouter gerencie a navegação no cliente sem erros 404 em refresh ou acesso direto por URL.

```json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}
```

---

## 6. Modelo de Dados

### Tipos TypeScript

```typescript
type SubTask = {
  id: string
  title: string
}

type Task = {
  id: string
  title: string
  dayOfWeek: number  // 0 = Domingo … 6 = Sábado
  subtasks: SubTask[]
}

type DailyTask = {
  id: string
  title: string
  date: string       // YYYY-MM-DD
  subtasks: SubTask[]
}

type User = {
  id: string         // UUID do Supabase Auth
  name: string
  email: string
}

// Espelhado na tabela `checks`
type Logs = Record<
  string,            // date (YYYY-MM-DD)
  Record<
    string,          // itemId (UUID de task ou subtask)
    boolean          // concluído?
  >
>
```

---

## 7. Regras de Negócio

### Autenticação

| ID | Regra |
|---|---|
| RN01 | E-mail deve ser único no sistema |
| RN02 | Senha com mínimo de 6 caracteres |
| RN03 | Nome obrigatório no cadastro (mínimo 3 caracteres) |
| RN04 | Sessão mantida até logout explícito |

### Tarefas

| ID | Regra |
|---|---|
| RN05 | Cada tarefa recorrente pertence a exatamente um dia da semana |
| RN06 | Tarefas avulsas pertencem a uma data específica (`YYYY-MM-DD`) |
| RN07 | Tarefas podem ter zero ou mais subtarefas |
| RN08 | Título da tarefa é obrigatório |
| RN09 | A posição das tarefas recorrentes é persistida no banco (coluna `position`) |

### Lógica de conclusão (hierárquica)

| ID | Regra |
|---|---|
| RN10 | Marcar tarefa pai → todas as subtarefas são marcadas |
| RN11 | Completar todas as subtarefas → tarefa pai marcada automaticamente |
| RN12 | Desmarcar qualquer subtarefa → tarefa pai desmarcada |
| RN13 | Progresso = (itens concluídos ÷ total de itens) × 100 |
| RN14 | Tarefas recorrentes e avulsas contribuem igualmente para o progresso do dia |

### Mapa de calor

| ID | Regra |
|---|---|
| RN15 | Dias sem tarefas configuradas exibem 0% (cinza) |
| RN16 | A janela exibida parte da data atual para o passado |
| RN17 | Checks carregados cobrem os últimos 120 dias |

---

## 8. Rotas da Aplicação

| Rota | Componente | Acesso |
|---|---|---|
| `/` | `landing.tsx` | Público |
| `/login` | `auth.tsx` (type="login") | Público — redireciona para `/dashboard` se logado |
| `/register` | `auth.tsx` (type="register") | Público — redireciona para `/dashboard` se logado |
| `/dashboard` | `dashboard.tsx` | Autenticado |
| `/setup` | `setup.tsx` | Autenticado |
| `/analytics` | `analytics.tsx` | Autenticado |
| `*` | `not-found.tsx` | Público |

---

## 9. Responsividade e Design System

### Breakpoints

| Faixa | Prefixo Tailwind | Comportamento |
|---|---|---|
| < 768 px | (padrão) | Mobile |
| ≥ 768 px | `md:` | Desktop |

### Adaptações por dispositivo

| Elemento | Mobile | Desktop |
|---|---|---|
| Navegação | Menu hambúrguer com overlay animado | Sidebar fixa de 256 px |
| Mapa de calor | 49 dias (7 semanas) | 364 dias (1 ano) |
| Seletor de data | Dropdowns em linha (flex-1) | Dropdowns com larguras fixas |
| Padding do conteúdo | `p-4`, `pt-16` (compensa header fixo) | `p-8`, `ml-64` (compensa sidebar) |

### Tema

O tema é definido inteiramente por variáveis CSS em [client/src/index.css](client/src/index.css) e consumido pelo Tailwind v4.

| Variável CSS | Uso |
|---|---|
| `--primary` | Azul elétrico — CTAs, destaques, checkboxes |
| `--background` | Fundo escuro da aplicação |
| `--card` | Fundo de cards e painéis |
| `--muted-foreground` | Texto secundário e placeholders |
| `--sidebar` / `--sidebar-border` | Cores exclusivas da sidebar |

### Escala do mapa de calor

| Conclusão | Classe Tailwind |
|---|---|
| 0% | `bg-muted` |
| 1–29% | `bg-primary/30` |
| 30–59% | `bg-primary/60` |
| 60–100% | `bg-primary` |

---

## 10. Como Executar Localmente

### Pré-requisitos

- **Node.js** 18 LTS ou superior
- **npm** 9+
- Projeto no [Supabase](https://supabase.com) com as tabelas criadas

### Setup das tabelas no Supabase

Execute no SQL Editor do Supabase:

```sql
create table tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  title text not null,
  day_of_week int not null,
  position int default 0,
  created_at timestamptz default now()
);

create table task_subtasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  task_id uuid references tasks on delete cascade not null,
  title text not null,
  created_at timestamptz default now()
);

create table daily_tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  title text not null,
  date date not null,
  created_at timestamptz default now()
);

create table daily_subtasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  daily_task_id uuid references daily_tasks on delete cascade not null,
  title text not null,
  created_at timestamptz default now()
);

create table checks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  date date not null,
  item_id uuid not null,
  done boolean default false,
  unique(user_id, date, item_id)
);

-- RLS
alter table tasks enable row level security;
alter table task_subtasks enable row level security;
alter table daily_tasks enable row level security;
alter table daily_subtasks enable row level security;
alter table checks enable row level security;

create policy "own tasks" on tasks for all using (auth.uid() = user_id);
create policy "own task_subtasks" on task_subtasks for all using (auth.uid() = user_id);
create policy "own daily_tasks" on daily_tasks for all using (auth.uid() = user_id);
create policy "own daily_subtasks" on daily_subtasks for all using (auth.uid() = user_id);
create policy "own checks" on checks for all using (auth.uid() = user_id);
```

### Passos

```bash
# 1. Clone o repositório
git clone <url-do-repositório>
cd routineflow

# 2. Instale as dependências
npm install

# 3. Configure as variáveis de ambiente
cp .env.example .env
# Edite .env com suas credenciais do Supabase

# 4. Inicie o servidor de desenvolvimento
npm run dev
# Disponível em http://localhost:5173
```

### Scripts disponíveis

| Comando | Descrição |
|---|---|
| `npm run dev` | Servidor de desenvolvimento com HMR |
| `npm run build` | Build de produção em `dist/` |
| `npm run preview` | Serve o build de produção localmente |
| `npm run check` | Checagem de tipos TypeScript sem emissão |

---

## 11. Variáveis de Ambiente

Crie um arquivo `.env` na raiz do projeto:

```env
VITE_SUPABASE_URL=https://<seu-projeto>.supabase.co
VITE_SUPABASE_ANON_KEY=<sua-anon-key>
```

Ambas encontradas no painel do Supabase em **Project Settings → API**.

> O prefixo `VITE_` é obrigatório para que o Vite exponha as variáveis ao bundle do cliente.

---

## 12. Deploy

A aplicação é publicada no **Vercel** com deploy contínuo a partir da branch `main`.

### Configuração no Vercel

1. Importe o repositório no painel do Vercel
2. Adicione as variáveis de ambiente: `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY`
3. O Vercel detecta automaticamente o Vite:
   - **Build command:** `npm run build`
   - **Output directory:** `dist`
   - **Root directory:** `.` (raiz do repositório)
4. O [vercel.json](vercel.json) garante que todas as rotas sejam redirecionadas para `index.html`

### Alias de paths (Vite)

| Alias | Resolve para |
|---|---|
| `@` | `client/src/` |
| `@assets` | `attached_assets/` |

---

## 13. Créditos

Desenvolvido por **Rodrigo Barros**

[linkedin.com/in/rodrigocavalcantedebarros](https://www.linkedin.com/in/rodrigocavalcantedebarros/)

---

*Última atualização: Março de 2026*
