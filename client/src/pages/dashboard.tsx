import { useState, useMemo } from "react";
import { useApp, DailyTask } from "@/lib/store";
import { format, addDays, startOfWeek, isSameDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "wouter";
import { 
  Check, 
  ChevronDown, 
  ChevronRight, 
  MoreVertical, 
  Calendar as CalendarIcon,
  Trophy,
  CalendarDays,
  Plus,
  Pencil,
  Trash2,
  X,
  Sparkles
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";

const MOTIVATIONAL_MESSAGES = [
  "Domingo é dia de planejar a semana e recarregar as energias para o que está por vir!",
  "Segunda-feira: Novo dia, nova semana, novas oportunidades de ser melhor do que ontem!",
  "Terça-feira: Mantenha o foco! A consistência de hoje é o resultado de amanhã.",
  "Quarta-feira: Você já chegou no meio da semana. Continue firme em direção aos seus objetivos!",
  "Quinta-feira: O sucesso é a soma de pequenos esforços repetidos dia após dia. Não pare agora!",
  "Sexta-feira: Termine a semana com orgulho de tudo o que você conquistou até aqui!",
  "Sábado: Aproveite o dia para cuidar de você e celebrar suas pequenas vitórias da semana."
];

export default function Dashboard() {
  const { 
    user, tasks, toggleTask, getTaskStatus, getDailyProgress,
    getDailyTasksForDate, addDailyTask, updateDailyTask, deleteDailyTask 
  } = useApp();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isAddingDailyTask, setIsAddingDailyTask] = useState(false);
  const [editingDailyTask, setEditingDailyTask] = useState<DailyTask | null>(null);
  const [dailyTaskTitle, setDailyTaskTitle] = useState("");
  const [dailySubtasks, setDailySubtasks] = useState<string[]>([]);
  const [newSubtask, setNewSubtask] = useState("");

  const dateStr = format(selectedDate, "yyyy-MM-dd");
  const dailyProgress = getDailyProgress(dateStr);
  const dateDailyTasks = getDailyTasksForDate(dateStr);

  const motivationalMessage = MOTIVATIONAL_MESSAGES[selectedDate.getDay()];

  const currentDayOfWeek = selectedDate.getDay();
  const todaysTasks = tasks.filter(t => t.dayOfWeek === currentDayOfWeek);

  const resetDailyTaskForm = () => {
    setDailyTaskTitle("");
    setDailySubtasks([]);
    setNewSubtask("");
    setIsAddingDailyTask(false);
    setEditingDailyTask(null);
  };

  const handleSaveDailyTask = () => {
    if (!dailyTaskTitle.trim()) {
      toast({ title: "Erro", description: "Digite um título para a tarefa.", variant: "destructive" });
      return;
    }
    
    if (editingDailyTask) {
      updateDailyTask(editingDailyTask.id, dailyTaskTitle, dailySubtasks.filter(s => s.trim()));
      toast({ title: "Tarefa atualizada", description: "Sua tarefa do dia foi editada com sucesso." });
    } else {
      addDailyTask(dailyTaskTitle, dateStr, dailySubtasks.filter(s => s.trim()));
      toast({ title: "Tarefa adicionada", description: "Nova tarefa do dia criada com sucesso." });
    }
    resetDailyTaskForm();
  };

  const handleEditDailyTask = (task: DailyTask) => {
    setEditingDailyTask(task);
    setDailyTaskTitle(task.title);
    setDailySubtasks(task.subtasks.map(st => st.title));
    setIsAddingDailyTask(true);
  };

  const handleDeleteDailyTask = (taskId: string) => {
    deleteDailyTask(taskId);
    toast({ title: "Tarefa removida", description: "A tarefa foi excluída com sucesso." });
  };

  const addSubtaskToList = () => {
    if (newSubtask.trim()) {
      setDailySubtasks([...dailySubtasks, newSubtask.trim()]);
      setNewSubtask("");
    }
  };

  const removeSubtaskFromList = (index: number) => {
    setDailySubtasks(dailySubtasks.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20 pt-4 md:pt-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 max-w-6xl mx-auto w-full">
        <div>
          <h1 className="text-3xl font-heading font-bold tracking-tight">
            Olá, {user?.name?.split(" ")[0]}! 👋
          </h1>
          <p className="text-muted-foreground mt-1">
            Hoje é <span className="capitalize text-foreground font-medium">{format(selectedDate, "EEEE, d 'de' MMMM", { locale: ptBR })}</span>
          </p>
        </div>

        <div className="bg-card border shadow-sm rounded-xl p-4 min-w-[200px] flex items-center gap-4">
          <div className="p-3 bg-primary/10 rounded-full text-primary">
            <Trophy className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Sucesso Hoje</p>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold font-heading">{dailyProgress}%</span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-center max-w-6xl mx-auto w-full gap-2 px-4">
        <div className="flex flex-1 md:flex-initial gap-2">
          <Select 
            value={format(selectedDate, "d")} 
            onValueChange={(val) => {
              const newDate = new Date(selectedDate);
              newDate.setDate(parseInt(val));
              setSelectedDate(newDate);
            }}
          >
            <SelectTrigger className="w-full md:w-24 bg-card border-primary/20">
              <SelectValue placeholder="Dia" />
            </SelectTrigger>
            <SelectContent className="max-h-[300px]">
              {Array.from({ length: 31 }, (_, i) => (
                <SelectItem key={i + 1} value={(i + 1).toString()}>
                  {i + 1}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select 
            value={format(selectedDate, "M")} 
            onValueChange={(val) => {
              const newDate = new Date(selectedDate);
              newDate.setMonth(parseInt(val) - 1);
              setSelectedDate(newDate);
            }}
          >
            <SelectTrigger className="w-full md:w-40 bg-card border-primary/20 capitalize">
              <SelectValue placeholder="Mês" />
            </SelectTrigger>
            <SelectContent className="max-h-[300px]">
              {Array.from({ length: 12 }, (_, i) => (
                <SelectItem key={i} value={(i + 1).toString()} className="capitalize">
                  {format(new Date(2024, i, 1), "MMMM", { locale: ptBR })}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select 
            value={format(selectedDate, "yyyy")} 
            onValueChange={(val) => {
              const newDate = new Date(selectedDate);
              newDate.setFullYear(parseInt(val));
              setSelectedDate(newDate);
            }}
          >
            <SelectTrigger className="w-full md:w-32 bg-card border-primary/20">
              <SelectValue placeholder="Ano" />
            </SelectTrigger>
            <SelectContent className="max-h-[300px]">
              {Array.from({ length: 10 }, (_, i) => {
                const year = new Date().getFullYear() - 2 + i;
                return (
                  <SelectItem key={year} value={year.toString()}>
                    {year}
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="max-w-6xl mx-auto w-full space-y-8">
        <div className="space-y-4">
           <h2 className="text-xl font-heading font-semibold flex items-center gap-2">
             <CalendarIcon className="w-5 h-5 text-primary" />
             Tarefas Recorrentes
           </h2>

           {todaysTasks.length === 0 ? (
             <div className="text-center py-8 bg-muted/30 rounded-2xl border border-dashed flex flex-col items-center">
               <p className="text-muted-foreground mb-4 text-sm">Nenhuma tarefa recorrente para este dia.</p>
               <Link href="/setup">
                 <Button variant="outline" size="sm" className="gap-2">
                   <Plus className="w-4 h-4" />
                   Configurar Rotina
                 </Button>
               </Link>
             </div>
           ) : (
             <div className="space-y-3">
               <AnimatePresence mode="popLayout">
                 {todaysTasks.map((task) => (
                   <TaskItem 
                     key={task.id} 
                     task={task} 
                     dateStr={dateStr}
                     toggleTask={toggleTask}
                     getTaskStatus={getTaskStatus}
                   />
                 ))}
               </AnimatePresence>
             </div>
           )}
        </div>

        <div className="space-y-4">
           <div className="flex items-center justify-between">
             <h2 className="text-xl font-heading font-semibold flex items-center gap-2">
               <Sparkles className="w-5 h-5 text-amber-500" />
               Tarefas do Dia
             </h2>
             <Button 
               size="sm" 
               className="gap-2"
               onClick={() => {
                 resetDailyTaskForm();
                 setIsAddingDailyTask(true);
               }}
             >
               <Plus className="w-4 h-4" />
               Adicionar
             </Button>
           </div>

           <AnimatePresence>
             {isAddingDailyTask && (
               <motion.div
                 initial={{ opacity: 0, height: 0 }}
                 animate={{ opacity: 1, height: "auto" }}
                 exit={{ opacity: 0, height: 0 }}
                 className="overflow-hidden"
               >
                 <div className="bg-card border rounded-xl p-4 space-y-4">
                   <div className="flex items-center justify-between">
                     <h3 className="font-medium text-sm">
                       {editingDailyTask ? "Editar Tarefa" : "Nova Tarefa do Dia"}
                     </h3>
                     <Button variant="ghost" size="icon" className="h-8 w-8" onClick={resetDailyTaskForm}>
                       <X className="w-4 h-4" />
                     </Button>
                   </div>
                   
                   <Input
                     placeholder="Título da tarefa"
                     value={dailyTaskTitle}
                     onChange={(e) => setDailyTaskTitle(e.target.value)}
                     className="bg-background"
                   />

                   <div className="space-y-2">
                     <p className="text-xs text-muted-foreground">Subtarefas (opcional)</p>
                     {dailySubtasks.map((st, idx) => (
                       <div key={idx} className="flex items-center gap-2">
                         <Input 
                           value={st} 
                           onChange={(e) => {
                             const updated = [...dailySubtasks];
                             updated[idx] = e.target.value;
                             setDailySubtasks(updated);
                           }}
                           className="bg-background text-sm h-9"
                         />
                         <Button variant="ghost" size="icon" className="h-9 w-9 shrink-0" onClick={() => removeSubtaskFromList(idx)}>
                           <Trash2 className="w-4 h-4 text-destructive" />
                         </Button>
                       </div>
                     ))}
                     <div className="flex gap-2">
                       <Input
                         placeholder="Adicionar subtarefa"
                         value={newSubtask}
                         onChange={(e) => setNewSubtask(e.target.value)}
                         onKeyDown={(e) => e.key === "Enter" && addSubtaskToList()}
                         className="bg-background text-sm h-9"
                       />
                       <Button variant="outline" size="sm" onClick={addSubtaskToList}>
                         <Plus className="w-4 h-4" />
                       </Button>
                     </div>
                   </div>

                   <div className="flex gap-2 pt-2">
                     <Button variant="outline" className="flex-1" onClick={resetDailyTaskForm}>
                       Cancelar
                     </Button>
                     <Button className="flex-1" onClick={handleSaveDailyTask}>
                       {editingDailyTask ? "Salvar" : "Adicionar"}
                     </Button>
                   </div>
                 </div>
               </motion.div>
             )}
           </AnimatePresence>

           {dateDailyTasks.length === 0 && !isAddingDailyTask ? (
             <div className="text-center py-6 bg-amber-500/5 rounded-xl border border-dashed border-amber-500/20">
               <p className="text-muted-foreground text-sm">
                 Nenhuma tarefa específica para este dia.
               </p>
               <p className="text-xs text-muted-foreground/70 mt-1">
                 Use o botão acima para adicionar tarefas pontuais.
               </p>
             </div>
           ) : (
             <div className="space-y-3">
               <AnimatePresence mode="popLayout">
                 {dateDailyTasks.map((task) => (
                   <DailyTaskItem 
                     key={task.id} 
                     task={task} 
                     dateStr={dateStr}
                     toggleTask={toggleTask}
                     getTaskStatus={getTaskStatus}
                     onEdit={() => handleEditDailyTask(task)}
                     onDelete={() => handleDeleteDailyTask(task.id)}
                   />
                 ))}
               </AnimatePresence>
             </div>
           )}
        </div>

        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border border-blue-100 dark:border-blue-900/30 rounded-xl p-6 mt-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <Trophy className="w-24 h-24 text-primary" />
          </div>
          <h3 className="font-heading font-semibold text-primary mb-2 relative z-10">Dica do dia</h3>
          <p className="text-sm text-muted-foreground italic relative z-10 leading-relaxed max-w-2xl">
            "{motivationalMessage}"
          </p>
        </div>
      </div>
    </div>
  );
}

function TaskItem({ task, dateStr, toggleTask, getTaskStatus }: any) {
  const isCompleted = getTaskStatus(dateStr, task.id);
  const [isOpen, setIsOpen] = useState(false);

  const subtasksCompletedCount = task.subtasks.reduce((acc: number, st: any) => {
    return acc + (getTaskStatus(dateStr, st.id) ? 1 : 0);
  }, 0);
  
  const totalSubtasks = task.subtasks.length;
  const progress = totalSubtasks > 0 ? (subtasksCompletedCount / totalSubtasks) * 100 : (isCompleted ? 100 : 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      layout
      className={cn(
        "bg-card border shadow-sm rounded-xl overflow-hidden transition-all duration-300 hover:shadow-md",
        isCompleted && "bg-muted/30 border-primary/20"
      )}
    >
      <div className="p-4 flex items-center gap-4">
        <button
          onClick={() => toggleTask(dateStr, task.id)}
          className={cn(
            "w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-300 shrink-0",
            isCompleted 
              ? "bg-primary border-primary text-white scale-110 shadow-sm shadow-primary/30" 
              : "border-muted-foreground/30 hover:border-primary/50"
          )}
        >
          {isCompleted && <Check className="w-3.5 h-3.5 stroke-[3px]" />}
        </button>

        <div className="flex-1 min-w-0 cursor-pointer" onClick={() => totalSubtasks > 0 && setIsOpen(!isOpen)}>
          <p className={cn(
            "font-medium text-base transition-all select-none",
            isCompleted && "text-muted-foreground line-through decoration-primary/30"
          )}>
            {task.title}
          </p>
          {totalSubtasks > 0 && (
             <div className="flex items-center gap-3 mt-1.5">
               <Progress value={progress} className="h-1.5 w-24 bg-muted-foreground/10" />
               <span className="text-xs text-muted-foreground font-medium">{subtasksCompletedCount}/{totalSubtasks}</span>
             </div>
          )}
        </div>

        {totalSubtasks > 0 && (
            <Button 
              variant="ghost" 
              size="sm" 
              className={cn("h-8 w-8 p-0 rounded-full hover:bg-muted", isOpen && "bg-muted")}
              onClick={() => setIsOpen(!isOpen)}
            >
              <ChevronDown className={cn("w-4 h-4 transition-transform duration-300", isOpen && "rotate-180")} />
            </Button>
        )}
      </div>

      <AnimatePresence>
        {totalSubtasks > 0 && isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
             <div className="bg-muted/30 px-4 pb-4 pt-1 space-y-2 border-t border-border/50">
               {task.subtasks.map((st: any) => {
                 const isStCompleted = getTaskStatus(dateStr, st.id);
                 return (
                   <div key={st.id} className="flex items-center gap-3 pl-10 py-1">
                      <button
                        onClick={() => toggleTask(dateStr, st.id)}
                        className={cn(
                          "w-4 h-4 rounded-sm border flex items-center justify-center transition-all shrink-0",
                          isStCompleted 
                            ? "bg-primary border-primary text-white" 
                            : "border-muted-foreground/30 hover:border-primary/50 bg-background"
                        )}
                      >
                        {isStCompleted && <Check className="w-3 h-3" />}
                      </button>
                      <span className={cn(
                        "text-sm transition-all select-none cursor-pointer",
                        isStCompleted && "text-muted-foreground line-through"
                      )} onClick={() => toggleTask(dateStr, st.id)}>
                        {st.title}
                      </span>
                   </div>
                 );
               })}
             </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function DailyTaskItem({ task, dateStr, toggleTask, getTaskStatus, onEdit, onDelete }: any) {
  const isCompleted = getTaskStatus(dateStr, task.id);
  const [isOpen, setIsOpen] = useState(false);

  const subtasksCompletedCount = task.subtasks.reduce((acc: number, st: any) => {
    return acc + (getTaskStatus(dateStr, st.id) ? 1 : 0);
  }, 0);
  
  const totalSubtasks = task.subtasks.length;
  const progress = totalSubtasks > 0 ? (subtasksCompletedCount / totalSubtasks) * 100 : (isCompleted ? 100 : 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      layout
      className={cn(
        "bg-amber-500/5 border border-amber-500/20 shadow-sm rounded-xl overflow-hidden transition-all duration-300 hover:shadow-md",
        isCompleted && "bg-muted/30 border-primary/20"
      )}
    >
      <div className="p-4 flex items-center gap-4">
        <button
          onClick={() => toggleTask(dateStr, task.id)}
          className={cn(
            "w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-300 shrink-0",
            isCompleted 
              ? "bg-primary border-primary text-white scale-110 shadow-sm shadow-primary/30" 
              : "border-amber-500/50 hover:border-primary/50"
          )}
        >
          {isCompleted && <Check className="w-3.5 h-3.5 stroke-[3px]" />}
        </button>

        <div className="flex-1 min-w-0 cursor-pointer" onClick={() => totalSubtasks > 0 && setIsOpen(!isOpen)}>
          <div className="flex items-center gap-2">
            <p className={cn(
              "font-medium text-base transition-all select-none",
              isCompleted && "text-muted-foreground line-through decoration-primary/30"
            )}>
              {task.title}
            </p>
            <span className="text-[10px] bg-amber-500/20 text-amber-600 dark:text-amber-400 px-1.5 py-0.5 rounded font-medium">
              HOJE
            </span>
          </div>
          {totalSubtasks > 0 && (
             <div className="flex items-center gap-3 mt-1.5">
               <Progress value={progress} className="h-1.5 w-24 bg-amber-500/10" />
               <span className="text-xs text-muted-foreground font-medium">{subtasksCompletedCount}/{totalSubtasks}</span>
             </div>
          )}
        </div>

        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onEdit}>
            <Pencil className="w-4 h-4 text-muted-foreground" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onDelete}>
            <Trash2 className="w-4 h-4 text-destructive" />
          </Button>
          {totalSubtasks > 0 && (
            <Button 
              variant="ghost" 
              size="sm" 
              className={cn("h-8 w-8 p-0 rounded-full hover:bg-muted", isOpen && "bg-muted")}
              onClick={() => setIsOpen(!isOpen)}
            >
              <ChevronDown className={cn("w-4 h-4 transition-transform duration-300", isOpen && "rotate-180")} />
            </Button>
          )}
        </div>
      </div>

      <AnimatePresence>
        {totalSubtasks > 0 && isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
             <div className="bg-muted/30 px-4 pb-4 pt-1 space-y-2 border-t border-border/50">
               {task.subtasks.map((st: any) => {
                 const isStCompleted = getTaskStatus(dateStr, st.id);
                 return (
                   <div key={st.id} className="flex items-center gap-3 pl-10 py-1">
                      <button
                        onClick={() => toggleTask(dateStr, st.id)}
                        className={cn(
                          "w-4 h-4 rounded-sm border flex items-center justify-center transition-all shrink-0",
                          isStCompleted 
                            ? "bg-primary border-primary text-white" 
                            : "border-muted-foreground/30 hover:border-primary/50 bg-background"
                        )}
                      >
                        {isStCompleted && <Check className="w-3 h-3" />}
                      </button>
                      <span className={cn(
                        "text-sm transition-all select-none cursor-pointer",
                        isStCompleted && "text-muted-foreground line-through"
                      )} onClick={() => toggleTask(dateStr, st.id)}>
                        {st.title}
                      </span>
                   </div>
                 );
               })}
             </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
