/**
 * @file ai.service.ts
 *
 * The public-facing AI service consumed by AiController.
 *
 * Responsibilities:
 *  - Accept a user message + optional session ID.
 *  - Load conversation history from MemoryService.
 *  - Invoke HospitalGraph.run() with the message + history.
 *  - Persist the updated conversation history to MemoryService.
 *  - Extract and return the final assistant reply.
 *
 * This service is the ONLY entry point into the agent layer.
 * It purposefully has no knowledge of OpenAI, LangGraph, or tools.
 */

import { Injectable, Logger } from '@nestjs/common';
import { HospitalGraph } from './graph/hospital.graph';
import { MemoryService } from './memory/memory.service';
import { AgentMessage } from './interfaces/agent-state.interface';

export interface ChatResponse {
  /** The final natural-language reply from the agent */
  reply: string;
  /** Session ID echoed back so the client can persist it */
  sessionId: string;
  /** Number of planner ↔ executor cycles used */
  iterations: number;
}

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);

  constructor(
    private readonly graph: HospitalGraph,
    private readonly memory: MemoryService,
  ) {}

  /**
   * Process a user message through the full agentic pipeline.
   *
   * @param message    The user's natural-language request.
   * @param sessionId  Session identifier for conversation continuity.
   *                   Defaults to 'default' for single-session setups.
   * @returns          ChatResponse with the agent's final reply.
   */
  async chat(message: string, sessionId = 'default'): Promise<ChatResponse> {
    console.log("message", message)
    this.logger.log(
      `[AiService.chat] session="${sessionId}" message="${message.slice(0, 80)}..."`,
    );

    // 1. Load prior conversation history for this session
    const history = this.memory.getHistory(sessionId);
    this.logger.debug(`[session:${sessionId}] loaded ${history.length} history messages`);

    // 2. Run the full LangGraph agent pipeline
    const finalState = await this.graph.run(message, history);

    // 3. Persist the NEW messages (all messages AFTER the history we loaded)
    //    We re-save the entire final thread for simplicity and correctness.
    //    MemoryService prunes at MAX_HISTORY_LENGTH automatically.
    const newMessages = finalState.messages.slice(history.length);
    this.memory.appendMessages(sessionId, newMessages);

    // 4. Extract the final assistant reply — the LAST 'assistant' message
    //    that has no tool_calls (i.e., the natural-language conclusion).
    const finalReply = this.extractFinalReply(finalState.messages);

    this.logger.log(
      `[AiService.chat] session="${sessionId}" reply="${finalReply.slice(0, 80)}..."`,
    );

    return {
      reply: finalReply,
      sessionId,
      iterations: finalState.iteration,
    };
  }

  /**
   * Clear the conversation history for a session.
   * Useful when the user starts a new conversation explicitly.
   */
  clearSession(sessionId: string): void {
    this.memory.clearHistory(sessionId);
    this.logger.log(`[AiService] session "${sessionId}" cleared`);
  }

  /**
   * Walk the message list from the end to find the last assistant message
   * that contains text content (not just tool calls).
   */
  private extractFinalReply(messages: AgentMessage[]): string {
    const reversed = [...messages].reverse();

    for (const msg of reversed) {
      if (msg.role === 'assistant' && msg.content?.trim()) {
        return msg.content.trim();
      }
    }

    // Fallback — should never happen if the graph is configured correctly
    return 'I have completed the requested operation. Please check the hospital system for the updated records.';
  }
}
