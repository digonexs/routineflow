import { useState, useEffect, useRef } from "react";
import { Reorder, useDragControls } from "framer-motion";
import { useApp, Task } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Plus,
  Trash2,
  Edit2,
  LayoutGrid,
  Check,
  ChevronDown,
  GripVertical,
} from "lucide-react";
import { cn } from "@/lib/utils";

const DAYS = [
  "Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"
];

type TaskCardProps = {
  task: Task;
  expandedTasks: Record<string, boolean>;
  toggleExpand: (id: string) => void;
  handleEdit: (task: Task) => void;
  handleEditSubtask: (task: Task, idx: number) => void;
  deleteTask: (id: string) => void;
  updateTask: (id: string, title: string, subtasks: string[]) => void;
  onDragEnd: () => void;
};

function TaskCard({ task, expandedTasks, toggleExpand, handleEdit, handleEditSubtask, deleteTask, updateTask, onDragEnd }: TaskCardProps) {
  const controls = useDragControls();

  return (
    <Reorder.Item value={task} dragListener={false} dragControls={controls} onDragEnd={onDragEnd} className="bg-card border rounded-lg overflow-hidden group hover:border-primary/50 transition-colors cursor-default">
      <div className="p-3 flex items-center justify-between bg-card">
        <div className="flex items-center gap-2">
          <div
            className="touch-none cursor-grab active:cursor-grabbing p-1 text-muted-foreground hover:text-primary"
            onPointerDown={(e) => controls.start(e)}
          >
            <GripVertical className="w-4 h-4" />
          </div>
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => task.subtasks.length > 0 && toggleExpand(task.id)}>
            {task.subtasks.length > 0 && (
              <ChevronDown className={cn("w-4 h-4 text-muted-foreground transition-transform", expandedTasks[task.id] && "rotate-180")} />
            )}
            <div>
              <p className="font-medium">{task.title}</p>
              {task.subtasks.length > 0 && (
                <p className="text-xs text-muted-foreground">{task.subtasks.length} subtarefas</p>
              )}
            </div>
          </div>
        </div>
        <div className="flex gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-primary hover:bg-primary/10"
            onClick={() => handleEdit(task)}
          >
            <Edit2 className="w-3.5 h-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-destructive hover:bg-destructive/10"
            onClick={() => deleteTask(task.id)}
          >
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>

      {expandedTasks[task.id] && task.subtasks.length > 0 && (
        <div className="bg-muted/30 border-t p-3 space-y-2">
          {task.subtasks.map((st, idx) => (
            <div key={st.id} className="flex items-center justify-between pl-7 py-1">
              <span className="text-sm text-muted-foreground">• {st.title}</span>
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-primary hover:bg-primary/10"
                  onClick={() => handleEditSubtask(task, idx)}
                >
                  <Edit2 className="w-3 h-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-destructive hover:bg-destructive/10"
                  onClick={() => {
                    const newSts = task.subtasks.filter(s => s.id !== st.id).map(s => s.title);
                    (updateTask as any)(task.id, task.title, newSts);
                  }}
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </Reorder.Item>
  );
}

export default function RoutineSetup() {
  const { tasks, addTask, updateTask, deleteTask, reorderTasks } = useApp();
  const [activeDay, setActiveDay] = useState("1");
  const [newTitle, setNewTitle] = useState("");
  const [subtasks, setSubtasks] = useState<string[]>([]);
  const [newSubtask, setNewSubtask] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingSubtaskIndex, setEditingSubtaskIndex] = useState<number | null>(null);
  const [expandedTasks, setExpandedTasks] = useState<Record<string, boolean>>({});

  const toggleExpand = (taskId: string) => {
    setExpandedTasks(prev => ({ ...prev, [taskId]: !prev[taskId] }));
  };

  const handleSaveTask = () => {
    if (!newTitle.trim()) return;
    
    if (editingId) {
      (updateTask as any)(editingId, newTitle, subtasks);
    } else {
      (addTask as any)(newTitle, parseInt(activeDay), subtasks);
    }
    
    resetForm();
  };

  const handleEdit = (task: Task) => {
    setEditingId(task.id);
    setNewTitle(task.title);
    setSubtasks(task.subtasks.map(s => s.title));
    setActiveDay(task.dayOfWeek.toString());
    setEditingSubtaskIndex(null);
  };

  const handleEditSubtask = (task: Task, index: number) => {
    setEditingId(task.id);
    setNewTitle(task.title);
    setSubtasks(task.subtasks.map(s => s.title));
    setNewSubtask(task.subtasks[index].title);
    setEditingSubtaskIndex(index);
    setActiveDay(task.dayOfWeek.toString());
  };

  const resetForm = () => {
    setEditingId(null);
    setEditingSubtaskIndex(null);
    setNewTitle("");
    setSubtasks([]);
    setNewSubtask("");
  };

  const handleAddOrUpdateSubtask = () => {
    if (!newSubtask) return;
    
    if (editingSubtaskIndex !== null) {
      const updated = [...subtasks];
      updated[editingSubtaskIndex] = newSubtask;
      setSubtasks(updated);
      setEditingSubtaskIndex(null);
    } else {
      setSubtasks([...subtasks, newSubtask]);
    }
    setNewSubtask("");
  };

  const dayKey = parseInt(activeDay);
  const storeDayTasks = tasks.filter((t: Task) => t.dayOfWeek === dayKey);

  const [localDayTasks, setLocalDayTasks] = useState<Task[]>(storeDayTasks);
  const localDayTasksRef = useRef(localDayTasks);

  useEffect(() => {
    setLocalDayTasks(storeDayTasks);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dayKey, storeDayTasks.length]);

  useEffect(() => {
    localDayTasksRef.current = localDayTasks;
  }, [localDayTasks]);

  const handleReorder = (newOrder: Task[]) => {
    setLocalDayTasks(newOrder);
  };

  const handleDragEnd = () => {
    reorderTasks(dayKey, localDayTasksRef.current.map(t => t.id));
  };

  return (
    <div className="space-y-6 pb-20 max-w-2xl mx-auto w-full px-4 pt-4 md:pt-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-heading font-bold">Configurar Rotina</h1>
      </div>

      <div className="space-y-2">
        <Label>Dia da Semana</Label>
        <Select value={activeDay} onValueChange={setActiveDay}>
          <SelectTrigger className="w-full bg-card h-12 text-base border-primary/20">
            <SelectValue placeholder="Selecione o dia" />
          </SelectTrigger>
          <SelectContent>
            {DAYS.map((day, idx) => (
              <SelectItem key={idx} value={idx.toString()}>{day}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Card className="border-primary/20 shadow-md">
        <CardHeader className="pb-3 border-b">
          <CardTitle className="text-lg">
            {editingId ? "Editar Tarefa" : "Nova Tarefa"} - {DAYS[parseInt(activeDay)]}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label>Título da Tarefa</Label>
            <Input 
              placeholder="Ex: Ir para a academia" 
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              className="bg-muted/30"
            />
          </div>

          <div className="space-y-3">
            <Label>{editingSubtaskIndex !== null ? "Editando Subtarefa" : "Subtarefas (Opcional)"}</Label>
            <div className="flex gap-2">
              <Input 
                placeholder="Ex: Treino de pernas" 
                value={newSubtask}
                onChange={(e) => setNewSubtask(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddOrUpdateSubtask())}
                className="bg-muted/30"
              />
              <Button 
                variant="secondary" 
                size="icon"
                onClick={handleAddOrUpdateSubtask}
              >
                {editingSubtaskIndex !== null ? <Check className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
              </Button>
            </div>

            {subtasks.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {subtasks.map((st, i) => (
                  <div 
                    key={i} 
                    className={cn(
                      "bg-primary/10 text-primary text-xs px-2 py-1 rounded-full flex items-center gap-1 border border-primary/20",
                      editingSubtaskIndex === i && "ring-2 ring-primary bg-primary/20"
                    )}
                  >
                    {st}
                    <button onClick={() => setSubtasks(subtasks.filter((_, idx) => idx !== i))}>
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex gap-2">
            {editingId && (
              <Button variant="outline" className="flex-1" onClick={resetForm}>
                Cancelar
              </Button>
            )}
            <Button className="flex-[2] gap-2" onClick={handleSaveTask}>
              {editingId ? <Check className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
              {editingId ? "Atualizar" : "Salvar"} Tarefa
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-3">
        <h3 className="font-heading font-semibold text-lg flex items-center gap-2">
          <LayoutGrid className="w-5 h-5 text-primary" />
          Tarefas em {DAYS[parseInt(activeDay)]}
        </h3>
        {localDayTasks.length === 0 ? (
          <p className="text-sm text-muted-foreground italic bg-muted/20 p-4 rounded-lg border border-dashed">
            Nenhuma tarefa cadastrada para este dia.
          </p>
        ) : (
          <Reorder.Group axis="y" values={localDayTasks} onReorder={handleReorder} className="space-y-3 list-none p-0">
            {localDayTasks.map((task: Task) => (
              <TaskCard
                key={task.id}
                task={task}
                expandedTasks={expandedTasks}
                toggleExpand={toggleExpand}
                handleEdit={handleEdit}
                handleEditSubtask={handleEditSubtask}
                deleteTask={deleteTask}
                updateTask={updateTask}
                onDragEnd={handleDragEnd}
              />
            ))}
          </Reorder.Group>
        )}
      </div>
    </div>
  );
}
