import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface UploadedFileInput {
  originalname: string;
  buffer: Buffer;
  mimetype: string;
  size: number;
}

@Injectable()
export class SeaweedFsService {
  private readonly logger = new Logger(SeaweedFsService.name);
  private readonly masterUrl: string;
  private readonly volumeUrl: string;

  constructor(private readonly configService: ConfigService) {
    this.masterUrl = this.configService.get<string>('SEAWEED_MASTER_URL', 'http://localhost:9333');
    this.volumeUrl = this.configService.get<string>('SEAWEED_VOLUME_URL', 'http://localhost:8080');
  }

  async uploadFile(file: UploadedFileInput): Promise<{ fid: string; url: string }> {
    const assignRes = await fetch(`${this.masterUrl}/dir/assign`);
    if (!assignRes.ok) {
      throw new Error(`SeaweedFS master assignment failed: ${assignRes.status}`);
    }
    const assignData: any = await assignRes.json();
    const fid = assignData.fid;

    const formData = new FormData();
    const blob = new Blob([new Uint8Array(file.buffer)], { type: file.mimetype });
    formData.append('file', blob, file.originalname);

    const uploadUrl = `${this.volumeUrl}/${fid}`;
    const uploadRes = await fetch(uploadUrl, {
      method: 'POST',
      body: formData,
    });

    if (!uploadRes.ok) {
      throw new Error(`SeaweedFS volume upload failed: ${uploadRes.status}`);
    }

    const publicUrl = `${this.volumeUrl}/${fid}`;
    this.logger.log(`Successfully stored file "${file.originalname}" with fid ${fid}`);

    return { fid, url: publicUrl };
  }

  async deleteFile(fid: string): Promise<void> {
    try {
      await fetch(`${this.volumeUrl}/${fid}`, { method: 'DELETE' });
    } catch (err: any) {
      this.logger.warn(`Failed to delete fid ${fid} from SeaweedFS: ${err.message}`);
    }
  }
}
