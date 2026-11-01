import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SeaweedFsService } from './seaweedfs.service.js';

describe('SeaweedFsService', () => {
  let service: SeaweedFsService;
  let mockConfigService: any;

  beforeEach(() => {
    mockConfigService = {
      get: vi.fn((key: string, defaultVal: string) => defaultVal),
    };
    service = new SeaweedFsService(mockConfigService);
  });

  it('should initialize with default master and volume URLs', () => {
    expect(service).toBeDefined();
  });

  it('should upload file and return fid and public url', async () => {
    const fakeAssignResponse = { fid: '7,0123456789', url: 'localhost:8080' };
    
    // Mock global fetch
    global.fetch = vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => fakeAssignResponse,
      } as any)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ name: 'test.png', size: 100 }),
      } as any);

    const testFile = {
      originalname: 'test.png',
      buffer: Buffer.from('fake-image-bytes'),
      mimetype: 'image/png',
      size: 100,
    };

    const result = await service.uploadFile(testFile);

    expect(result.fid).toBe('7,0123456789');
    expect(result.url).toBe('http://localhost:8080/7,0123456789');
  });
});
