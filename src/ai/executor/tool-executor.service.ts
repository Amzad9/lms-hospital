/**
 * @file tool-executor.service.ts
 *
 * Executes tool calls requested by the LLM planner.
 *
 * Responsibilities:
 *  - Look up the correct IAiTool instance via ToolRegistryService.
 *  - Call tool.execute(args) and capture the result.
 *  - Return results as AgentMessage items with role='tool'.
 *  - Handle unknown tool names gracefully (model hallucinations happen).
 *  - Handle individual tool failures without crashing the whole agent.
 *
 * This service is stateless — all state lives in AgentState (the graph).
 */

import { Injectable, Logger } from '@nestjs/common';
import { ToolRegistryService } from '../registry/tool-registry.service';
import { AgentMessage, ToolCall } from '../interfaces/agent-state.interface';

@Injectable()
export class ToolExecutorService {
  private readonly logger = new Logger(ToolExecutorService.name);

  constructor(private readonly registry: ToolRegistryService) {}

  /**
   * Execute a batch of tool calls in sequence.
   *
   * We process them sequentially (not in parallel) because later tool calls
   * often depend on results from earlier ones (e.g., create_visit needs the
   * patient ID returned by create_patient).
   *
   * @param toolCalls   Array of ToolCall objects from the LLM's response.
   * @returns           Array of AgentMessage (role='tool') with results.
   */
  async executeAll(toolCalls: ToolCall[]): Promise<AgentMessage[]> {
    const results: AgentMessage[] = [];

    for (const call of toolCalls) {
      const result = await this.executeOne(call);
      results.push(result);
    }

    return results;
  }

  /**
   * Execute a single tool call and return it as an AgentMessage.
   *
   * @param call  The tool invocation from the LLM response.
   * @returns     A 'tool' role message with the serialised result.
   */
  private async executeOne(call: ToolCall): Promise<AgentMessage> {
    this.logger.log(`🔧 Running tool: ${call.name}  args: ${JSON.stringify(call.arguments)}`);

    const tool = this.registry.getTool(call.name);

    if (!tool) {
      const errorMsg = `Unknown tool "${call.name}". Available tools: ${this.registry.getRegisteredNames().join(', ')}.`;
      this.logger.warn(`❌ ${errorMsg}`);
      return {
        role: 'tool',
        content: JSON.stringify({ success: false, error: errorMsg }),
        tool_call_id: call.id,
      };
    }

    try {
      const result = await tool.execute(call.arguments);
      const content = JSON.stringify(result);

      this.logger.log(`✔  Tool ${call.name} result: ${content.slice(0, 200)}`);

      return {
        role: 'tool',
        content,
        tool_call_id: call.id,
      };
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      this.logger.error(`💥 Tool ${call.name} threw: ${msg}`);

      return {
        role: 'tool',
        content: JSON.stringify({ success: false, error: msg }),
        tool_call_id: call.id,
      };
    }
  }
}
