/**
 * @file ai-tool.interface.ts
 *
 * Defines the contracts every AI tool must satisfy.
 * A tool is a thin adapter that bridges the LLM function-call layer
 * with an existing NestJS service.  It must NOT touch MongoDB directly.
 *
 * IAiTool      — runtime contract (execute + schema)
 * ToolSchema   — the JSON-Schema fragment sent to OpenAI as a "function"
 */

/** JSON-Schema shape accepted by the OpenAI function-calling API */
export interface ToolSchema {
  /** Tool name as it will appear in OpenAI function calls */
  name: string;
  /** Human-readable description the model uses to decide when to call it */
  description: string;
  /** JSON Schema for the arguments object */
  parameters: {
    type: 'object';
    properties: Record<string, unknown>;
    required?: string[];
  };
}

/**
 * Every AI Tool must implement this interface.
 *
 * @example
 *  class PatientTool implements IAiTool {
 *    get schema() { ... }
 *    async execute(args) { ... }
 *  }
 */
export interface IAiTool {
  /** Returns the OpenAI-compatible JSON schema for this tool */
  readonly schema: ToolSchema;

  /**
   * Executes the tool with the arguments parsed by the LLM.
   * Must return a serialisable value (string | plain object).
   * Must NEVER throw — wrap errors and return an error-shaped object.
   */
  execute(args: Record<string, unknown>): Promise<unknown>;
}
