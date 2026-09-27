import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Attachment } from '../entities/attachment.entity.js';
import { Issue } from '../entities/issue.entity.js';
import { User } from '../../users/entities/user.entity.js';
import { SeaweedFsService, type UploadedFileInput } from './seaweedfs.service.js';
import { EventsGateway } from '../../events/events.gateway.js';

/**
 * Service responsible for managing issue file attachments and SeaweedFS object storage.
 */
@Injectable()
export class IssueAttachmentsService {
  constructor(
    @InjectRepository(Issue)
    private readonly issueRepository: Repository<Issue>,
    @InjectRepository(Attachment)
    private readonly attachmentRepository: Repository<Attachment>,
    private readonly seaweedFsService: SeaweedFsService,
    private readonly eventsGateway: EventsGateway,
  ) {}

  /**
   * Uploads file attachment to SeaweedFS and links it to the issue.
   */
  async uploadAttachment(issueId: number, file: UploadedFileInput, uploader: User): Promise<Attachment> {
    const issue = await this.issueRepository.findOne({ where: { id: issueId } });
    if (!issue) {
      throw new NotFoundException(`Issue with ID #${issueId} not found`);
    }
    const { fid } = await this.seaweedFsService.uploadFile(file);
    const attachment = this.attachmentRepository.create({
      issueId,
      filename: file.originalname,
      fileSize: file.size,
      mimeType: file.mimetype,
      fid,
      url: '',
      uploaderId: uploader.id,
      uploader,
    });
    const saved = await this.attachmentRepository.save(attachment);
    saved.url = `http://localhost:3000/api/v1/issues/attachments/${saved.id}/file`;
    await this.attachmentRepository.save(saved);
    this.eventsGateway.broadcastAttachmentUploaded({ issueId, attachment: saved });
    return saved;
  }

  /**
   * Retrieves a single attachment by its primary ID.
   */
  async getAttachmentById(id: number): Promise<Attachment> {
    const attachment = await this.attachmentRepository.findOne({ where: { id } });
    if (!attachment) {
      throw new NotFoundException(`Attachment #${id} not found`);
    }
    attachment.url = `http://localhost:3000/api/v1/issues/attachments/${attachment.id}/file`;
    return attachment;
  }

  /**
   * Lists all attachments for a specific issue ID.
   */
  async getAttachments(issueId: number): Promise<Attachment[]> {
    const attachments = await this.attachmentRepository.find({
      where: { issueId },
      relations: { uploader: true },
      order: { createdAt: 'DESC' },
    });
    return attachments.map((a) => {
      a.url = `http://localhost:3000/api/v1/issues/attachments/${a.id}/file`;
      return a;
    });
  }

  /**
   * Deletes an attachment from SeaweedFS and the database.
   */
  async deleteAttachment(issueId: number, attachmentId: number, user: User): Promise<{ message: string }> {
    const attachment = await this.attachmentRepository.findOne({
      where: { id: attachmentId, issueId },
    });
    if (!attachment) {
      throw new NotFoundException(`Attachment #${attachmentId} not found`);
    }
    if (attachment.uploaderId !== user.id && user.systemRole !== 'ADMIN') {
      throw new BadRequestException('Only the uploader or system administrators can delete this attachment');
    }
    await this.seaweedFsService.deleteFile(attachment.fid);
    await this.attachmentRepository.delete(attachmentId);
    return { message: 'Attachment deleted successfully' };
  }
}
