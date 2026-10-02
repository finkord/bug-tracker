import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Query,
  Body,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  Res,
  BadRequestException,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Response } from 'express';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse, ApiConsumes } from '@nestjs/swagger';
import { TeamsService } from './teams.service.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { Public } from '../../common/decorators/public.decorator.js';
import { type UploadedFileInput } from '../storage/services/seaweedfs.service.js';
import {
  CreateTeamDto,
  UpdateTeamDto,
  AddTeamMemberDto,
  UpdateTeamMemberDto,
} from './dto/team.dto.js';

@ApiTags('Scrum Teams & Capacity')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('teams')
export class TeamsController {
  constructor(private readonly teamsService: TeamsService) {}

  @Get()
  @ApiOperation({
    summary: 'List Scrum Teams',
    description: 'Returns all Scrum teams, optionally filtered by project ID, with lead and member rosters.',
  })
  async listTeams(@Query('projectId') projectId?: string) {
    const pId = projectId ? parseInt(projectId, 10) : undefined;
    return this.teamsService.findAll(pId);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get Scrum Team details by ID',
    description: 'Returns team details, project binding, member capacities, and sprint history.',
  })
  async getTeam(@Param('id', ParseIntPipe) id: number) {
    return this.teamsService.findById(id);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create a new Scrum Team',
    description: 'Registers a new Scrum Team bound to a project with default sprint capacity.',
  })
  async createTeam(@Body() dto: CreateTeamDto) {
    return this.teamsService.create(dto);
  }

  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Update Scrum Team details',
    description: 'Updates team name, description, project binding, team lead, or sprint capacity.',
  })
  async updateTeam(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateTeamDto,
  ) {
    return this.teamsService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Delete Scrum Team',
  })
  async deleteTeam(@Param('id', ParseIntPipe) id: number) {
    return this.teamsService.delete(id);
  }

  @Post(':id/members')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Add a member to Scrum Team',
    description: 'Assigns a user to the Scrum Team with a specific role and weekly capacity hours.',
  })
  async addMember(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: AddTeamMemberDto,
  ) {
    return this.teamsService.addMember(id, dto);
  }

  @Patch(':id/members/:memberId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Update Scrum Team member role or capacity',
  })
  async updateMember(
    @Param('id', ParseIntPipe) id: number,
    @Param('memberId', ParseIntPipe) memberId: number,
    @Body() dto: UpdateTeamMemberDto,
  ) {
    return this.teamsService.updateMember(id, memberId, dto);
  }

  @Delete(':id/members/:memberId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Remove a member from Scrum Team',
  })
  async removeMember(
    @Param('id', ParseIntPipe) id: number,
    @Param('memberId', ParseIntPipe) memberId: number,
  ) {
    return this.teamsService.removeMember(id, memberId);
  }

  @Get(':id/capacity')
  @ApiOperation({
    summary: 'Calculate aggregated sprint capacity for Scrum Team',
    description: 'Computes total engineering hours available for a given sprint duration in weeks.',
  })
  async getCapacity(
    @Param('id', ParseIntPipe) id: number,
    @Query('sprintWeeks') sprintWeeks?: string,
  ) {
    const weeks = sprintWeeks ? parseInt(sprintWeeks, 10) : 2;
    return this.teamsService.calculateCapacity(id, weeks);
  }

  @Post(':id/avatar/upload')
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(FileInterceptor('avatar', { limits: { fileSize: 5 * 1024 * 1024 } }))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({
    summary: 'Upload team avatar image file directly to SeaweedFS distributed storage',
  })
  async uploadAvatar(
    @Param('id', ParseIntPipe) id: number,
    @UploadedFile() file: UploadedFileInput | undefined,
  ) {
    if (!file) {
      throw new BadRequestException('Image file is required');
    }
    const updated = await this.teamsService.uploadAvatar(id, file);
    return {
      message: 'Team avatar uploaded successfully',
      avatarUrl: updated.avatarUrl,
    };
  }

  @Patch(':id/avatar')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Update team avatar URL or preset',
  })
  async updateAvatar(
    @Param('id', ParseIntPipe) id: number,
    @Body('avatarUrl') avatarUrl: string,
  ) {
    const updated = await this.teamsService.update(id, { avatarUrl });
    return {
      message: 'Team avatar updated successfully',
      avatarUrl: updated.avatarUrl,
    };
  }

  @Public()
  @Get('avatar/:fid')
  @ApiOperation({
    summary: 'Stream team avatar image directly from SeaweedFS object storage',
  })
  async getAvatarFile(
    @Param('fid') fid: string,
    @Res() res: Response,
  ) {
    const { buffer, contentType } = await this.teamsService.getAvatarBuffer(fid);
    res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', 'public, max-age=86400');
    res.setHeader('Content-Disposition', 'inline');
    res.send(buffer);
  }
}
