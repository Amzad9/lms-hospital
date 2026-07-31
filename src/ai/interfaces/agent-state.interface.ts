/**
 * @file agent-state.interface.ts
 *
 * Defines the typed state object that flows through every node of the
 * LangGraph hospital agent graph.  LangGraph requires the state to be a
 * plain, serialisable object — no class instances, no Mongoose documents.
 *
 * The graph reads and writes this object; individual nodes receive and
 * return a *partial* state (Partial<AgentState>) which LangGraph merges
 * using the reducer defined in hospital.graph.ts.
 */

/** A single message in the conversation / tool-call thread */
export interface AgentMessage {
  /** 'system' | 'user' | 'assistant' | 'tool' */
  role: 'system' | 'user' | 'assistant' | 'tool';
  /** Text content of the message */
  content: string;
  /** Present when role === 'tool' — references the call that produced this result */
  tool_call_id?: string;
  /** Present when role === 'assistant' and the model requested tool calls */
  tool_calls?: ToolCall[];
}

/** A tool invocation requested by the model */
export interface ToolCall {
  /** Unique ID assigned by OpenAI for this specific call */
  id: string;
  /** The name of the tool function to invoke */
  name: string;
  /** JSON-parsed arguments object */
  arguments: Record<string, unknown>;
}

/**
 * The full, typed LangGraph state for the hospital agent.
 *
 * This is the *canonical* state shape.  Every node in hospital.graph.ts
 * must only read/write fields declared here.
 */
export interface AgentState {
  /**
   * The full conversation thread including user message, assistant reasoning
   * turns, tool results, and the final assistant reply.
   */
  messages: AgentMessage[];

  /**
   * Signals to the graph router which node to visit next.
   * 'planner'  — call the LLM planner
   * 'executor' — execute the pending tool calls
   * 'end'      — the agent is done; surface the final answer
   */
  next: 'planner' | 'executor' | 'end';

  /**
   * How many planner ↔ executor cycles have completed.
   * Guards against infinite loops (capped at MAX_ITERATIONS in the graph).
   */
  iteration: number;
}
