import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateCommentDto {
  @ApiProperty({ example: 'Verified patch on staging environment.', description: 'Discussion comment text' })
  @IsString()
  @IsNotEmpty()
  text: string;
}
