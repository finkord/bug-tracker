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
        <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--md-sys-color-on-surface-variant)] flex items-center gap-1.5">
          <Paperclip className="w-3.5 h-3.5 text-[var(--md-sys-color-primary)]" />
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
        className={`border border-dashed rounded-xl py-2.5 px-4 text-center cursor-pointer transition-colors ${
          isDragOver
            ? 'border-[var(--md-sys-color-primary)] bg-[var(--md-sys-color-primary-container)]/20'
            : 'border-[var(--md-sys-color-outline-variant)]/60 hover:border-[var(--md-sys-color-primary)]/50 bg-[var(--md-sys-color-surface-container-low)]'
        }`}
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={(e) => handleFiles(e.target.files)}
          className="hidden"
          multiple
        />
        <div className="flex items-center justify-center gap-2">
          {uploading ? (
            <Loader2 className="w-4 h-4 text-[var(--md-sys-color-primary)] animate-spin" />
          ) : (
            <UploadCloud className="w-4 h-4 text-[var(--md-sys-color-primary)]" />
          )}
          <span className="text-xs font-medium text-[var(--md-sys-color-on-surface)]">
            {uploading ? 'Uploading...' : 'Drop files here or click to browse'}
          </span>
          <span className="text-[11px] text-[var(--md-sys-color-on-surface-variant)] hidden sm:inline">
            (Images, PDFs, logs)
          </span>
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
                className="p-3 bg-[var(--md-sys-color-surface-container-low)] border-[var(--md-sys-color-outline-variant)]/60 flex items-center justify-between gap-3 group"
              >
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                  <div className="p-2 rounded-lg bg-[var(--md-sys-color-surface-container)] text-[var(--md-sys-color-on-surface-variant)] shrink-0">
                    {isImg ? (
                      <ImageIcon className="w-4 h-4 text-[var(--md-sys-color-primary)]" />
                    ) : (
                      <FileText className="w-4 h-4 text-[var(--md-sys-color-primary)]" />
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <p
                      className="text-xs font-semibold text-[var(--md-sys-color-on-surface)] truncate cursor-pointer hover:underline"
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
                    <p className="text-[11px] text-[var(--md-sys-color-on-surface-variant)]">
                      {formatFileSize(att.fileSize)} • {att.uploader?.fullName || 'Anonymous'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  {isImg && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0 text-[var(--md-sys-color-on-surface-variant)] hover:text-[var(--md-sys-color-on-surface)]"
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
                    className="p-1.5 rounded-md hover:bg-[var(--md-sys-color-surface-container-high)] text-[var(--md-sys-color-on-surface-variant)] hover:text-[var(--md-sys-color-on-surface)] transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" />
                  </a>

                  {canDelete && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0 text-[var(--md-sys-color-on-surface-variant)] hover:text-[var(--md-sys-color-error)] hover:bg-[var(--md-sys-color-error-container)]/20"
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
              className="max-w-full max-h-full rounded-xl object-contain"
            />
          </div>
        </Modal>
      )}
    </div>
  );
};
