/** Runs OpenClaw through AgentSky while preserving Megsy's original chat surface. */
import type React from "react";
import { agentApi, openStream, type AgentRequest, type RawEvent } from "@/lib/agentsky/client";
import { buildTranscript, type AgentTurn, type Lang } from "@/lib/agentsky/transcript";
import type { Message, ToolPart } from "../chatConstants";
import type { AttachedFile } from "../hooks/useAttachments";

type Args = {
  text: string;
  userMsg: Message;
  localTurnId: string;
  sessionId?: string;
  agentId?: string;
  lang: Lang;
  images?: string[];
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
  setInput: (value: string) => void;
  setAttachedFiles: React.Dispatch<React.SetStateAction<AttachedFile[]>>;
  setIsLoading: (value: boolean) => void;
  setIsThinking: (value: boolean) => void;
  abortControllerRef: React.MutableRefObject<AbortController | null>;
  createOrUpdateConversation: (title: string) => Promise<string | null>;
  saveMessage: (
    conversationId: string,
    role: "user" | "assistant",
    content: string,
    images?: string[],
    metadata?: Record<string, unknown>,
  ) => Promise<string | undefined>;
  ownInsertedIdsRef: React.MutableRefObject<Set<string>>;
  onRequests: (requests: AgentRequest[]) => void;
  onSession: (sessionId: string) => void;
};

const toToolParts = (turn?: AgentTurn): ToolPart[] | undefined =>
  turn?.steps
    .filter((step) => step.kind !== "thought")
    .map((step) => ({
      id: step.id,
      name: step.label,
      state: step.status === "active" ? "running" : step.status,
    }));

export async function runAgentSkyTurn(args: Args): Promise<void> {
  const assistantClientId = `assistant-${args.localTurnId}`;
  const controller = new AbortController();
  args.abortControllerRef.current = controller;
  args.setMessages((prev) => [
    ...prev,
    args.userMsg,
    { role: "assistant", content: "", clientId: assistantClientId, agentPending: true, modelLabel: "OpenClaw · gpt-5.6-luna" },
  ]);
  args.setInput("");
  args.setAttachedFiles([]);
  args.setIsLoading(true);
  args.setIsThinking(true);

  let sid = args.sessionId;
  let events: RawEvent[] = [];
  try {
    const conversationPromise = args.createOrUpdateConversation(args.text || "New chat");
    if (!sid) {
      const created = await agentApi.createSession({ agentId: args.agentId, text: args.text, images: args.images });
      sid = created.session.id;
    } else {
      await agentApi.send(sid, args.text, args.images);
    }
    const activeSid = sid;
    args.onSession(activeSid);
    controller.signal.addEventListener("abort", () => void agentApi.interrupt(activeSid).catch(() => undefined), { once: true });

    const apply = () => {
      const turns = buildTranscript(events, args.lang, true);
      const turn = [...turns].reverse().find((item): item is AgentTurn => item.type === "agent");
      args.setMessages((prev) => prev.map((message) => message.clientId === assistantClientId ? {
        ...message,
        content: turn?.text || "",
        agentPending: !turn?.text && !turn?.steps.length,
        reasoning: turn?.steps.filter((step) => step.kind === "thought").map((step) => step.detail || step.label).join("\n"),
        toolParts: toToolParts(turn),
        agentSkySessionId: activeSid,
        agentSkyCards: turn?.cards,
      } : message));
    };

    await openStream(activeSid, (event) => {
      events.push(event);
      apply();
    }, controller.signal);
    if (controller.signal.aborted) return;

    const latest = await agentApi.events(activeSid);
    events = latest.events;
    const turns = buildTranscript(events, args.lang, false);
    const turn = [...turns].reverse().find((item): item is AgentTurn => item.type === "agent");
    apply();
    const requests = await agentApi.requests(activeSid).catch(() => ({ requests: [], sessions: [] }));
    args.onRequests(requests.requests);
    args.setMessages((prev) => prev.map((message) => message.clientId === assistantClientId ? {
      ...message,
      agentSkyRequests: requests.requests,
    } : message));
    const conversationId = await conversationPromise;
    if (conversationId) {
      const userId = await args.saveMessage(conversationId, "user", args.userMsg.content);
      if (userId) args.ownInsertedIdsRef.current.add(userId);
      const metadata = {
        kind: "agentSky",
        agentSkySessionId: activeSid,
        agentSkyCards: turn?.cards ?? [],
        agentSkyRequests: requests.requests,
        reasoning: turn?.steps.filter((step) => step.kind === "thought").map((step) => step.detail || step.label).join("\n") || undefined,
        toolParts: toToolParts(turn),
        modelLabel: "OpenClaw · gpt-5.6-luna",
      };
      const assistantId = await args.saveMessage(conversationId, "assistant", turn?.text || "", undefined, metadata);
      if (assistantId) args.ownInsertedIdsRef.current.add(assistantId);
      args.setMessages((prev) => prev.map((message) => message.clientId === assistantClientId ? { ...message, id: assistantId, agentPending: false } : message));
      window.dispatchEvent(new CustomEvent("megsy:conversations-changed"));
    }
  } catch (error) {
    if (!controller.signal.aborted) {
      const message = error instanceof Error ? error.message : "تعذّر تشغيل الوكيل. جرّب تاني.";
      args.setMessages((prev) => prev.map((item) => item.clientId === assistantClientId ? { ...item, content: message, agentPending: false } : item));
    }
  } finally {
    if (args.abortControllerRef.current === controller) args.abortControllerRef.current = null;
    args.setIsLoading(false);
    args.setIsThinking(false);
  }
}