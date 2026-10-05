/** @doc Tasks: agent runs (from AgentSky) and the tasks the agent added for the user. */
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2, ListTodo, ChevronRight } from "lucide-react";
import { useUserLang } from "@/lib/authI18n";
import { agentApi } from "@/lib/agentsky/client";
import { useWorkspaceStore } from "@/lib/agentsky/store";
import { AgentShell } from "@/components/agent/AgentShell";
import { AgentOrb } from "@/components/agent/AgentOrb";

type T = Awaited<ReturnType<typeof agentApi.tasks>>["tasks"][number];

export default function AgentTasksPage() {
  const lang = useUserLang() === "ar-eg" ? "ar" : "en";
  const ar = lang === "ar";
  const nav = useNavigate();
  const { sessions, agents } = useWorkspaceStore();
  const [tasks, setTasks] = useState<T[] | null>(null);

  useEffect(() => {
    let alive = true;
    const load = () => agentApi.tasks().then((r) => alive && setTasks(r.tasks)).catch(() => alive && setTasks([]));
    void load();
    const t = setInterval(load, 10000);
    return () => {
      alive = false;
      clearInterval(t);
    };
  }, []);

  const label = (a: string) =>
    ({
      working: ar ? "شغال" : "Working",
      waiting_on_you: ar ? "مستنيك" : "Needs you",
      done: ar ? "خلص" : "Done",
      failed: ar ? "فشل" : "Failed",
    })[a] ?? a;

  return (
    <AgentShell
      lang={lang}
      title={ar ? "المهام" : "Tasks"}
      actions={
        <button type="button" className="ag-btn ag-btn--ghost !h-9" onClick={() => nav("/tasks/life")}>
          <ListTodo size={15} /> {ar ? "مهامي" : "My tasks"}
        </button>
      }
    >
      <div className="ag-scroll">
        <div className="ag-column space-y-2">
          {!tasks && <Loader2 className="mx-auto animate-spin" />}
          {tasks?.length === 0 && <p className="py-16 text-center text-[color:var(--ag-muted)]">{ar ? "لسه مفيش مهام. ابدأ شات واطلب حاجة." : "No tasks yet. Start a chat and ask for something."}</p>}
          {tasks?.map((t) => {
            const s = sessions.find((x) => x.id === t.id);
            const a = agents.find((x) => x.id === s?.agentId);
            const state = t.attention === "working" ? "tool" : t.attention === "failed" ? "error" : t.attention === "done" ? "idle" : "thinking";
            return (
              <button key={t.id} type="button" onClick={() => nav("/chat")} className="ag-card flex w-full items-center gap-3 p-3.5 text-start">
                <AgentOrb size={34} color={a?.color} state={state} />
                <div className="min-w-0 flex-1">
                  <div className="truncate font-semibold">{t.title || s?.title || (ar ? "مهمة" : "Task")}</div>
                  <div className="truncate text-[13px] text-[color:var(--ag-muted)]">
                    {label(t.attention)}
                    {t.statusLine ? ` · ${t.statusLine}` : ""}
                    {t.helpers ? ` · ${t.helpers} ${ar ? "مساعد" : "helpers"}` : ""}
                  </div>
                </div>
                {t.openRequests > 0 && <span className="ag-gradient rounded-full px-2 py-0.5 text-[12px] font-semibold text-white">{t.openRequests}</span>}
                <ChevronRight size={16} className="text-[color:var(--ag-muted)] rtl:rotate-180" />
              </button>
            );
          })}
        </div>
      </div>
    </AgentShell>
  );
}
