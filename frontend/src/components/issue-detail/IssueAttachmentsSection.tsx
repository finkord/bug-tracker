import React, { useRef, useState } from 'react';
import type { AttachmentItem, UserProfile } from '../../api/types/index.js';
import { Card, Button, Modal } from '../ui/index.js';
import {
  Paperclip,
  UploadCloud,
  FileText,
  Image as ImageIcon,
  Download,
  Trash2,
  Maximize2,
  Loader2,
} from 'lucide-react';

interface IssueAttachmentsSectionProps {
  attachments: AttachmentItem[];
  currentUser: UserProfile | null;
  onUpload: (file: File) => Promise<void>;
  onDelete: (attachmentId: number) => Promise<void>;
}

export const IssueAttachmentsSection: React.FC<IssueAttachmentsSectionProps> = ({
  attachments,
  currentUser,
  onUpload,
  onDelete,
}) => {
  const [uploading, setUploading] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);
  const [previewImageTitle, setPreviewImageTitle] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploading(true);
    try {
      for (let i = 0; i < files.length; i++) {
        await onUpload(files[i]);
      }
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    await handleFiles(e.dataTransfer.files);
  };

  const isImageMime = (mime: string) => mime?.startsWith('image/');

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getSecureUrl = (url: string) => {
    const token = localStorage.getItem('accessToken');
    if (!token) return url;
    const sep = url.includes('?') ? '&' : '?';
    return `${url}${sep}token=${encodeURIComponent(token)}`;
  };

  return (
    <div className="space-y-4 pt-2">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
          <Paperclip className="w-3.5 h-3.5" />
          Attachments ({attachments.length})
        </h3>
      </div>

      {/* Drag & Drop Upload Zone */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragOver(true);
        }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-lg p-5 text-center cursor-pointer transition-colors ${
          isDragOver
            ? 'border-primary bg-primary/5'
            : 'border-border/70 hover:border-primary/50 bg-card/30'
        }`}
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={(e) => handleFiles(e.target.files)}
          className="hidden"
          multiple
        />
        <div className="flex flex-col items-center justify-center gap-2">
          {uploading ? (
            <Loader2 className="w-6 h-6 text-primary animate-spin" />
          ) : (
            <UploadCloud className="w-6 h-6 text-muted-foreground" />
          )}
          <p className="text-sm font-medium text-foreground">
            {uploading ? 'Uploading to SeaweedFS...' : 'Drop files here or click to browse'}
          </p>
          <p className="text-xs text-muted-foreground">
            Support for images, PDFs, logs and screenshots
          </p>
        </div>
      </div>

      {/* Attachments List */}
      {attachments.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {attachments.map((att) => {
            const isImg = isImageMime(att.mimeType);
            const canDelete =
              currentUser?.isAdmin ||
              currentUser?.systemRole === 'ADMIN' ||
              att.uploader?.id === currentUser?.id;

            return (
              <Card
                key={att.id}
                className="p-3 bg-card/80 border-border/80 flex items-center justify-between gap-3 group"
              >
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                  <div className="p-2 rounded bg-muted/40 text-muted-foreground shrink-0">
                    {isImg ? (
                      <ImageIcon className="w-4 h-4 text-[var(--md-sys-color-primary)]" />
                    ) : (
                      <FileText className="w-4 h-4 text-[var(--md-sys-color-tertiary)]" />
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <p
                      className="text-xs font-semibold text-foreground truncate cursor-pointer hover:underline"
                      title={att.filename}
                      onClick={() => {
                        const secureUrl = getSecureUrl(att.url);
                        if (isImg) {
                          setPreviewImageUrl(secureUrl);
                          setPreviewImageTitle(att.filename);
                        } else {
                          window.open(secureUrl, '_blank');
                        }
                      }}
                    >
                      {att.filename}
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      {formatFileSize(att.fileSize)} • {att.uploader?.fullName || 'Anonymous'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  {isImg && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
                      onClick={() => {
                        setPreviewImageUrl(getSecureUrl(att.url));
                        setPreviewImageTitle(att.filename);
                      }}
                    >
                      <Maximize2 className="w-3.5 h-3.5" />
                    </Button>
                  )}

                  <a
                    href={getSecureUrl(att.url)}
                    download={att.filename}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" />
                  </a>

                  {canDelete && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                      onClick={() => onDelete(att.id)}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Image Preview Modal */}
      {previewImageUrl && (
        <Modal
          isOpen={true}
          onClose={() => setPreviewImageUrl(null)}
          title={previewImageTitle || 'Attachment Preview'}
          size="lg"
        >
          <div className="p-4 flex items-center justify-center max-h-[75vh] overflow-auto">
            <img
              src={previewImageUrl}
              alt={previewImageTitle || 'Preview'}
              className="max-w-full max-h-full rounded object-contain"
            />
          </div>
        </Modal>
      )}
    </div>
  );
};
