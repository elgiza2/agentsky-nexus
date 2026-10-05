import { useState } from "react";
import { Download, FileText, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { downloadAgentFile } from "@/lib/agentsky/client";

export function AgentFileCard({ sessionId, file, lang }: { sessionId: string; file: { name: string; path: string; size: number }; lang: "ar" | "en" }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  return <div className="rounded-lg border border-border bg-card p-3 max-w-[520px]">
    <div className="flex items-center gap-3"><FileText size={22} className="shrink-0 text-muted-foreground" /><div className="min-w-0 flex-1"><div className="truncate text-sm font-medium" dir="auto">{file.name}</div><div className="text-xs text-muted-foreground">{file.size < 1024 ? `${file.size} B` : `${Math.round(file.size / 1024)} KB`}</div></div>
      <Button variant="ghost" size="icon" disabled={busy} aria-label={lang === "ar" ? `تحميل ${file.name}` : `Download ${file.name}`} onClick={async () => { setBusy(true); setError(""); try { await downloadAgentFile(sessionId, file.path, file.name); } catch(e) { setError(e instanceof Error ? e.message : "Download failed"); } finally { setBusy(false); } }}>{busy ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}</Button>
    </div>{error && <p role="alert" className="mt-2 text-xs text-destructive">{error}</p>}
  </div>;
}