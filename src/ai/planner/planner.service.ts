/**
 * @file planner.service.ts
 *
 * The Planner is the "brain" of the agent — it calls the LLM and decides
 * what to do next based on the current AgentState.
 *
 * Responsibilities:
 *  - Prepend the system prompt to the message list before every LLM call.
 *  - Call OpenAiService.chat() with the full message history + tool schemas.
 *  - Parse the assistant response to determine the next graph transition:
 *      → 'executor'  if the model requested tool calls
 *      → 'end'       if the model produced a final natural-language answer
 *  - Return a partial AgentState for LangGraph to merge.
 *
 * This service is stateless — it reads state from the graph and returns a delta.
 */

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OpenAiService } from '../llm/openai.service';
import { ToolRegistryService } from '../registry/tool-registry.service';
import { AgentState, AgentMessage } from '../interfaces/agent-state.interface';
import { buildSystemPrompt } from '../prompts/system.prompt';
import { OpenAiConfig } from '../config/openai.config';

@Injectable()
export class PlannerService {
  private readonly logger = new Logger(PlannerService.name);
  private maxIterations: number;

  constructor(
    private readonly openAiService: OpenAiService,
    private readonly toolRegistry: ToolRegistryService,
    private readonly configService: ConfigService,
  ) {
    const config = this.configService.get<OpenAiConfig>('openai');
    this.maxIterations = config?.maxIterations ?? 10;
  }

  /**
   * Run one "planner turn":
   *  1. Build the full message list (system prompt + history).
   *  2. Call the LLM with all registered tool schemas.
   *  3. Determine next state transition.
   *
   * @param state  Current graph state.
   * @returns      Partial AgentState delta (LangGraph merges it).
   */
  async plan(state: AgentState): Promise<Partial<AgentState>> {
    this.logger.log(
      `📋 Planner turn ${state.iteration + 1} — conversation has ${state.messages.length} message(s)`,
    );

    // Hard-stop guard: prevent infinite planner loops
    if (state.iteration >= this.maxIterations) {
      this.logger.warn(
        `Max iterations (${this.maxIterations}) reached — forcing END`,
      );
      const stopMessage: AgentMessage = {
        role: 'assistant',
        content:
          "I've reached the maximum number of steps. " +
          "Here is what I completed so far based on prior tool results.",
      };
      return {
        messages: [...state.messages, stopMessage],
        next: 'end',
        iteration: state.iteration + 1,
      };
    }

    // Build the full message list: [system prompt, ...history]
    // The 'system' role instructs OpenAI to treat this as the persona/rules message.
    const systemMessage: AgentMessage = {
      role: 'system',
      content: buildSystemPrompt(),
    };

    const allMessages: AgentMessage[] = [
      systemMessage,
      ...state.messages,
    ];

    const tools = this.toolRegistry.getAllSchemas();

    // Call the LLM
    const assistantMessage = await this.openAiService.chat(allMessages, tools);

    this.logger.debug(
      `LLM response — has tool_calls: ${Boolean(assistantMessage.tool_calls?.length)}`,
    );

    // Decide next step
    const hasToolCalls = Boolean(assistantMessage.tool_calls?.length);
    const next: AgentState['next'] = hasToolCalls ? 'executor' : 'end';

    return {
      messages: [...state.messages, assistantMessage],
      next,
      iteration: state.iteration + 1,
    };
  }
}
