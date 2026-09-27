import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Issue } from '../entities/issue.entity.js';
import { IssueLink, IssueLinkType } from '../entities/issue-link.entity.js';
import { CreateIssueLinkDto } from '../dto/create-issue-link.dto.js';
import type { IssueLinkItemDto } from '../dto/issue-response.dto.js';

/**
 * Service responsible for managing semantic dependencies and relationships between issues.
 */
@Injectable()
export class IssueLinksService {
  constructor(
    @InjectRepository(Issue)
    private readonly issueRepository: Repository<Issue>,
    @InjectRepository(IssueLink)
    private readonly issueLinkRepository: Repository<IssueLink>,
  ) {}

  /**
   * Retrieves all incoming and outgoing semantic links for a given issue.
   */
  async getIssueLinks(issueId: number): Promise<IssueLinkItemDto[]> {
    const rawLinks = await this.issueLinkRepository
      .createQueryBuilder('link')
      .leftJoinAndSelect('link.sourceIssue', 'sourceIssue')
      .leftJoinAndSelect('sourceIssue.project', 'sourceProject')
      .leftJoinAndSelect('link.targetIssue', 'targetIssue')
      .leftJoinAndSelect('targetIssue.project', 'targetProject')
      .where('link.sourceIssueId = :issueId OR link.targetIssueId = :issueId', { issueId })
      .orderBy('link.createdAt', 'DESC')
      .getMany();
    return rawLinks.map((link) => this.mapLinkItem(link, issueId));
  }

  /**
   * Creates a semantic dependency link between two issues.
   */
  async createIssueLink(sourceIssueId: number, dto: CreateIssueLinkDto): Promise<IssueLinkItemDto> {
    const sourceIssue = await this.issueRepository.findOne({
      where: { id: sourceIssueId },
      relations: { project: true },
    });
    if (!sourceIssue) {
      throw new NotFoundException(`Source issue #${sourceIssueId} not found`);
    }
    const targetIssue = await this.findTargetIssue(String(dto.targetIssueKeyOrId).trim());
    if (sourceIssue.id === targetIssue.id) {
      throw new BadRequestException('Cannot link an issue to itself');
    }
    const existing = await this.issueLinkRepository.findOne({
      where: [
        { sourceIssueId: sourceIssue.id, targetIssueId: targetIssue.id, linkType: dto.linkType },
        { sourceIssueId: targetIssue.id, targetIssueId: sourceIssue.id, linkType: dto.linkType },
      ],
    });
    if (existing) {
      throw new BadRequestException('This link relationship already exists between these two issues');
    }
    const link = this.issueLinkRepository.create({
      sourceIssueId: sourceIssue.id,
      targetIssueId: targetIssue.id,
      linkType: dto.linkType,
    });
    await this.issueLinkRepository.save(link);
    const allLinks = await this.getIssueLinks(sourceIssue.id);
    const created = allLinks.find((l) => l.id === link.id);
    if (!created) {
      throw new NotFoundException('Failed to retrieve created link');
    }
    return created;
  }

  /**
   * Deletes an issue link by ID.
   */
  async deleteIssueLink(linkId: number): Promise<{ success: boolean; message: string }> {
    const link = await this.issueLinkRepository.findOne({ where: { id: linkId } });
    if (!link) {
      throw new NotFoundException(`Issue link #${linkId} not found`);
    }
    await this.issueLinkRepository.remove(link);
    return { success: true, message: 'Issue link removed successfully' };
  }

  private async findTargetIssue(targetRaw: string): Promise<Issue> {
    let targetIssue: Issue | null = null;
    const keyMatch = targetRaw.match(/^([a-zA-Z0-9_-]+)-(\d+)$/);
    if (keyMatch) {
      const [, projKey, issueNumStr] = keyMatch;
      const issueNum = parseInt(issueNumStr, 10);
      targetIssue = await this.issueRepository
        .createQueryBuilder('issue')
        .leftJoinAndSelect('issue.project', 'project')
        .where('LOWER(project.key) = LOWER(:projKey)', { projKey })
        .andWhere('issue.issueNum = :issueNum', { issueNum })
        .getOne();
    }
    if (!targetIssue && /^\d+$/.test(targetRaw)) {
      const targetId = parseInt(targetRaw, 10);
      targetIssue = await this.issueRepository.findOne({
        where: { id: targetId },
        relations: { project: true },
      });
    }
    if (!targetIssue) {
      throw new NotFoundException(`Target issue "${targetRaw}" not found`);
    }
    return targetIssue;
  }

  private mapLinkItem(link: IssueLink, currentIssueId: number): IssueLinkItemDto {
    const isSource = link.sourceIssueId === currentIssueId;
    const otherIssue = isSource ? link.targetIssue : link.sourceIssue;
    const otherProject = isSource ? link.targetIssue?.project : link.sourceIssue?.project;
    let label = 'relates to';
    if (link.linkType === IssueLinkType.BLOCKS) {
      label = isSource ? 'blocks' : 'is blocked by';
    } else if (link.linkType === IssueLinkType.IS_BLOCKED_BY) {
      label = isSource ? 'is blocked by' : 'blocks';
    } else if (link.linkType === IssueLinkType.DUPLICATES) {
      label = isSource ? 'duplicates' : 'is duplicated by';
    }
    return {
      id: link.id,
      linkType: link.linkType,
      direction: isSource ? 'OUTWARD' : 'INWARD',
      label,
      linkedIssue: otherIssue
        ? {
            id: otherIssue.id,
            key: `${otherProject?.key || 'ISSUE'}-${otherIssue.issueNum}`,
            title: otherIssue.title,
            status: otherIssue.status,
            priority: otherIssue.priority,
            issueType: otherIssue.issueType,
            projectName: otherProject?.name,
            projectKey: otherProject?.key,
          }
        : null,
      createdAt: link.createdAt,
    };
  }
}
