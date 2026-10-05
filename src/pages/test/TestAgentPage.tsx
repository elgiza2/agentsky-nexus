/** @doc TestAgentPage — hidden internal harness for trying chat agent tiers. Route: /test-agent (not linked anywhere). */
import { useState } from "react";
import { FlaskConical, Send, Trash2 } from "lucide-react";

type Tier = "lite" | "pro" | "max";

const TIERS: { id: Tier; label: string; desc: string }[] = [
  { id: "lite", label: "Megsy 3.9 Lite", desc: "For everyday tasks." },
  { id: "pro", label: "Megsy 3.9", desc: "For most tasks." },
  { id: "max", label: "Megsy 3.9 Max", desc: "For complex tasks." },
];

interface TestEntry {
  id: number;
  tier: Tier;
  prompt: string;
  at: string;
}

export default function TestAgentPage() {
  const [tier, setTier] = useState<Tier>("lite");
  const [prompt, setPrompt] = useState("");
  const [log, setLog] = useState<TestEntry[]>([]);

  const run = () => {
    const text = prompt.trim();
    if (!text) return;
    setLog((prev) => [
      { id: Date.now(), tier, prompt: text, at: new Date().toLocaleTimeString() },
      ...prev,
    ]);
    setPrompt("");
  };

  return (
    <div className="min-h-[100dvh] w-full bg-background text-foreground">
      <div className="mx-auto flex max-w-2xl flex-col gap-6 px-4 py-10">
        <header className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <FlaskConical className="h-5 w-5" />
          </span>
          <div>
            <h1 className="text-xl font-bold tracking-tight">Test Agent</h1>
            <p className="text-sm text-foreground/55">
              Internal sandbox — hidden page, not linked anywhere.
            </p>
          </div>
        </header>

        <section className="flex flex-col gap-2">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-foreground/50">
            Agent tier
          </span>
          <div className="grid grid-cols-3 gap-2">
            {TIERS.map((t) => {
              const active = tier === t.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTier(t.id)}
                  className="rounded-2xl px-3 py-3 text-left transition-all active:scale-[0.98]"
                  style={{
                    background: active
                      ? "hsl(var(--primary) / 0.1)"
                      : "hsl(var(--foreground) / 0.03)",
                    boxShadow: active
                      ? "inset 0 0 0 1px hsl(var(--primary) / 0.35)"
                      : "inset 0 0 0 1px hsl(var(--foreground) / 0.06)",
                  }}
                >
                  <span className="block text-[13px] font-semibold">{t.label}</span>
                  <span className="mt-0.5 block text-[11px] text-foreground/55">{t.desc}</span>
                </button>
              );
            })}
          </div>
        </section>

        <section className="flex flex-col gap-2">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-foreground/50">
            Test prompt
          </span>
          <div className="flex items-end gap-2 rounded-2xl border border-border/70 bg-card p-2">
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  run();
                }
              }}
              rows={3}
              placeholder="Type a prompt to test the selected agent…"
              className="min-h-[72px] flex-1 resize-none bg-transparent px-2 py-1.5 text-sm outline-none placeholder:text-foreground/40"
            />
            <button
              type="button"
              onClick={run}
              disabled={!prompt.trim()}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-white disabled:opacity-40"
              style={{
                background:
                  "linear-gradient(135deg, hsl(340 82% 56%) 0%, hsl(15 88% 55%) 55%, hsl(22 95% 55%) 100%)",
              }}
              aria-label="Run test"
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
        </section>

        <section className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-foreground/50">
              Run log ({log.length})
            </span>
            {log.length > 0 && (
              <button
                type="button"
                onClick={() => setLog([])}
                className="inline-flex items-center gap-1 text-[11px] font-medium text-foreground/55 hover:text-foreground"
              >
                <Trash2 className="h-3 w-3" /> Clear
              </button>
            )}
          </div>
          {log.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-border/70 px-4 py-8 text-center text-sm text-foreground/45">
              No test runs yet.
            </p>
          ) : (
            <ul className="flex flex-col gap-2">
              {log.map((entry) => (
                <li
                  key={entry.id}
                  className="rounded-2xl px-4 py-3"
                  style={{
                    background: "hsl(var(--foreground) / 0.03)",
                    boxShadow: "inset 0 0 0 1px hsl(var(--foreground) / 0.06)",
                  }}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="rounded-md bg-primary/10 px-1.5 py-px text-[10px] font-bold text-primary">
                      {entry.tier.toUpperCase()}
                    </span>
                    <span className="text-[11px] text-foreground/45">{entry.at}</span>
                  </div>
                  <p className="mt-1.5 whitespace-pre-wrap text-sm">{entry.prompt}</p>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
