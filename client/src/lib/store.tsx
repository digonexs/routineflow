import { createContext, useContext, useEffect, useMemo, useState, ReactNode } from "react";
import { supabase } from "@/lib/supabase";

// Types
export type SubTask = {
  id: string;
  title: string;
};

export type Task = {
  id: string;
  title: string;
  dayOfWeek: number; // 0..6
  subtasks: SubTask[];
};

export type DailyTask = {
  id: string;
  title: string;
  date: string; // YYYY-MM-DD
  subtasks: SubTask[];
};

export type User = {
  id: string;
  name: string;
  email: string;
};

export type AppState = {
  user: User | null;
  tasks: Task[];
  dailyTasks: DailyTask[];
  logs: Record<string, Record<string, boolean>>; // date -> { [itemId]: boolean }
};

type AppContextType = AppState & {
  login: (name: string, email: string) => void; // compat (auth real fica no auth.tsx)
  logout: () => void;

  addTask: (title: string, dayOfWeek: number, subtasks?: string[]) => void;
  updateTask: (taskId: string, title: string, subtasks: string[]) => void;
  deleteTask: (taskId: string) => void;

  addDailyTask: (title: string, date: string, subtasks?: string[]) => void;
  updateDailyTask: (taskId: string, title: string, subtasks: string[]) => void;
  deleteDailyTask: (taskId: string) => void;

  toggleTask: (date: string, taskId: string) => void;
  getDailyProgress: (date: string) => number;
  getTaskStatus: (date: string, taskId: string) => boolean;
  getDailyTasksForDate: (date: string) => DailyTask[];
};

const AppContext = createContext<AppContextType | undefined>(undefined);

function toISODateString(d: Date) {
  // YYYY-MM-DD
  return d.toISOString().slice(0, 10);
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  const [tasks, setTasks] = useState<Task[]>([]);
  const [dailyTasks, setDailyTasks] = useState<DailyTask[]>([]);
  const [logs, setLogs] = useState<Record<string, Record<string, boolean>>>({});

  const userId = user?.id ?? null;

  // =========================
  // Auth sync (Supabase -> store)
  // =========================
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      const u = data.user;
      if (u) {
        setUser({
          id: u.id,
          name: (u.user_metadata?.name as string) || "",
          email: u.email || "",
        });
      }
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      const u = session?.user;
      if (u) {
        setUser({
          id: u.id,
          name: (u.user_metadata?.name as string) || "",
          email: u.email || "",
        });
      } else {
        setUser(null);
        setTasks([]);
        setDailyTasks([]);
        setLogs({});
      }
    });

    return () => sub.subscription.unsubscribe();
  }, []);

  // =========================
  // Load all app data from DB when user logs in
  // =========================
  useEffect(() => {
    if (!userId) return;

    const loadAll = async () => {
      // 1) Tasks + subtasks
      const { data: tasksRows, error: tasksErr } = await supabase
        .from("tasks")
        .select(
          `
          id, title, day_of_week,
          task_subtasks:task_subtasks ( id, title )
        `,
        )
        .eq("user_id", userId)
        .order("created_at", { ascending: true });

      if (tasksErr) {
        console.error("load tasks error:", tasksErr);
      } else {
        const mapped: Task[] =
          tasksRows?.map((t: any) => ({
            id: t.id,
            title: t.title,
            dayOfWeek: t.day_of_week,
            subtasks: (t.task_subtasks || []).map((st: any) => ({ id: st.id, title: st.title })),
          })) ?? [];
        setTasks(mapped);
      }

      // 2) Daily tasks + subtasks
      const { data: dailyRows, error: dailyErr } = await supabase
        .from("daily_tasks")
        .select(
          `
          id, title, date,
          daily_subtasks:daily_subtasks ( id, title )
        `,
        )
        .eq("user_id", userId)
        .order("created_at", { ascending: true });

      if (dailyErr) {
        console.error("load daily_tasks error:", dailyErr);
      } else {
        const mapped: DailyTask[] =
          dailyRows?.map((t: any) => ({
            id: t.id,
            title: t.title,
            date: String(t.date),
            subtasks: (t.daily_subtasks || []).map((st: any) => ({ id: st.id, title: st.title })),
          })) ?? [];
        setDailyTasks(mapped);
      }

      // 3) Checks (logs)
      // Carrega um intervalo recente (ex.: últimos 120 dias) pra não trazer "infinito".
      const fromDate = new Date();
      fromDate.setDate(fromDate.getDate() - 120);

      const { data: checksRows, error: checksErr } = await supabase
        .from("checks")
        .select("date, item_id, done")
        .eq("user_id", userId)
        .gte("date", toISODateString(fromDate))
        .order("date", { ascending: true });

      if (checksErr) {
        console.error("load checks error:", checksErr);
      } else {
        const newLogs: Record<string, Record<string, boolean>> = {};
        for (const row of checksRows || []) {
          const date = String((row as any).date);
          const itemId = String((row as any).item_id);
          const done = !!(row as any).done;
          if (!newLogs[date]) newLogs[date] = {};
          newLogs[date][itemId] = done;
        }
        setLogs(newLogs);
      }
    };

    void loadAll();
  }, [userId]);

  // =========================
  // API helpers
  // =========================
  const login = (_name: string, _email: string) => {
    // compat; login real é no auth.tsx
  };

  const logout = () => {
    void supabase.auth.signOut();
  };

  // =========================
  // CRUD: recurring tasks
  // =========================
  const addTask = async (title: string, dayOfWeek: number, subtaskTitles: string[] = []) => {
    if (!userId) return;

    // 1) cria task
    const { data: t, error: tErr } = await supabase
      .from("tasks")
      .insert([{ user_id: userId, title, day_of_week: dayOfWeek }])
      .select("id, title, day_of_week")
      .single();

    if (tErr || !t) {
      console.error("addTask error:", tErr);
      return;
    }

    // 2) cria subtasks (se houver)
    let subtasks: SubTask[] = [];
    if (subtaskTitles.length > 0) {
      const { data: sts, error: stErr } = await supabase
        .from("task_subtasks")
        .insert(
          subtaskTitles.map((st) => ({
            user_id: userId,
            task_id: t.id,
            title: st,
          })),
        )
        .select("id, title");

      if (stErr) {
        console.error("addTask subtasks error:", stErr);
      } else {
        subtasks = (sts || []).map((s: any) => ({ id: s.id, title: s.title }));
      }
    }

    const newTask: Task = {
      id: t.id,
      title: t.title,
      dayOfWeek: t.day_of_week,
      subtasks,
    };

    setTasks((prev) => [...prev, newTask]);
  };

  const updateTask = async (taskId: string, title: string, subtaskTitles: string[]) => {
    if (!userId) return;

    // atualiza task
    const { error: upErr } = await supabase
      .from("tasks")
      .update({ title })
      .eq("id", taskId)
      .eq("user_id", userId);

    if (upErr) {
      console.error("updateTask error:", upErr);
      return;
    }

    // recria subtasks (simples e efetivo)
    await supabase.from("task_subtasks").delete().eq("task_id", taskId).eq("user_id", userId);

    let newSubtasks: SubTask[] = [];
    if (subtaskTitles.length > 0) {
      const { data: sts, error: stErr } = await supabase
        .from("task_subtasks")
        .insert(
          subtaskTitles.map((st) => ({
            user_id: userId,
            task_id: taskId,
            title: st,
          })),
        )
        .select("id, title");

      if (stErr) console.error("updateTask subtasks error:", stErr);
      else newSubtasks = (sts || []).map((s: any) => ({ id: s.id, title: s.title }));
    }

    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, title, subtasks: newSubtasks } : t)),
    );
  };

  const deleteTask = async (taskId: string) => {
    if (!userId) return;

    const { error } = await supabase.from("tasks").delete().eq("id", taskId).eq("user_id", userId);
    if (error) {
      console.error("deleteTask error:", error);
      return;
    }

    setTasks((prev) => prev.filter((t) => t.id !== taskId));
  };

  // =========================
  // CRUD: daily tasks
  // =========================
  const addDailyTask = async (title: string, date: string, subtaskTitles: string[] = []) => {
    if (!userId) return;

    const { data: t, error: tErr } = await supabase
      .from("daily_tasks")
      .insert([{ user_id: userId, title, date }])
      .select("id, title, date")
      .single();

    if (tErr || !t) {
      console.error("addDailyTask error:", tErr);
      return;
    }

    let subtasks: SubTask[] = [];
    if (subtaskTitles.length > 0) {
      const { data: sts, error: stErr } = await supabase
        .from("daily_subtasks")
        .insert(
          subtaskTitles.map((st) => ({
            user_id: userId,
            daily_task_id: t.id,
            title: st,
          })),
        )
        .select("id, title");

      if (stErr) console.error("addDailyTask subtasks error:", stErr);
      else subtasks = (sts || []).map((s: any) => ({ id: s.id, title: s.title }));
    }

    const newTask: DailyTask = {
      id: t.id,
      title: t.title,
      date: String(t.date),
      subtasks,
    };

    setDailyTasks((prev) => [...prev, newTask]);
  };

  const updateDailyTask = async (taskId: string, title: string, subtaskTitles: string[]) => {
    if (!userId) return;

    const { error: upErr } = await supabase
      .from("daily_tasks")
      .update({ title })
      .eq("id", taskId)
      .eq("user_id", userId);

    if (upErr) {
      console.error("updateDailyTask error:", upErr);
      return;
    }

    await supabase.from("daily_subtasks").delete().eq("daily_task_id", taskId).eq("user_id", userId);

    let newSubtasks: SubTask[] = [];
    if (subtaskTitles.length > 0) {
      const { data: sts, error: stErr } = await supabase
        .from("daily_subtasks")
        .insert(
          subtaskTitles.map((st) => ({
            user_id: userId,
            daily_task_id: taskId,
            title: st,
          })),
        )
        .select("id, title");

      if (stErr) console.error("updateDailyTask subtasks error:", stErr);
      else newSubtasks = (sts || []).map((s: any) => ({ id: s.id, title: s.title }));
    }

    setDailyTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, title, subtasks: newSubtasks } : t)),
    );
  };

  const deleteDailyTask = async (taskId: string) => {
    if (!userId) return;

    const { error } = await supabase
      .from("daily_tasks")
      .delete()
      .eq("id", taskId)
      .eq("user_id", userId);

    if (error) {
      console.error("deleteDailyTask error:", error);
      return;
    }

    setDailyTasks((prev) => prev.filter((t) => t.id !== taskId));
  };

  // =========================
  // Checks (logs)
  // =========================
  const toggleTask = async (date: string, taskId: string) => {
    if (!userId) return;

    const task = tasks.find((t) => t.id === taskId);
    const subtaskParent = tasks.find((t) => t.subtasks.some((st) => st.id === taskId));
    const dailyTask = dailyTasks.find((t) => t.id === taskId);
    const dailySubtaskParent = dailyTasks.find((t) => t.subtasks.some((st) => st.id === taskId));

    const dayLogs = logs[date] || {};
    const newStatus = !dayLogs[taskId];

    // aplica localmente (mesma lógica que você já tinha)
    const applyLocal = () => {
      setLogs((prev) => {
        const current = prev[date] || {};
        let updated: Record<string, boolean> = { ...current, [taskId]: newStatus };

        // Case 1: task principal
        if (task && task.subtasks.length > 0) {
          task.subtasks.forEach((st) => (updated[st.id] = newStatus));
        }

        // Case 2: subtask -> ajustar pai
        if (subtaskParent) {
          const allDone = subtaskParent.subtasks.every((st) => {
            if (st.id === taskId) return newStatus;
            return !!current[st.id];
          });
          updated[subtaskParent.id] = allDone ? true : newStatus ? !!current[subtaskParent.id] : false;
        }

        // Case 3: daily principal
        if (dailyTask && dailyTask.subtasks.length > 0) {
          dailyTask.subtasks.forEach((st) => (updated[st.id] = newStatus));
        }

        // Case 4: daily subtask -> ajustar pai
        if (dailySubtaskParent) {
          const allDone = dailySubtaskParent.subtasks.every((st) => {
            if (st.id === taskId) return newStatus;
            return !!current[st.id];
          });
          updated[dailySubtaskParent.id] = allDone ? true : newStatus ? !!current[dailySubtaskParent.id] : false;
        }

        return { ...prev, [date]: updated };
      });
    };

    applyLocal();

    // Persistência no DB:
    // Salva o "item_id" como UUID (tabelas usam uuid). Se por algum motivo não for UUID, você vai ver erro aqui.
    const upsertOne = async (itemId: string, done: boolean) => {
      const { error } = await supabase
        .from("checks")
        .upsert(
          [{ user_id: userId, date, item_id: itemId, done }],
          { onConflict: "user_id,date,item_id" },
        );
      if (error) console.error("check upsert error:", error);
    };

    // item principal
    await upsertOne(taskId, newStatus);

    // se é uma task com subtasks, replica
    if (task?.subtasks?.length) {
      await Promise.all(task.subtasks.map((st) => upsertOne(st.id, newStatus)));
    }
    if (dailyTask?.subtasks?.length) {
      await Promise.all(dailyTask.subtasks.map((st) => upsertOne(st.id, newStatus)));
    }
  };

  const getTaskStatus = (date: string, taskId: string) => {
    return logs[date]?.[taskId] || false;
  };

  const getDailyTasksForDate = (date: string) => {
    return dailyTasks.filter((t) => t.date === date);
  };

  const getDailyProgress = (date: string) => {
    const dateObj = new Date(date + "T00:00:00");
    const dayOfWeek = dateObj.getDay();

    const daysTasks = tasks.filter((t) => t.dayOfWeek === dayOfWeek);
    const dateDailyTasks = getDailyTasksForDate(date);

    if (daysTasks.length === 0 && dateDailyTasks.length === 0) return 0;

    let totalItems = 0;
    let completedItems = 0;

    daysTasks.forEach((task) => {
      totalItems++;
      if (getTaskStatus(date, task.id)) completedItems++;
      task.subtasks.forEach((st) => {
        totalItems++;
        if (getTaskStatus(date, st.id)) completedItems++;
      });
    });

    dateDailyTasks.forEach((task) => {
      totalItems++;
      if (getTaskStatus(date, task.id)) completedItems++;
      task.subtasks.forEach((st) => {
        totalItems++;
        if (getTaskStatus(date, st.id)) completedItems++;
      });
    });

    return totalItems === 0 ? 0 : Math.round((completedItems / totalItems) * 100);
  };

  const value = useMemo(
    () => ({
      user,
      tasks,
      dailyTasks,
      logs,
      login,
      logout,
      addTask,
      updateTask,
      deleteTask,
      addDailyTask,
      updateDailyTask,
      deleteDailyTask,
      toggleTask,
      getDailyProgress,
      getTaskStatus,
      getDailyTasksForDate,
    }),
    [user, tasks, dailyTasks, logs],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) throw new Error("useApp must be used within AppProvider");
  return context;
}