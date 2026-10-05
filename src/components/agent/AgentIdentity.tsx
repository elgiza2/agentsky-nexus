import Claude from "@lobehub/icons/es/Claude";
import OpenClaw from "@lobehub/icons/es/OpenClaw";
import { Bot, Film } from "lucide-react";
import { AgentOrb, type OrbState } from "./AgentOrb";
import type { AgentColor } from "@/lib/agentsky/client";

function ProviderMark({ name, size }: { name: string; size: number }) {
  const value = name.toLowerCase();
  if (value.includes("claude")) return <Claude size={size} />;
  if (value.includes("openclaw") || value === "megsy") return <OpenClaw size={size} />;
  if (value.includes("higgsfield") || value.includes("hypit")) return <Film size={size} strokeWidth={2.4} />;
  return <Bot size={size} strokeWidth={2.2} />;
}

export function AgentIdentity({ name, color, state = "idle", size = 44, className = "" }: {
  name: string; color?: AgentColor; state?: OrbState; size?: number; className?: string;
}) {
  return <div className={`ag-identity ${className}`} style={{ ["--identity-size" as string]: `${size}px` }}>
    <span className="ag-identity__mark" aria-hidden="true"><ProviderMark name={name} size={Math.max(12, Math.round(size * .26))} /></span>
    <AgentOrb size={size} color={color} state={state} />
  </div>;
}
