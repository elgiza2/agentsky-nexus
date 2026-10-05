/** @doc Stacked step list under an agent turn: every step says what it did (searched, read, clicked…). */
import { useState } from "react";
import {
  Brain, Search, FileText, MousePointerClick, Image as ImageIcon, Film, Users, Terminal, PenLine,
  MessageCircleQuestion, ListTodo, ListChecks, Wrench, ChevronDown, X,
} from "lucide-react";
import type { Step, StepKind } from "@/lib/agentsky/transcript";

const ICONS: Record<StepKind, any> = {
  thought: Brain, search: Search, read: FileText, browse: MousePointerClick, image: ImageIcon, video: Film,
  helper: Users, command: Terminal, edit: PenLine, ask: MessageCircleQuestion, task: ListTodo, plan: ListChecks, tool: Wrench,
};

function StepRow({ step }: { step: Step }) {
  const [open, setOpen] = useState(false);
  const Icon = step.status === "error" ? X : ICONS[step.kind];
  const expandable = step.kind === "thought" && !!step.detail?.trim();
  return (
    <div className="ag-step ag-fade-in" data-status={step.status}>
      <span className="ag-step__icon">
        <Icon size={12} strokeWidth={2.4} />
      </span>
      <div className="min-w-0 flex-1">
        <button
          type="button"
          disabled={!expandable}
          onClick={() => setOpen((v) => !v)}
          className="ag-step__label flex items-center gap-1 text-start disabled:cursor-default"
        >
          <span className={step.status === "active" ? "ag-shimmer" : ""}>{step.label}</span>
          {expandable && <ChevronDown size={13} className={`transition-transform ${open ? "rotate-180" : ""}`} />}
        </button>
        {open && expandable && <div className="ag-thought">{step.detail!.trim()}</div>}
      </div>
    </div>
  );
}

export function StepTimeline({ steps, lang }: { steps: Step[]; lang: "en" | "ar" }) {
  const [showAll, setShowAll] = useState(false);
  if (!steps.length) return null;
  const LIMIT = 6;
  const hidden = steps.length > LIMIT && !showAll ? steps.length - LIMIT : 0;
  const visible = hidden ? steps.slice(-LIMIT) : steps;
  return (
    <div className="ag-steps">
      {hidden > 0 && (
        <button type="button" onClick={() => setShowAll(true)} className="mb-1 self-start text-[12.5px] text-[color:var(--ag-muted)] hover:underline">
          {lang === "ar" ? `عرض ${hidden} خطوات قبلها` : `Show ${hidden} earlier steps`}
        </button>
      )}
      {visible.map((s) => (
        <StepRow key={s.id} step={s} />
      ))}
    </div>
  );
}
