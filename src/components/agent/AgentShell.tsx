/** @doc Agent workspace layout: sidebar (new chat, tasks, agents, studio, recent chats, settings) + main area. */
import { useState, type ReactNode } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Plus, ListTodo, Bot, Wand2, Settings, Menu, Trash2 } from "lucide-react";
import { useWorkspaceStore, workspace } from "@/lib/agentsky/store";
import { agentApi } from "@/lib/agentsky/client";
import { AgentOrb } from "./AgentOrb";

function Sidebar({ lang, onNav }: { lang: "en" | "ar"; onNav?: () => void }) {
  const nav = useNavigate();
  const loc = useLocation();
  const { sessions, agents } = useWorkspaceStore();
  const ar = lang === "ar";
  const go = (p: string) => {
    nav(p);
    onNav?.();
  };
  const items = [
    { p: "/tasks", icon: ListTodo, label: ar ? "المهام" : "Tasks" },
    { p: "/agents", icon: Bot, label: ar ? "الوكلاء" : "Agents" },
    { p: "/studio", icon: Wand2, label: ar ? "الاستوديو" : "Studio" },
  ];
  return (
    <aside className="ag-side h-full">
      <div className="flex items-center gap-2.5 px-2 pb-3 pt-1">
        <AgentOrb size={28} />
        <span className="text-[17px] font-bold tracking-tight">Megsy</span>
      </div>
      <button type="button" className="ag-side__item font-semibold" onClick={() => go("/chat")}>
        <Plus size={17} /> {ar ? "شات جديد" : "New chat"}
      </button>
      {items.map((i) => (
        <button key={i.p} type="button" className="ag-side__item" data-active={loc.pathname.startsWith(i.p)} onClick={() => go(i.p)}>
          <i.icon size={17} /> {i.label}
        </button>
      ))}
      <div className="ag-side__label">{ar ? "الأخيرة" : "Recent"}</div>
      <div className="-mx-1 flex-1 overflow-y-auto px-1">
        {sessions.map((s) => {
          const a = agents.find((x) => x.id === s.agentId);
          const active = loc.pathname === `/chat/${s.id}`;
          return (
            <div key={s.id} className="group relative">
              <button type="button" className="ag-side__item pe-8" data-active={active} onClick={() => go(`/chat/${s.id}`)}>
                <AgentOrb size={16} color={a?.color} state={s.status === "running" ? "thinking" : "idle"} />
                <span className="truncate">{s.title || (ar ? "شات" : "Chat")}</span>
              </button>
              <button
                type="button"
                aria-label={ar ? "حذف" : "Delete"}
                className="absolute end-1.5 top-1/2 hidden -translate-y-1/2 rounded-lg p-1.5 text-[color:var(--ag-muted)] hover:bg-[color:var(--ag-bg)] group-hover:block"
                onClick={async () => {
                  workspace.removeSession(s.id);
                  if (active) go("/chat");
                  await agentApi.deleteSession(s.id).catch(() => {});
                }}
              >
                <Trash2 size={14} />
              </button>
            </div>
          );
        })}
      </div>
      <button type="button" className="ag-side__item" onClick={() => go("/settings")}>
        <Settings size={17} /> {ar ? "الإعدادات" : "Settings"}
      </button>
    </aside>
  );
}

export function AgentShell({ lang, title, actions, children }: { lang: "en" | "ar"; title?: ReactNode; actions?: ReactNode; children: ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="ag-app" dir={lang === "ar" ? "rtl" : "ltr"}>
      <div className="ag-side--desktop">
        <Sidebar lang={lang} />
      </div>
      {open && (
        <>
          <div className="ag-drawer-mask" onClick={() => setOpen(false)} />
          <div className="ag-drawer">
            <Sidebar lang={lang} onNav={() => setOpen(false)} />
          </div>
        </>
      )}
      <main className="ag-main">
        <header className="ag-topbar">
          <button type="button" className="ag-icon-btn min-[861px]:hidden" onClick={() => setOpen(true)} aria-label="Menu">
            <Menu size={19} />
          </button>
          <div className="min-w-0 flex-1 truncate font-semibold">{title}</div>
          {actions}
        </header>
        {children}
      </main>
    </div>
  );
}
