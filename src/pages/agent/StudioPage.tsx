/** @doc Studio: make images/videos directly with free or subscriber models. */
import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Lock, Loader2, Sparkles } from "lucide-react";
import { useUserLang } from "@/lib/authI18n";
import { agentApi, AgentApiError } from "@/lib/agentsky/client";
import { useWorkspaceStore } from "@/lib/agentsky/store";
import type { MediaPayload } from "@/lib/agentsky/transcript";
import { AgentShell } from "@/components/agent/AgentShell";
import { MediaCard } from "@/components/agent/Cards";

const ASPECTS = ["1:1", "16:9", "9:16", "4:3", "3:4"];

export default function StudioPage() {
  const lang = useUserLang() === "ar-eg" ? "ar" : "en";
  const ar = lang === "ar";
  const nav = useNavigate();
  const { models, tier } = useWorkspaceStore();
  const [kind, setKind] = useState<"image" | "video">("image");
  const [prompt, setPrompt] = useState("");
  const [aspect, setAspect] = useState("1:1");
  const [model, setModel] = useState<string | undefined>();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [items, setItems] = useState<{ media: MediaPayload; aspect: string }[]>([]);
  const key = useRef(crypto.randomUUID());

  const list = models.filter((m) => m.kind === kind);
  const chosen = list.find((m) => m.id === model) ?? list.find((m) => !m.locked);

  const go = async () => {
    if (!prompt.trim() || !chosen) return;
    setBusy(true);
    setError(null);
    try {
      const r = await agentApi.media({ kind, prompt: prompt.trim(), aspect, model: chosen.id, duration: 5, idempotencyKey: key.current });
      key.current = crypto.randomUUID();
      setItems((x) => [{ aspect, media: { type: "megsy.media", kind, runId: r.runId, token: r.token, status: r.status, urls: [], model: r.model, prompt: prompt.trim() } }, ...x]);
    } catch (e) {
      const code = e instanceof AgentApiError ? e.code : "";
      setError(code === "free_limit" ? (ar ? "خلصت الفيديو المجاني النهارده." : "You've used today's free video.") : (e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <AgentShell lang={lang} title={ar ? "الاستوديو" : "Studio"}>
      <div className="ag-scroll">
        <div className="ag-column space-y-5">
          <div className="ag-card space-y-4 p-4">
            <div className="flex gap-2">
              {(["image", "video"] as const).map((k) => (
                <button key={k} type="button" className="ag-chip" data-selected={k === kind} onClick={() => { setKind(k); setModel(undefined); }}>
                  {k === "image" ? (ar ? "صورة" : "Image") : ar ? "فيديو" : "Video"}
                </button>
              ))}
            </div>
            <textarea className="ag-input min-h-[110px] resize-y" dir="auto" value={prompt} onChange={(e) => setPrompt(e.target.value)} placeholder={ar ? "وصف اللي عايز تعمله…" : "Describe what you want…"} />
            <div className="flex flex-wrap gap-2">
              {list.map((m) => (
                <button key={m.id} type="button" className="ag-chip" data-selected={m.id === chosen?.id} onClick={() => (m.locked ? nav("/pricing") : setModel(m.id))}>
                  {m.locked && <Lock size={12} />} {m.label}
                  {m.tier === "free" && <span className="text-[11px] text-[color:var(--ag-muted)]">{ar ? "مجاني" : "Free"}</span>}
                </button>
              ))}
            </div>
            <div className="flex flex-wrap gap-2">
              {ASPECTS.map((a) => (
                <button key={a} type="button" className="ag-chip !py-1.5" data-selected={a === aspect} onClick={() => setAspect(a)}>
                  {a}
                </button>
              ))}
            </div>
            {error && <p className="text-[13px] text-[color:var(--ag-danger)]">{error}</p>}
            {tier === "free" && <p className="text-[12.5px] text-[color:var(--ag-muted)]">{ar ? "الخطة المجانية: صور سريعة وفيديو واحد قصير يومياً." : "Free plan: fast images and one short video a day."}</p>}
            <button type="button" className="ag-btn ag-btn--agent w-full" disabled={busy || !prompt.trim() || !chosen} onClick={go}>
              {busy ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
              {ar ? "اعمل" : "Create"}
            </button>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {items.map((i) => (
              <MediaCard key={i.media.runId} media={i.media} aspect={i.aspect} lang={lang} />
            ))}
          </div>
        </div>
      </div>
    </AgentShell>
  );
}
