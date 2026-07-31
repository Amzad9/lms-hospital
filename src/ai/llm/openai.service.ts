/**
 * @file openai.service.ts
 *
 * Thin, injectable wrapper around the OpenAI Node SDK.
 *
 * Responsibilities:
 *  - Provide an initialised OpenAI client (injected via ConfigService).
 *  - Expose a single `chat()` method used by PlannerService.
 *  - Convert the raw SDK response into the AgentMessage shape used by
 *    the graph state so the rest of the system never imports `openai` directly.
 *
 * Why not use @langchain/openai here?
 *  LangChain's ChatOpenAI wrapper adds a lot of abstraction we don't need.
 *  Using the raw OpenAI SDK gives us precise control over the Responses API
 *  request shape (tool_choice, parallel_tool_calls, etc.) while staying lean.
 */

import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import type { ChatCompletionMessageParam } from 'openai/resources/chat/completions';
import { AgentMessage, ToolCall } from '../interfaces/agent-state.interface';
import { ToolSchema } from '../interfaces/ai-tool.interface';
import { OpenAiConfig } from '../config/openai.config';

@Injectable()
export class OpenAiService implements OnModuleInit {
  private readonly logger = new Logger(OpenAiService.name);
  private client: OpenAI;
  private model: string;
  private temperature: number;
  private maxTokens: number;

  constructor(private readonly configService: ConfigService) {}

  /**
   * Called by NestJS after DI is resolved.
   * We initialise the OpenAI client here so that the ConfigService
   * has already been populated from .env before we read from it.
   */
  onModuleInit(): void {
    const config = this.configService.get<OpenAiConfig>('openai');

    if (!config?.apiKey) {
      throw new Error(
        '[OpenAiService] OPENAI_API_KEY is not set. ' +
          'Add it to your .env file before starting the server.',
      );
    }

    this.client = new OpenAI({ apiKey: config.apiKey });
    this.model = config.model;
    this.temperature = config.temperature;
    this.maxTokens = config.maxTokens;

    this.logger.log(`OpenAI client initialised (model: ${this.model})`);
  }

  /**
   * Calls the OpenAI Chat Completions endpoint (the "Responses API").
   *
   * @param messages  Full conversation history in AgentMessage format.
   * @param tools     JSON-schema definitions of available tools.
   * @returns         The assistant's response as an AgentMessage.
   */
  async chat(
    messages: AgentMessage[],
    tools: ToolSchema[],
  ): Promise<AgentMessage> {
    // Map our internal AgentMessage type to the OpenAI SDK type
    const sdkMessages: ChatCompletionMessageParam[] = messages.map((m) => {
      if (m.role === 'system') {
        return {
          role: 'system',
          content: m.content,
        } satisfies ChatCompletionMessageParam;
      }

      if (m.role === 'tool') {
        return {
          role: 'tool',
          content: m.content,
          tool_call_id: m.tool_call_id ?? '',
        } satisfies ChatCompletionMessageParam;
      }

      if (m.role === 'assistant' && m.tool_calls?.length) {
        return {
          role: 'assistant',
          content: m.content ?? null,
          tool_calls: m.tool_calls.map((tc) => ({
            id: tc.id,
            type: 'function' as const,
            function: {
              name: tc.name,
              arguments: JSON.stringify(tc.arguments),
            },
          })),
        } satisfies ChatCompletionMessageParam;
      }

      return {
        role: m.role as 'user' | 'assistant',
        content: m.content,
      } satisfies ChatCompletionMessageParam;
    });

    // Map our ToolSchema array to the OpenAI SDK tool format
    const sdkTools: OpenAI.Chat.ChatCompletionTool[] = tools.map((t) => ({
      type: 'function' as const,
      function: {
        name: t.name,
        description: t.description,
        parameters: t.parameters,
      },
    }));

    this.logger.log(
      `⏳ Calling OpenAI (${this.model}) — ${sdkMessages.length} messages, ${sdkTools.length} tools`,
    );

    const response = await this.client.chat.completions.create({
      model: this.model,
      temperature: this.temperature,
      max_completion_tokens: this.maxTokens,
      messages: sdkMessages,
      tools: sdkTools.length > 0 ? sdkTools : undefined,
      tool_choice: sdkTools.length > 0 ? 'auto' : undefined,
    });

    const choice = response.choices[0];
    const msg = choice.message;

    // Parse tool_calls from the SDK response into our typed ToolCall format
    const parsedToolCalls: ToolCall[] | undefined = msg.tool_calls
      ?.filter((tc) => tc.type === 'function')
      .map((tc) => {
        const fnCall = tc as { id: string; type: 'function'; function: { name: string; arguments: string } };
        return {
          id: fnCall.id,
          name: fnCall.function.name,
          arguments: JSON.parse(fnCall.function.arguments) as Record<string, unknown>,
        };
      });

    const assistantMessage: AgentMessage = {
      role: 'assistant',
      content: msg.content ?? '',
      tool_calls: parsedToolCalls,
    };

    // ── Visible log: what did the model decide to do? ─────────────────────────
    if (parsedToolCalls?.length) {
      this.logger.log(
        `🤖 Model wants to call ${parsedToolCalls.length} tool(s): ` +
          parsedToolCalls.map((tc) => `${tc.name}(${JSON.stringify(tc.arguments)})`).join(' | '),
      );
    } else {
      this.logger.log(`✅ Model gave final answer: "${(msg.content ?? '').slice(0, 120)}"`);
    }

    return assistantMessage;
  }
}
