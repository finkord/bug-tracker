import React, { useState } from 'react';
import { ZoomIn, AlertCircle, ExternalLink } from 'lucide-react';

interface MarkdownContentProps {
  content?: string | null;
  className?: string;
  onImageClick?: (url: string, title?: string) => void;
}

export const MarkdownContent: React.FC<MarkdownContentProps> = ({
  content,
  className = '',
  onImageClick,
}) => {
  const [failedImages, setFailedImages] = useState<Record<string, boolean>>({});

  if (!content || !content.trim()) {
    return (
      <span className="italic text-[var(--md-sys-color-on-surface-variant)]/70 select-none">
        No content provided.
      </span>
    );
  }

  const handleImageError = (url: string) => {
    setFailedImages((prev) => ({ ...prev, [url]: true }));
  };

  // Parse lines and blocks
  const parseMarkdown = (rawText: string) => {
    const lines = rawText.split('\n');
    const elements: React.ReactNode[] = [];
    let inCodeBlock = false;
    let codeBlockContent: string[] = [];

    lines.forEach((line, index) => {
      // 1. Code blocks (```)
      if (line.trim().startsWith('```')) {
        if (inCodeBlock) {
          elements.push(
            <div
              key={`code-${index}`}
              className="my-2 p-3 rounded-xl bg-black/80 dark:bg-black/90 text-emerald-400 font-mono text-xs overflow-x-auto border border-white/10"
            >
              <pre className="m-0">{codeBlockContent.join('\n')}</pre>
            </div>,
          );
          codeBlockContent = [];
          inCodeBlock = false;
        } else {
          inCodeBlock = true;
        }
        return;
      }

      if (inCodeBlock) {
        codeBlockContent.push(line);
        return;
      }

      // 2. Headings
      if (line.startsWith('### ')) {
        elements.push(
          <h3
            key={`h3-${index}`}
            className="text-sm font-bold text-[var(--md-sys-color-on-surface)] mt-3 mb-1"
          >
            {renderInline(line.replace('### ', ''))}
          </h3>,
        );
        return;
      }
      if (line.startsWith('## ')) {
        elements.push(
          <h2
            key={`h2-${index}`}
            className="text-base font-bold text-[var(--md-sys-color-on-surface)] mt-3.5 mb-1.5"
          >
            {renderInline(line.replace('## ', ''))}
          </h2>,
        );
        return;
      }
      if (line.startsWith('# ')) {
        elements.push(
          <h1
            key={`h1-${index}`}
            className="text-lg font-bold text-[var(--md-sys-color-on-surface)] mt-4 mb-2"
          >
            {renderInline(line.replace('# ', ''))}
          </h1>,
        );
        return;
      }

      // 3. Blockquotes
      if (line.startsWith('> ')) {
        elements.push(
          <blockquote
            key={`quote-${index}`}
            className="pl-3 py-1 my-1.5 border-l-3 border-[var(--md-sys-color-primary)] text-xs italic text-[var(--md-sys-color-on-surface-variant)] bg-[var(--md-sys-color-surface-container-high)]/30 rounded-r-lg"
          >
            {renderInline(line.replace('> ', ''))}
          </blockquote>,
        );
        return;
      }

      // 4. Bullet lists
      if (line.trim().startsWith('- ') || line.trim().startsWith('* ')) {
        elements.push(
          <div key={`li-${index}`} className="flex items-start gap-2 my-1 text-xs">
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--md-sys-color-primary)] mt-1.5 shrink-0" />
            <span className="flex-1">{renderInline(line.trim().substring(2))}</span>
          </div>,
        );
        return;
      }

      // 5. Empty line -> spacer
      if (!line.trim()) {
        elements.push(<div key={`space-${index}`} className="h-2" />);
        return;
      }

      // 6. Normal paragraph with inline formatting & images
      elements.push(
        <div key={`p-${index}`} className="my-1 leading-relaxed text-xs sm:text-sm">
          {renderInline(line)}
        </div>,
      );
    });

    if (inCodeBlock && codeBlockContent.length > 0) {
      elements.push(
        <div
          key="code-end"
          className="my-2 p-3 rounded-xl bg-black/80 dark:bg-black/90 text-emerald-400 font-mono text-xs overflow-x-auto"
        >
          <pre className="m-0">{codeBlockContent.join('\n')}</pre>
        </div>,
      );
    }

    return elements;
  };

  // Parse inline elements (Images, bold, inline code, links)
  const renderInline = (text: string): React.ReactNode => {
    // Regex for markdown images: ![alt](url)
    const imgRegex = /!\[([^\]]*)\]\(([^)]+)\)/g;
    const parts: React.ReactNode[] = [];
    let lastIndex = 0;
    let match: RegExpExecArray | null;

    while ((match = imgRegex.exec(text)) !== null) {
      const matchStart = match.index;
      const matchEnd = imgRegex.lastIndex;

      // Text before the image
      if (matchStart > lastIndex) {
        parts.push(renderTextFormatting(text.substring(lastIndex, matchStart)));
      }

      const altText = match[1] || 'Screenshot';
      const imgUrl = match[2];
      const isFailed = failedImages[imgUrl];

      parts.push(
        <div key={`img-block-${matchStart}`} className="my-2.5 inline-block w-full max-w-lg">
          {isFailed ? (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-[var(--md-sys-color-error-container)]/40 border border-[var(--md-sys-color-error)]/30 text-[var(--md-sys-color-on-error-container)] text-xs">
              <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
              <span className="truncate">Image failed to load: {altText}</span>
              <a
                href={imgUrl}
                target="_blank"
                rel="noreferrer"
                className="ml-auto underline flex items-center gap-1 font-semibold"
              >
                Open <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          ) : (
            <div
              className="group relative rounded-xl overflow-hidden border border-[var(--md-sys-color-outline-variant)] bg-black/5 dark:bg-black/20 hover:border-[var(--md-sys-color-primary)] transition-all cursor-pointer shadow-xs"
              onClick={() => onImageClick?.(imgUrl, altText)}
            >
              <img
                src={imgUrl}
                alt={altText}
                loading="lazy"
                onError={() => handleImageError(imgUrl)}
                className="w-full max-h-96 object-contain rounded-xl transition-transform duration-200 group-hover:scale-[1.01]"
              />
              <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 text-white text-xs font-semibold backdrop-blur-[2px]">
                <ZoomIn className="w-4 h-4" />
                <span>Click to expand ({altText})</span>
              </div>
            </div>
          )}
        </div>,
      );

      lastIndex = matchEnd;
    }

    if (lastIndex < text.length) {
      parts.push(renderTextFormatting(text.substring(lastIndex)));
    }

    return parts;
  };

  // Helper for bold, italics, inline code, and URLs
  const renderTextFormatting = (str: string): React.ReactNode => {
    // Check for inline code `code`
    const codeRegex = /`([^`]+)`/g;
    const parts: React.ReactNode[] = [];
    let lastIdx = 0;
    let codeMatch: RegExpExecArray | null;

    while ((codeMatch = codeRegex.exec(str)) !== null) {
      const matchStart = codeMatch.index;
      const matchEnd = codeRegex.lastIndex;

      if (matchStart > lastIdx) {
        parts.push(renderBoldItalicsAndLinks(str.substring(lastIdx, matchStart)));
      }

      parts.push(
        <code
          key={`code-inline-${matchStart}`}
          className="px-1.5 py-0.5 rounded-md bg-[var(--md-sys-color-surface-container-highest)] font-mono text-xs text-[var(--md-sys-color-primary)] border border-[var(--md-sys-color-outline-variant)]/40"
        >
          {codeMatch[1]}
        </code>,
      );

      lastIdx = matchEnd;
    }

    if (lastIdx < str.length) {
      parts.push(renderBoldItalicsAndLinks(str.substring(lastIdx)));
    }

    return parts;
  };

  // Bold **text** and links [text](url)
  const renderBoldItalicsAndLinks = (str: string): React.ReactNode => {
    // Links [text](url)
    const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
    const parts: React.ReactNode[] = [];
    let lastIdx = 0;
    let linkMatch: RegExpExecArray | null;

    while ((linkMatch = linkRegex.exec(str)) !== null) {
      const matchStart = linkMatch.index;
      const matchEnd = linkRegex.lastIndex;

      if (matchStart > lastIdx) {
        parts.push(renderBoldItalics(str.substring(lastIdx, matchStart)));
      }

      parts.push(
        <a
          key={`link-${matchStart}`}
          href={linkMatch[2]}
          target="_blank"
          rel="noreferrer"
          className="text-[var(--md-sys-color-primary)] font-semibold underline hover:brightness-115 inline-flex items-center gap-0.5"
        >
          {linkMatch[1]}
          <ExternalLink className="w-3 h-3 inline" />
        </a>,
      );

      lastIdx = matchEnd;
    }

    if (lastIdx < str.length) {
      parts.push(renderBoldItalics(str.substring(lastIdx)));
    }

    return parts;
  };

  const renderBoldItalics = (str: string): React.ReactNode => {
    // Simple bold **text**
    const boldParts = str.split(/(\*\*[^*]+\*\*)/g);
    return boldParts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return (
          <strong key={i} className="font-bold text-[var(--md-sys-color-on-surface)]">
            {part.slice(2, -2)}
          </strong>
        );
      }
      // Check for standalone image URL (png/jpg/webp)
      const directImgMatch = part.match(/(https?:\/\/[^\s]+\.(?:png|jpg|jpeg|gif|webp|svg)(?:\?[^\s]*)?)/i);
      if (directImgMatch) {
        const imgUrl = directImgMatch[0];
        const before = part.substring(0, directImgMatch.index);
        const after = part.substring((directImgMatch.index || 0) + imgUrl.length);
        return (
          <React.Fragment key={i}>
            {before}
            <div className="my-2 inline-block max-w-lg">
              <img
                src={imgUrl}
                alt="Image attachment"
                loading="lazy"
                onClick={() => onImageClick?.(imgUrl, 'Image')}
                className="max-h-80 rounded-xl border border-[var(--md-sys-color-outline-variant)] cursor-pointer hover:border-[var(--md-sys-color-primary)] transition-colors"
              />
            </div>
            {after}
          </React.Fragment>
        );
      }
      return part;
    });
  };

  return <div className={`markdown-body space-y-1 ${className}`}>{parseMarkdown(content)}</div>;
};
