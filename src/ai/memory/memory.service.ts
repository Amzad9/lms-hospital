/**
 * @file memory.service.ts
 *
 * In-process conversation memory for the hospital agent.
 *
 * Each "session" maps a session ID (e.g., user ID or JWT subject)
 * to the ordered list of AgentMessages that represents the conversation so far.
 *
 * This is intentionally a simple in-memory store for the MVP.
 * For production scale-out, replace the Map with a Redis-backed store
 * (or use LangChain's RedisChatMessageHistory) without changing the interface.
 *
 * Thread safety: Node.js is single-threaded, so the Map is safe here.
 * If you move to worker threads, wrap writes in a mutex.
 */

import { Injectable, Logger } from '@nestjs/common';
import { AgentMessage } from '../interfaces/agent-state.interface';

/** Maximum messages kept per session (prevents unbounded memory growth) */
const MAX_HISTORY_LENGTH = 50;

@Injectable()
export class MemoryService {
  private readonly logger = new Logger(MemoryService.name);

  /**
   * Session store: sessionId → ordered conversation messages.
   * The system prompt message is prepended by PlannerService at call time,
   * not stored here, so that it can be updated without clearing history.
   */
  private readonly sessions = new Map<string, AgentMessage[]>();

  /**
   * Returns all messages for the given session.
   * Returns an empty array if the session has not yet been created.
   */
  getHistory(sessionId: string): AgentMessage[] {
    return this.sessions.get(sessionId) ?? [];
  }

  /**
   * Appends one or more messages to the session history.
   * Automatically prunes the oldest messages if the cap is exceeded.
   */
  appendMessages(sessionId: string, messages: AgentMessage[]): void {
    const current = this.sessions.get(sessionId) ?? [];
    const updated = [...current, ...messages];

    // Keep only the most recent MAX_HISTORY_LENGTH messages
    const pruned =
      updated.length > MAX_HISTORY_LENGTH
        ? updated.slice(updated.length - MAX_HISTORY_LENGTH)
        : updated;

    this.sessions.set(sessionId, pruned);

    this.logger.debug(
      `[session:${sessionId}] history length: ${pruned.length}`,
    );
  }

  /**
   * Clears the conversation history for a session.
   * Call this when the user explicitly starts a new conversation.
   */
  clearHistory(sessionId: string): void {
    this.sessions.delete(sessionId);
    this.logger.log(`[session:${sessionId}] history cleared`);
  }

  /**
   * Returns the number of active sessions currently held in memory.
   * Useful for health checks / metrics.
   */
  getActiveSessionCount(): number {
    return this.sessions.size;
  }
}
