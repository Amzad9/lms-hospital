/**
 * @file chat-request.dto.ts
 *
 * Validated DTO for the POST /ai/chat endpoint.
 * class-validator is used globally via ValidationPipe in main.ts.
 */

import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ChatRequestDto {
  /**
   * The user's natural-language instruction to the hospital agent.
   * Example: "Register Ahmed Khan for OPD with Dr. Sharma."
   */
  @ApiProperty({
    description: "Natural-language instruction for the hospital AI agent.",
    example: "Register Ahmed Khan, age 32, mobile 9876543210, for OPD with Dr. Sharma.",
  })
  @IsString()
  @IsNotEmpty({ message: 'message must not be empty' })
  @MaxLength(2000)
  message: string;

  /**
   * Optional session identifier for multi-turn conversation memory.
   * Use a stable ID per user session (e.g., JWT subject or UUID).
   * If omitted, the agent runs in stateless mode (no history).
   */
  @ApiPropertyOptional({
    description:
      "Optional session ID to enable multi-turn conversation memory. " +
      "Use the same ID across requests to maintain context.",
    example: "user-session-abc123",
  })
  @IsOptional()
  @IsString()
  @MaxLength(128)
  sessionId?: string;
}
