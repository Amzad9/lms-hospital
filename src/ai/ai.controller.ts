/**
 * @file ai.controller.ts
 *
 * REST controller for the Hospital AI Agent.
 *
 * Endpoints:
 *  POST /api/ai/chat        — send a message to the agent
 *  DELETE /api/ai/session   — clear conversation history for a session
 *
 * Authentication:
 *  The @UseGuards(AuthGuard) decorator is left commented out below.
 *  Uncomment to restrict the AI endpoints to authenticated users only.
 *  The existing JWT AuthGuard from src/auth/auth.guard.ts is compatible.
 *
 * Swagger:
 *  @ApiTags and @ApiOperation decorators are included for auto-documentation.
 */

import {
  Body,
  Controller,
  Delete,
  HttpCode,
  HttpStatus,
  Logger,
  Param,
  Post,
} from '@nestjs/common';
import {
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { AiService } from './ai.service';
import { ChatRequestDto } from './dto/chat-request.dto';

@ApiTags('AI Agent')
@Controller('ai')
export class AiController {
  private readonly logger = new Logger(AiController.name);

  constructor(private readonly aiService: AiService) {}

  /**
   * POST /api/ai/chat
   *
   * Send a natural-language message to the hospital agent.
   * The agent will reason through the request, call the appropriate tools,
   * and return a plain-English response.
   *
   * @example
   *  POST /api/ai/chat
   *  { "message": "Register Ahmed Khan for OPD with Dr. Sharma", "sessionId": "sess-001" }
   */
  @Post('chat')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Send a message to the hospital AI agent',
    description:
      'The agent will reason, call internal tools (patient, visit, queue, doctor), ' +
      'and return a natural-language response. Supports multi-turn conversation via sessionId.',
  })
  @ApiResponse({
    status: 200,
    description: 'Agent response with final reply and metadata.',
    schema: {
      example: {
        reply:
          'Ahmed Khan has been registered. Visit created with Dr. Sharma (OPD). Queue number: 12.',
        sessionId: 'sess-001',
        iterations: 5,
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Validation error — message is required.' })
  @ApiResponse({ status: 500, description: 'Internal error in AI pipeline.' })
  async chat(@Body() dto: ChatRequestDto) {
    this.logger.log(`POST /ai/chat — session="${dto.sessionId ?? 'default'}"`);

    const result = await this.aiService.chat(
      dto.message,
      dto.sessionId ?? 'default',
    );

    return {
      success: true,
      data: result,
    };
  }

  /**
   * DELETE /api/ai/session/:sessionId
   *
   * Clear the conversation memory for the given session.
   * Call this when the user explicitly starts a fresh conversation.
   */
  @Delete('session/:sessionId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Clear conversation memory for a session' })
  @ApiParam({ name: 'sessionId', description: 'The session ID to clear' })
  @ApiResponse({ status: 200, description: 'Session cleared successfully.' })
  clearSession(@Param('sessionId') sessionId: string) {
    this.logger.log(`DELETE /ai/session/${sessionId}`);
    this.aiService.clearSession(sessionId);
    return {
      success: true,
      message: `Session "${sessionId}" has been cleared.`,
    };
  }
}
