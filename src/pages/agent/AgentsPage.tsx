/** @doc Agents list + full-page agent builder (/agents and /agents/new). */
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Trash2, Loader2, ArrowLeft, ArrowUpRight, Search, Lock } from "lucide-react";
import { useUserLang } from "@/lib/authI18n";
import { agentApi, type AgentColor } from "@/lib/agentsky/client";
import { useWorkspaceStore, workspace } from "@/lib/agentsky/store";
import { AgentShell } from "@/components/agent/AgentShell";
import { AgentOrb, type OrbState } from "@/components/agent/AgentOrb";

import { Button } from "@/components/ui/button";
import SEOHead from "@/components/common/SEOHead";

const COLORS: AgentColor[] = ["aurora", "ocean", "ember", "mint", "sun", "rose", "mono"];

export function AgentsPage() {
  const lang = useUserLang() === "ar-eg" ? "ar" : "en";
  const ar = lang === "ar";
  const nav = useNavigate();
  const { agents, ready, error, sessions, tier } = useWorkspaceStore();
  const [query, setQuery] = useState("");
  const [deleting, setDeleting] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const filtered = agents.filter((a) => `${a.name} ${a.description}`.toLowerCase().includes(query.toLowerCase()));
  return (
    <AgentShell lang={lang} title={ar ? "الوكلاء" : "Agents"} actions={<Button variant="neutral" size="sm" onClick={() => nav("/agents/new")}><Plus />{ar ? "وكيل جديد" : "New agent"}</Button>}>
      <SEOHead path="/agents" title="Agents — Megsy AI" description="Your Megsy agents and their conversations." />
      <div className="flex-1 overflow-y-auto px-4 py-6 md:px-8 md:py-10">
        <div className="mx-auto w-full max-w-3xl">
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div><h1 className="text-2xl font-semibold">{ar ? "الوكلاء" : "Agents"}</h1><p className="mt-1 text-sm text-muted-foreground">{agents.length} {ar ? "وكيل" : "agents"} · {sessions.filter((s) => s.status === "running").length} {ar ? "شغال دلوقتي" : "working now"}</p></div>
            <label className="flex h-10 w-full items-center gap-2 rounded-full border border-border bg-muted/40 px-4 sm:w-64"><Search className="h-4 w-4 text-muted-foreground" /><input aria-label={ar ? "ابحث عن وكيل" : "Search agents"} placeholder={ar ? "ابحث" : "Search"} value={query} onChange={(e) => setQuery(e.target.value)} className="min-w-0 w-full bg-transparent text-sm outline-none" /></label>
          </div>
          {(error || deleteError) && <p role="alert" className="mb-4 text-sm text-destructive">{error || deleteError}</p>}
          {!ready && <div className="flex items-center gap-3 py-12" role="status"><AgentOrb size={36} state="awakening" /><span className="text-sm text-muted-foreground">{ar ? "بنجهز وكلاءك…" : "Loading your agents…"}</span></div>}
          <ul className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-card">
            {filtered.map((a) => {
              const active = sessions.filter((s) => s.agentId === a.id && s.status === "running").length;
              const locked = !a.isDefault && tier !== "pro";
              return <li key={a.id} className="flex items-center gap-4 px-4 py-4 transition-colors hover:bg-muted/40" data-agent-color={a.color}>
                <AgentOrb size={44} color={a.color} state={active ? "tool" : "idle"} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2"><h2 className="truncate font-medium">{a.name}</h2>{a.isDefault && <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] text-muted-foreground">{ar ? "الأساسي" : "Default"}</span>}{active > 0 && <span className="text-[11px] text-primary">{ar ? `${active} شغالة` : `${active} running`}</span>}</div>
                  <p className="truncate text-sm text-muted-foreground">{a.description || (ar ? "وكيل عام" : "General agent")}</p>
                </div>
                {!a.isDefault && !a.isTemplate && <Button variant="ghost" size="icon-sm" title={ar ? "حذف" : "Delete"} aria-label={ar ? "حذف الوكيل" : "Delete agent"} disabled={deleting === a.id} onClick={async () => {
                  if (!confirm(ar ? "تحذف الوكيل ده؟" : "Delete this agent?")) return;
                  setDeleting(a.id); setDeleteError(null);
                  try { await agentApi.deleteAgent(a.id); workspace.removeAgent(a.id); } catch (e) { setDeleteError(e instanceof Error ? e.message : "Could not delete agent"); } finally { setDeleting(null); }
                }}><Trash2 /></Button>}
                <Button variant={locked ? "ghost" : "neutral"} size="sm" onClick={() => nav(locked ? "/pricing" : `/chat?agent=${encodeURIComponent(a.id)}`)}>{locked ? <><Lock />{ar ? "للمشتركين" : "Pro"}</> : <>{ar ? "شات" : "Chat"}<ArrowUpRight className="rtl:-scale-x-100" /></>}</Button>
              </li>;
            })}
          </ul>
          {ready && !filtered.length && !error && <div className="py-16 text-center text-muted-foreground">{ar ? "مفيش وكلاء بالاسم ده" : "No matching agents"}</div>}
        </div>
      </div>
    </AgentShell>
  );
}

export function AgentNewPage() {
  const lang = useUserLang() === "ar-eg" ? "ar" : "en";
  const ar = lang === "ar";
  const nav = useNavigate();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [prompt, setPrompt] = useState("");
  const [color, setColor] = useState<AgentColor>("ocean");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<OrbState>("idle");

  const save = async () => {
    setBusy(true);
    setError(null);
    setPreview("thinking");
    try {
      const r = await agentApi.createAgent({ name: name.trim(), description: description.trim(), prompt: prompt.trim(), color });
      workspace.addAgent(r.agent);
      setPreview("done");
      nav(`/chat?agent=${r.agent.id}`);
    } catch (e: any) {
      setError(e.message);
      setPreview("error");
    } finally {
      setBusy(false);
    }
  };

  return (
    <AgentShell
      lang={lang}
      title={
        <Button variant="ghost" type="button" className="flex items-center gap-2" onClick={() => nav("/agents")}>
          <ArrowLeft size={17} className="rtl:rotate-180" /> {ar ? "وكيل جديد" : "New agent"}
        </Button>
      }
    >
      <SEOHead path="/agents/new" title="New Agent — Megsy AI" description="Create a personal Megsy agent." />
      <div className="ag-scroll" data-agent-color={color}>
        <div className="mx-auto grid w-full max-w-4xl gap-8 px-5 py-10 md:grid-cols-[1fr_220px] md:px-10">
          <div className="space-y-5">
            <div className="ag-field">
              <label htmlFor="agent-name">{ar ? "الاسم" : "Name"}</label>
              <input id="agent-name" className="ag-input" value={name} maxLength={40} onChange={(e) => setName(e.target.value)} placeholder={ar ? "مثلاً: باحث السفر" : "e.g. Travel researcher"} />
            </div>
            <div className="ag-field">
              <label htmlFor="agent-description">{ar ? "بيعمل إيه" : "What it does"}</label>
              <input id="agent-description" className="ag-input" value={description} maxLength={140} onChange={(e) => setDescription(e.target.value)} placeholder={ar ? "جملة قصيرة" : "One short line"} />
            </div>
            <div className="ag-field">
              <label htmlFor="agent-prompt">{ar ? "التعليمات" : "Instructions"}</label>
              <textarea id="agent-prompt"
                className="ag-input min-h-[200px] resize-y leading-relaxed"
                value={prompt}
                maxLength={6000}
                onFocus={() => setPreview("talking")}
                onBlur={() => setPreview("idle")}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder={ar ? "اشرح له يشتغل إزاي، بيتكلم بأي أسلوب، وإيه اللي يتجنبه." : "Tell it how to work, how to talk, and what to avoid."}
              />
              
            </div>
            <div className="ag-field">
              <label>{ar ? "اللون" : "Color"}</label>
              <div className="flex flex-wrap gap-3">
                {COLORS.map((c) => (
                  <Button variant="ghost" key={c} type="button" data-agent-color={c} data-selected={c === color} aria-pressed={c === color} className="ag-swatch ag-gradient p-0" aria-label={c} onClick={() => setColor(c)} />
                ))}
              </div>
            </div>
            {error && <p className="text-[13px] text-[color:var(--ag-danger)]">{error}</p>}
            <Button variant="ghost" type="button" className="ag-btn ag-btn--agent w-full" disabled={busy || name.trim().length < 2} onClick={save}>
              {busy && <Loader2 size={16} className="animate-spin" />}
              {ar ? "اعمل الوكيل" : "Create agent"}
            </Button>
          </div>
          <div className="order-first flex flex-col items-center gap-3 md:order-none md:pt-6">
            <AgentOrb size={120} color={color} state={preview} />
            <div className="text-center font-semibold">{name || (ar ? "وكيلك" : "Your agent")}</div>
          </div>
        </div>
      </div>
    </AgentShell>
  );
}
