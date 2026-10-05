/** @doc Agents list + full-page agent builder (/agents and /agents/new). */
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Trash2, Loader2, ArrowLeft } from "lucide-react";
import { useUserLang } from "@/lib/authI18n";
import { agentApi, type AgentColor } from "@/lib/agentsky/client";
import { useWorkspaceStore, workspace } from "@/lib/agentsky/store";
import { AgentShell } from "@/components/agent/AgentShell";
import { AgentOrb, type OrbState } from "@/components/agent/AgentOrb";

const COLORS: AgentColor[] = ["aurora", "ocean", "ember", "mint", "sun", "rose", "mono"];

export function AgentsPage() {
  const lang = useUserLang() === "ar-eg" ? "ar" : "en";
  const ar = lang === "ar";
  const nav = useNavigate();
  const { agents, ready } = useWorkspaceStore();
  return (
    <AgentShell
      lang={lang}
      title={ar ? "الوكلاء" : "Agents"}
      actions={
        <button type="button" className="ag-btn ag-btn--primary !h-9" onClick={() => nav("/agents/new")}>
          <Plus size={16} /> {ar ? "وكيل جديد" : "New agent"}
        </button>
      }
    >
      <div className="ag-scroll">
        <div className="ag-column grid gap-3 sm:grid-cols-2">
          {!ready && <Loader2 className="animate-spin" />}
          {agents.map((a) => (
            <div key={a.id} className="ag-card flex flex-col gap-3 p-4" data-agent-color={a.color}>
              <div className="flex items-center gap-3">
                <AgentOrb size={44} color={a.color} />
                <div className="min-w-0 flex-1">
                  <div className="truncate font-semibold">{a.name}</div>
                  <div className="line-clamp-2 text-[13px] text-[color:var(--ag-muted)]">{a.description || (ar ? "وكيل عام" : "General agent")}</div>
                </div>
                {!a.isDefault && (
                  <button
                    type="button"
                    className="ag-icon-btn text-[color:var(--ag-muted)]"
                    aria-label={ar ? "حذف" : "Delete"}
                    onClick={async () => {
                      if (!confirm(ar ? "تحذف الوكيل ده؟" : "Delete this agent?")) return;
                      workspace.removeAgent(a.id);
                      await agentApi.deleteAgent(a.id).catch(() => {});
                    }}
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
              <button type="button" className="ag-btn ag-btn--agent" onClick={() => nav(`/chat?agent=${a.id}`)}>
                {ar ? "ابدأ شات" : "Start chat"}
              </button>
            </div>
          ))}
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
        <button type="button" className="flex items-center gap-2" onClick={() => nav("/agents")}>
          <ArrowLeft size={17} className="rtl:rotate-180" /> {ar ? "وكيل جديد" : "New agent"}
        </button>
      }
    >
      <div className="ag-scroll" data-agent-color={color}>
        <div className="ag-column grid gap-8 md:grid-cols-[1fr_220px]">
          <div className="space-y-5">
            <div className="ag-field">
              <label>{ar ? "الاسم" : "Name"}</label>
              <input className="ag-input" value={name} maxLength={40} onChange={(e) => setName(e.target.value)} placeholder={ar ? "مثلاً: باحث السفر" : "e.g. Travel researcher"} />
            </div>
            <div className="ag-field">
              <label>{ar ? "بيعمل إيه" : "What it does"}</label>
              <input className="ag-input" value={description} maxLength={140} onChange={(e) => setDescription(e.target.value)} placeholder={ar ? "جملة قصيرة" : "One short line"} />
            </div>
            <div className="ag-field">
              <label>{ar ? "التعليمات" : "Instructions"}</label>
              <textarea
                className="ag-input min-h-[200px] resize-y leading-relaxed"
                value={prompt}
                maxLength={6000}
                onFocus={() => setPreview("talking")}
                onBlur={() => setPreview("idle")}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder={ar ? "اشرح له يشتغل إزاي، بيتكلم بأي أسلوب، وإيه اللي يتجنبه." : "Tell it how to work, how to talk, and what to avoid."}
              />
              <span className="ag-hint">{ar ? "يقدر دايماً يبحث، يتصفح، يعمل صور وفيديو، ويشغل مساعدين." : "It can always search, browse, make images and video, and run helper agents."}</span>
            </div>
            <div className="ag-field">
              <label>{ar ? "اللون" : "Color"}</label>
              <div className="flex flex-wrap gap-3">
                {COLORS.map((c) => (
                  <button key={c} type="button" data-agent-color={c} data-selected={c === color} className="ag-swatch ag-gradient" aria-label={c} onClick={() => setColor(c)} />
                ))}
              </div>
            </div>
            {error && <p className="text-[13px] text-[color:var(--ag-danger)]">{error}</p>}
            <button type="button" className="ag-btn ag-btn--agent w-full" disabled={busy || name.trim().length < 2} onClick={save}>
              {busy && <Loader2 size={16} className="animate-spin" />}
              {ar ? "اعمل الوكيل" : "Create agent"}
            </button>
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
