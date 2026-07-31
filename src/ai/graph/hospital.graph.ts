/**
 * @file hospital.graph.ts
 *
 * LangGraph StateGraph that orchestrates the hospital agent.
 *
 * ┌─────────────────────────────────────────────────────────────────────┐
 * │  GRAPH FLOW                                                         │
 * │                                                                     │
 * │   START                                                             │
 * │     │                                                               │
 * │     ▼                                                               │
 * │  ┌──────────┐                                                       │
 * │  │ planner  │  ← calls OpenAI LLM, decides next step               │
 * │  └──────────┘                                                       │
 * │     │                                                               │
 * │     ├── has tool_calls ──────► ┌──────────┐                        │
 * │     │                          │ executor │  ← runs tools          │
 * │     │                          └──────────┘                        │
 * │     │                               │                              │
 * │     │                               └── back to planner ──────┐   │
 * │     │                                                          │   │
 * │     └── no tool_calls ──────────────────────────────► END ◄───┘   │
 * └─────────────────────────────────────────────────────────────────────┘
 *
 * The state (AgentState) flows through the graph.  Each node returns a
 * *partial* state and LangGraph merges it using the annotated reducer.
 *
 * LangGraph concepts used:
 *  - StateGraph      — the container for nodes and edges
 *  - Annotation      — defines the state shape with merge reducers
 *  - MessagesAnnotation — not used directly; we use a custom reducer
 *  - addMessages     — a built-in reducer that appends new messages
 */

import { Injectable, Logger } from '@nestjs/common';
import {
  StateGraph,
  Annotation,
  START,
  END,
} from '@langchain/langgraph';
import { PlannerService } from '../planner/planner.service';
import { ToolExecutorService } from '../executor/tool-executor.service';
import { AgentState, AgentMessage } from '../interfaces/agent-state.interface';

// ─── State Annotation ─────────────────────────────────────────────────────────
//
// LangGraph requires a state annotation that describes the shape of the state
// AND how to merge partial updates from nodes (the "reducer").
//
// For messages, we REPLACE rather than append because PlannerService already
// accumulates the full list and returns it.  This keeps the reducer simple.
//
const HospitalStateAnnotation = Annotation.Root({
  messages: Annotation<AgentMessage[]>({
    // Replace strategy: the node returns the full updated message list
    reducer: (current: AgentMessage[], incoming: AgentMessage[]) => incoming,
    default: () => [],
  }),
  next: Annotation<AgentState['next']>({
    reducer: (_current, incoming) => incoming,
    default: () => 'planner',
  }),
  iteration: Annotation<number>({
    reducer: (_current, incoming) => incoming,
    default: () => 0,
  }),
});

/** The type LangGraph infers from the annotation */
type HospitalState = typeof HospitalStateAnnotation.State;

@Injectable()
export class HospitalGraph {
  private readonly logger = new Logger(HospitalGraph.name);

  constructor(
    private readonly plannerService: PlannerService,
    private readonly toolExecutorService: ToolExecutorService,
  ) {}

  /**
   * Build and compile the LangGraph StateGraph.
   *
   * Called once per agent invocation from AiService.
   * The compiled graph is a runnable that accepts an initial state and
   * returns the final state after all nodes have executed.
   */
  buildGraph() {
    const graph = new StateGraph(HospitalStateAnnotation)
      // ── Node: planner ────────────────────────────────────────────────────────
      .addNode('planner', async (state: HospitalState) => {
        this.logger.log(`[graph] → planner node`);
        const delta = await this.plannerService.plan(state as AgentState);
        return delta as Partial<HospitalState>;
      })
      // ── Node: executor ───────────────────────────────────────────────────────
      .addNode('executor', async (state: HospitalState) => {
        this.logger.log(`[graph] → executor node`);

        // Find the last assistant message that contains tool calls
        const lastAssistantMsg = [...state.messages]
          .reverse()
          .find((m) => m.role === 'assistant' && m.tool_calls?.length);

        if (!lastAssistantMsg?.tool_calls?.length) {
          this.logger.warn('[graph] executor called but no tool_calls found');
          return { next: 'end' } as Partial<HospitalState>;
        }

        // Execute all requested tool calls
        const toolResults = await this.toolExecutorService.executeAll(
          lastAssistantMsg.tool_calls,
        );

        // Append tool results to the conversation and go back to planner
        return {
          messages: [...state.messages, ...toolResults],
          next: 'planner',
        } as Partial<HospitalState>;
      })
      // ── Entry point ──────────────────────────────────────────────────────────
      .addEdge(START, 'planner')
      // ── Conditional edge from planner ────────────────────────────────────────
      // After each planner turn, route based on the `next` field in state
      .addConditionalEdges(
        'planner',
        (state: HospitalState) => state.next,
        {
          executor: 'executor',
          end: END,
          // Guard: if next is somehow 'planner' again, go to END to avoid loops
          planner: END,
        },
      )
      // ── After executor always go back to planner ─────────────────────────────
      .addEdge('executor', 'planner');

    return graph.compile();
  }

  /**
   * Run the compiled graph for a single user message and return the
   * final AgentState after the graph has reached END.
   *
   * @param userMessage   The raw user text (e.g., "Register Ahmed Khan for OPD").
   * @param history       Prior conversation messages for multi-turn context.
   * @returns             Final AgentState with the complete message thread.
   */
  async run(userMessage: string, history: AgentMessage[]): Promise<AgentState> {
    this.logger.log(
      `[graph] Starting run — history length: ${history.length}`,
    );

    const compiledGraph = this.buildGraph();

    // Seed the initial state with existing history + the new user message
    const initialState: HospitalState = {
      messages: [
        ...history,
        { role: 'user', content: userMessage },
      ],
      next: 'planner',
      iteration: 0,
    };

    const finalState = await compiledGraph.invoke(initialState);

    this.logger.log(
      `[graph] Run complete — total messages: ${finalState.messages.length}, ` +
        `iterations: ${finalState.iteration}`,
    );

    return finalState as AgentState;
  }
}
