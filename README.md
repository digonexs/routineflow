# RoutineFlow — Documentação Técnica

> Aplicação web mobile-first para rastreamento de hábitos e rotinas semanais.

---

## Sumário

1. [Visão Geral](#1-visão-geral)
2. [Demonstração](#2-demonstração)
3. [Funcionalidades](#3-funcionalidades)
4. [Arquitetura](#4-arquitetura)
5. [Stack Tecnológica](#5-stack-tecnológica)
6. [Decisões Técnicas](#6-decisões-técnicas)
7. [Modelo de Dados](#7-modelo-de-dados)
8. [Como Executar Localmente](#8-como-executar-localmente)
9. [Variáveis de Ambiente](#9-variáveis-de-ambiente)
10. [Deploy](#10-deploy)
11. [Rotas da Aplicação](#11-rotas-da-aplicação)
12. [Responsividade](#12-responsividade)
13. [Tema e Design System](#13-tema-e-design-system)
14. [Regras de Negócio](#14-regras-de-negócio)
15. [Créditos](#15-créditos)

---

## 1. Visão Geral

**RoutineFlow** é uma aplicação SPA (Single Page Application) que permite a usuários:

- Configurar tarefas recorrentes para cada dia da semana
- Criar tarefas avulsas para datas específicas
- Acompanhar a conclusão diária com checkboxes hierárquicos (tarefa + subtarefas)
- Visualizar a consistência ao longo do tempo em um mapa de calor interativo

### Público-alvo
- Pessoas que desejam organizar suas rotinas diárias
- Usuários que buscam construir hábitos duradouros
- Indivíduos motivados por visualização de progresso

---

## 2. Demonstração

A aplicação está publicada em produção via Vercel. Basta criar uma conta para começar a usar.

---

## 3. Funcionalidades

### 3.1 Autenticação
- Cadastro com nome, e-mail e senha (mínimo 6 caracteres)
- Login com persistência de sessão via Supabase Auth (JWT)
- Logout com limpeza de estado e redirecionamento automático
- Dados completamente isolados por usuário

### 3.2 Configurar Rotina (tarefas recorrentes)
- Criar tarefas associadas a um dia fixo da semana (Dom–Sáb)
- Adicionar múltiplas subtarefas por tarefa
- Editar título e subtarefas de tarefas existentes
- Excluir tarefas com feedback visual
- Interface em abas, uma por dia da semana

### 3.3 Dashboard Diário
- Seleção de qualquer data (dia, mês e ano independentes)
- Exibe tarefas recorrentes do dia da semana correspondente
- Exibe tarefas avulsas criadas para aquela data exata
- Checkboxes interativos com lógica hierárquica:
  - Marcar a tarefa pai marca todas as subtarefas
  - Completar todas as subtarefas marca o pai automaticamente
  - Desmarcar uma subtarefa desmarca o pai
- Porcentagem de progresso em tempo real
- Mensagens motivacionais por dia da semana

### 3.4 Histórico e Mapa de Calor
- Mapa de calor responsivo:
  - **Mobile:** 49 dias (7 semanas)
  - **Desktop:** 364 dias (1 ano completo)
- Escala de cores por porcentagem de conclusão:
  - Cinza → 0%
  - Azul claro → 1–29%
  - Azul médio → 30–59%
  - Azul intenso → 60–100%
- Tooltips com data e % ao passar o mouse
- Legenda de dias da semana (S T Q Q S S D)

### 3.5 Interface
- Design mobile-first
- Sidebar fixa no desktop / menu hambúrguer no mobile
- Tema escuro com azul elétrico como cor primária
- Animações via Framer Motion
- Notificações toast com feedback contextual

---

## 4. Arquitetura

### 4.1 Fluxo de dados

```
main.tsx
  └── App.tsx
        └── AppProvider (React Context)
              └── Router (Wouter)
                    ├── /               → landing.tsx
                    ├── /login          → auth.tsx
                    ├── /register       → auth.tsx
                    ├── /dashboard      → dashboard.tsx  (protegida)
                    ├── /setup          → setup.tsx      (protegida)
                    └── /analytics      → analytics.tsx  (protegida)
```

### 4.2 Estrutura de diretórios

```
Daily-Rhythm/
├── client/
│   ├── index.html
│   └── src/
│       ├── App.tsx                  # Definição de rotas e proteção
│       ├── main.tsx                 # Ponto de entrada React DOM
│       ├── index.css                # Estilos globais + tema Tailwind v4
│       ├── components/
│       │   ├── ui/                  # 57+ componentes shadcn/ui
│       │   ├── layout.tsx           # Shell da aplicação + navegação
│       │   └── heatmap.tsx          # Mapa de calor interativo
│       ├── pages/
│       │   ├── landing.tsx          # Página pública inicial
│       │   ├── auth.tsx             # Login e cadastro
│       │   ├── dashboard.tsx        # Rastreamento diário
│       │   ├── setup.tsx            # Configuração da rotina semanal
│       │   ├── analytics.tsx        # Histórico e mapa de calor
│       │   └── not-found.tsx        # Página 404
│       ├── lib/
│       │   ├── store.tsx            # Context API — estado global e lógica de negócio
│       │   ├── supabase.ts          # Inicialização do cliente Supabase
│       │   ├── queryClient.ts       # Configuração do TanStack Query
│       │   └── utils.ts             # Utilitários (cn helper)
│       └── hooks/
│           └── use-toast.ts         # Hook de notificações toast
├── attached_assets/                 # Assets e imagens do projeto
├── package.json
├── tsconfig.json
├── vite.config.ts
├── postcss.config.js
└── vercel.json                      # Configuração de SPA routing no Vercel
```

### 4.3 Gerenciamento de estado

O estado global é gerenciado via **React Context API** em [client/src/lib/store.tsx](client/src/lib/store.tsx). Toda a lógica de negócio (CRUD de tarefas, toggles, cálculo de progresso) reside no contexto, mantendo as páginas responsáveis apenas pela apresentação.

```typescript
// Interface do AppContext
{
  // Estado
  user: User | null
  tasks: Task[]           // Tarefas recorrentes (por dia da semana)
  dailyTasks: DailyTask[] // Tarefas avulsas (por data específica)
  logs: Record<string, Record<string, boolean>> // Histórico de conclusões

  // Autenticação
  login(email, password): Promise<void>
  logout(): Promise<void>

  // Tarefas recorrentes
  addTask(title, dayOfWeek, subtasks): Promise<void>
  updateTask(taskId, title, subtasks): Promise<void>
  deleteTask(taskId): Promise<void>

  // Tarefas avulsas
  addDailyTask(title, date, subtasks): Promise<void>
  updateDailyTask(taskId, title, subtasks): Promise<void>
  deleteDailyTask(taskId): Promise<void>

  // Rastreamento
  toggleTask(date, itemId): Promise<void>
  getDailyProgress(date): number
  getTaskStatus(date, itemId): boolean
  getDailyTasksForDate(date): DailyTask[]
}
```

### 4.4 Backend — Supabase

Toda a persistência é feita via **Supabase** (PostgreSQL gerenciado + Auth):

| Tabela | Descrição |
|---|---|
| `users` | Gerenciada pelo Supabase Auth |
| `tasks` | Tarefas recorrentes por dia da semana |
| `task_subtasks` | Subtarefas de tarefas recorrentes |
| `daily_tasks` | Tarefas avulsas por data específica |
| `daily_subtasks` | Subtarefas de tarefas avulsas |
| `checks` | Log de conclusões (user_id + date + item_id + done) |

---

## 5. Stack Tecnológica

### Core

| Tecnologia | Versão | Propósito |
|---|---|---|
| React | 19.2.0 | Biblioteca de UI |
| TypeScript | 5.6.3 | Tipagem estática |
| Vite | 7.1.9 | Build tool e dev server |

### Roteamento e Estado

| Tecnologia | Versão | Propósito |
|---|---|---|
| Wouter | 3.3.5 | Roteamento leve (~1.5 KB) |
| React Context API | — | Estado global da aplicação |
| TanStack React Query | 5.60.5 | Gerenciamento de estado servidor |

### Backend

| Tecnologia | Versão | Propósito |
|---|---|---|
| Supabase JS | 2.90.1 | Autenticação + banco de dados |

### UI e Estilos

| Tecnologia | Versão | Propósito |
|---|---|---|
| Tailwind CSS | 4.1.14 | Framework CSS utilitário |
| shadcn/ui + Radix UI | — | Componentes acessíveis |
| Framer Motion | 12.23.24 | Animações e transições |
| Lucide React | 0.545.0 | Ícones |
| Sonner | 2.0.7 | Notificações toast |

### Formulários e Validação

| Tecnologia | Versão | Propósito |
|---|---|---|
| React Hook Form | 7.66.0 | Gerenciamento de formulários |
| Zod | 3.25.76 | Validação de schemas |
| @hookform/resolvers | 3.10.0 | Integração RHF + Zod |

### Utilitários

| Tecnologia | Versão | Propósito |
|---|---|---|
| date-fns | 3.6.0 | Manipulação de datas |
| clsx + tailwind-merge | — | Composição de classes CSS |
| next-themes | 0.4.6 | Gerenciamento de tema |
| Recharts | 2.15.4 | Gráficos |

### Tipografia

- **Outfit** — Headings (fonte display moderna)
- **Inter** — Body text (alta legibilidade)

---

## 6. Decisões Técnicas

### React Context vs Redux
O escopo de estado da aplicação (usuário, tarefas, logs) não justifica a complexidade do Redux ou Zustand. O Context API é suficiente para o volume de re-renders e evita boilerplate desnecessário.

### Supabase como BaaS
- PostgreSQL gerenciado sem configuração de servidor
- Auth com JWT integrado nativamente
- SDK JavaScript com tipagem completa
- Tier gratuito adequado para o estágio atual do produto
- Elimina a necessidade de construir e manter uma API REST própria

### Wouter vs React Router
Bundle ~7x menor (1.5 KB vs ~10 KB). A API cobre todas as necessidades de roteamento desta aplicação (rotas simples, parâmetros, redirecionamento).

### Tailwind CSS v4
A versão 4 integra diretamente via plugin Vite, sem arquivo de configuração externo obrigatório. O sistema de design é definido inteiramente via variáveis CSS no [client/src/index.css](client/src/index.css), facilitando customizações de tema.

### Dois modelos de tarefa: `Task` e `DailyTask`
- **Task** — tarefa recorrente, amarrada a um dia da semana (ex: "Academia toda segunda")
- **DailyTask** — tarefa avulsa para uma data específica (ex: "Consulta médica em 15/03")

Ambos contribuem para o cálculo de progresso do dia, dando flexibilidade sem poluir a rotina semanal com exceções.

### SPA routing no Vercel
O [vercel.json](vercel.json) redireciona todas as rotas para `index.html`, permitindo que o Wouter gerencie a navegação no lado do cliente sem erros 404 em refresh ou acesso direto por URL.

```json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}
```

### Design Mobile-First
O CSS é escrito pensando em telas pequenas por padrão. Adaptações para desktop usam o prefixo `md:` (≥768 px). O componente de mapa de calor alterna entre 49 dias (mobile) e 364 dias (desktop) usando detecção de breakpoint via hook.

---

## 7. Modelo de Dados

### User
```typescript
{
  id: string        // UUID gerado pelo Supabase Auth
  name: string
  email: string
}
```

### Task (recorrente)
```typescript
{
  id: string
  title: string
  dayOfWeek: number  // 0 = Domingo ... 6 = Sábado
  subtasks: SubTask[]
}
```

### DailyTask (avulsa)
```typescript
{
  id: string
  title: string
  date: string       // formato YYYY-MM-DD
  subtasks: SubTask[]
}
```

### SubTask
```typescript
{
  id: string
  title: string
}
```

### Log de conclusões
```typescript
// Estrutura em memória (espelhada na tabela `checks` do Supabase)
logs: Record<
  string,          // date (YYYY-MM-DD)
  Record<
    string,        // itemId (task ou subtask)
    boolean        // concluído?
  >
>
```

---

## 8. Como Executar Localmente

### Pré-requisitos

- **Node.js** 18 LTS ou superior
- **npm** 9+ (incluso com o Node.js)
- Conta no [Supabase](https://supabase.com) com as tabelas configuradas

### Passos

```bash
# 1. Clone o repositório
git clone <url-do-repositório>
cd Daily-Rhythm

# 2. Instale as dependências
npm install

# 3. Configure as variáveis de ambiente (veja a seção 9)
cp .env.example .env
# Edite o .env com suas credenciais do Supabase

# 4. Inicie o servidor de desenvolvimento
npm run dev
# Disponível em http://localhost:5173
```

### Scripts disponíveis

| Comando | Descrição |
|---|---|
| `npm run dev` | Inicia o servidor de desenvolvimento com HMR |
| `npm run build` | Gera o build de produção em `dist/` |
| `npm run preview` | Serve o build de produção localmente |
| `npm run check` | Checagem de tipos TypeScript sem emissão de arquivos |

---

## 9. Variáveis de Ambiente

Crie um arquivo `.env` na raiz do projeto com as seguintes variáveis:

```env
VITE_SUPABASE_URL=https://<seu-projeto>.supabase.co
VITE_SUPABASE_ANON_KEY=<sua-anon-key>
```

Ambas as variáveis são encontradas no painel do Supabase em **Project Settings → API**.

> **Importante:** O prefixo `VITE_` é obrigatório para que o Vite exponha as variáveis ao código do cliente.

---

## 10. Deploy

A aplicação é publicada no **Vercel** com integração contínua a partir da branch `main`.

### Configuração no Vercel

1. Importe o repositório no painel do Vercel
2. Configure as variáveis de ambiente (`VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY`)
3. O Vercel detecta automaticamente o Vite; o comando de build é `npm run build` e o diretório de saída é `dist/`
4. O arquivo [vercel.json](vercel.json) garante que todas as rotas sejam redirecionadas para `index.html` (necessário para SPA)

---

## 11. Rotas da Aplicação

| Rota | Página | Acesso |
|---|---|---|
| `/` | Landing page | Público |
| `/login` | Login | Público |
| `/register` | Cadastro | Público |
| `/dashboard` | Rastreamento diário | Autenticado |
| `/setup` | Configurar rotina semanal | Autenticado |
| `/analytics` | Histórico e mapa de calor | Autenticado |

Rotas protegidas redirecionam para `/login` quando não há sessão ativa.

---

## 12. Responsividade

### Breakpoints

| Faixa | Prefixo Tailwind | Comportamento |
|---|---|---|
| < 768 px | (padrão) | Mobile |
| ≥ 768 px | `md:` | Desktop |

### Adaptações por dispositivo

| Elemento | Mobile | Desktop |
|---|---|---|
| Navegação | Menu hambúrguer (overlay) | Sidebar fixa lateral |
| Mapa de calor | 49 dias (7 semanas) | 364 dias (1 ano) |
| Seletor de data | Dropdowns empilhados | Dropdowns em linha |

---

## 13. Tema e Design System

O tema é definido como variáveis CSS em [client/src/index.css](client/src/index.css) e consumido pelo Tailwind v4.

### Paleta de cores principal

| Variável | Valor HSL | Uso |
|---|---|---|
| `--primary` | `217 91% 60%` | Azul elétrico — CTAs e destaques |
| `--background` | `222 47% 11%` | Fundo escuro da aplicação |
| `--card` | `217 33% 17%` | Fundo de cards e painéis |
| `--muted` | `215 20% 65%` | Texto secundário e placeholders |
| `--foreground` | `210 40% 98%` | Texto principal |

### Escala do mapa de calor

| Conclusão | Cor |
|---|---|
| 0% | Cinza neutro |
| 1–29% | Azul claro |
| 30–59% | Azul médio |
| 60–100% | Azul intenso |

---

## 14. Regras de Negócio

### Autenticação

| ID | Regra |
|---|---|
| RN01 | E-mail deve ser único no sistema |
| RN02 | Senha deve ter mínimo de 6 caracteres |
| RN03 | Nome é obrigatório (mínimo 3 caracteres) |
| RN04 | Sessão é mantida até logout explícito |

### Tarefas

| ID | Regra |
|---|---|
| RN05 | Cada tarefa recorrente pertence a exatamente um dia da semana |
| RN06 | Tarefas avulsas pertencem a uma data específica (YYYY-MM-DD) |
| RN07 | Tarefas podem ter zero ou mais subtarefas |
| RN08 | Título da tarefa é obrigatório |

### Lógica de conclusão

| ID | Regra |
|---|---|
| RN09 | Marcar tarefa pai → todas as subtarefas são marcadas |
| RN10 | Todas as subtarefas marcadas → tarefa pai marcada automaticamente |
| RN11 | Desmarcar qualquer subtarefa → tarefa pai desmarcada |
| RN12 | Progresso = (itens concluídos ÷ total de itens) × 100 |
| RN13 | Tarefas recorrentes e avulsas contribuem igualmente para o progresso |

### Mapa de calor

| ID | Regra |
|---|---|
| RN14 | Cores baseadas na porcentagem de conclusão do dia |
| RN15 | Dias sem tarefas configuradas exibem 0% (cinza) |
| RN16 | A janela exibida é calculada a partir da data atual para o passado |

---

## 15. Créditos

**Desenvolvido por:** Rodrigo Barros
**LinkedIn:** [linkedin.com/in/rodrigocavalcantedebarros](https://www.linkedin.com/in/rodrigocavalcantedebarros/)

---

*Documentação atualizada em Fevereiro de 2026 — Versão 2.0*
