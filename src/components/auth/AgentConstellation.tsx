import { useEffect, useRef } from "react";
import { AgentIdentity } from "@/components/agent/AgentIdentity";

const agents = [
  { name: "Claude", color: "ember" as const, x: -106, y: 18, size: 50 },
  { name: "Megsy", color: "aurora" as const, x: 0, y: -18, size: 82 },
  { name: "OpenClaw", color: "ocean" as const, x: 106, y: 18, size: 50 },
  { name: "higgsfield", color: "sun" as const, x: -62, y: 85, size: 42 },
  { name: "Hermes", color: "mint" as const, x: 62, y: 85, size: 42 },
];

export function AgentConstellation() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const node = ref.current;
    if (!node || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const move = (x: number, y: number) => {
      node.style.setProperty("--tilt-x", `${Math.max(-1, Math.min(1, x))}`);
      node.style.setProperty("--tilt-y", `${Math.max(-1, Math.min(1, y))}`);
    };
    const pointer = (event: PointerEvent) => move((event.clientX / innerWidth - .5) * 2, (event.clientY / innerHeight - .5) * 2);
    const orient = (event: DeviceOrientationEvent) => move((event.gamma ?? 0) / 35, (event.beta ?? 0) / 45);
    window.addEventListener("pointermove", pointer, { passive: true });
    window.addEventListener("deviceorientation", orient, { passive: true });
    return () => { window.removeEventListener("pointermove", pointer); window.removeEventListener("deviceorientation", orient); };
  }, []);
  return <div ref={ref} className="megsy-agent-constellation" aria-label="Megsy agents">
    {agents.map((agent, index) => <div key={agent.name} className="megsy-agent-constellation__item" style={{ ["--agent-x" as string]: `${agent.x}px`, ["--agent-y" as string]: `${agent.y}px`, ["--agent-depth" as string]: String(index % 3 + 1) }}>
      <AgentIdentity name={agent.name} color={agent.color} state={agent.name === "Megsy" ? "hello" : "idle"} size={agent.size} />
    </div>)}
  </div>;
}