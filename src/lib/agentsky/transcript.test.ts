import { describe, expect, it } from "vitest";
import { buildTranscript, orbStateFor } from "./transcript";

describe("AgentSky tool transcript", () => {
  it("keeps bounded tool details and prioritizes working over thought", () => {
    const turns = buildTranscript([{ id: "r", type: "agent.message", parts: [
      { type: "reasoning", stream_id: "thought", text: "checking" },
      { type: "tool_call", call_id: "call", tool_name: "python", args: { code: "print(1)", token: "secret" } },
    ] }], "en", true);
    const turn = turns.find((item) => item.type === "agent");
    if (!turn || turn.type !== "agent") throw new Error("agent turn missing");
    expect(turn.steps[1].input).toContain("print(1)");
    expect(turn.steps[1].input).not.toContain("secret");
    expect(orbStateFor(turn, true)).toBe("tool");
  });
  it("adds the real tool result and marks it complete", () => {
    const turns = buildTranscript([{ id: "e", type: "agent.message", parts: [
      { type: "tool_call", call_id: "call", tool_name: "web_search", args: { query: "Megsy" } },
      { type: "tool_result", call_id: "call", tool_name: "web_search", status: "ok", result: { count: 2 } },
    ] }], "en", false);
    const turn = turns.find((item) => item.type === "agent");
    if (!turn || turn.type !== "agent") throw new Error("agent turn missing");
    expect(turn.steps[0]).toMatchObject({ status: "done", output: expect.stringContaining('"count": 2') });
  });
});