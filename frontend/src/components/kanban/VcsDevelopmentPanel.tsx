import React, { useState, useEffect } from 'react';
import { GitBranch, GitPullRequest, Copy, Check, ExternalLink, Loader2 } from 'lucide-react';
import { issuesApi } from '../../api/modules/issues.api.js';
import type { VcsPullRequestItem } from '../../api/types/issues.types.js';
import { useAuthStore } from '../../store/useAuthStore.js';

interface VcsDevelopmentPanelProps {
  issueId: number;
  issueKey: string;
  issueTitle: string;
}

export const VcsDevelopmentPanel: React.FC<VcsDevelopmentPanelProps> = ({
  issueId,
  issueKey,
  issueTitle,
}) => {
  const { user } = useAuthStore();
  const [pullRequests, setPullRequests] = useState<VcsPullRequestItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [hasCopied, setHasCopied] = useState<boolean>(false);

  const username = user?.fullName?.toLowerCase().replace(/[^a-z0-9]/g, '-') || 'dev';
  const sanitizedTitle = issueTitle
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 30);
  const branchCommand = `git checkout -b ${username}/${issueKey}-${sanitizedTitle}`;

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);

    issuesApi
      .getPullRequests(issueId)
      .then((data) => {
        if (isMounted) {
          setPullRequests(data || []);
        }
      })
      .catch((err) => {
        console.error('Failed to load pull requests for issue', err);
      })
      .finally(() => {
        if (isMounted) {
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [issueId]);

  const handleCopyBranch = async () => {
    try {
      await navigator.clipboard.writeText(branchCommand);
      setHasCopied(true);
      setTimeout(() => setHasCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy branch command', err);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'MERGED':
        return {
          bg: 'var(--md-sys-color-tertiary-container)',
          text: 'var(--md-sys-color-on-tertiary-container)',
        };
      case 'OPEN':
        return {
          bg: 'var(--md-sys-color-primary-container)',
          text: 'var(--md-sys-color-on-primary-container)',
        };
      case 'CLOSED':
      default:
        return {
          bg: 'var(--md-sys-color-surface-container-high)',
          text: 'var(--md-sys-color-on-surface-variant)',
        };
    }
  };

  return (
    <div
      className="rounded-xl p-4 border transition-colors"
      style={{
        backgroundColor: 'var(--md-sys-color-surface-container-low)',
        borderColor: 'var(--md-sys-color-outline-variant)',
      }}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <GitBranch
            className="w-4 h-4"
            style={{ color: 'var(--md-sys-color-primary)' }}
          />
          <h4
            className="text-xs font-semibold uppercase tracking-wider"
            style={{ color: 'var(--md-sys-color-on-surface)' }}
          >
            Development & Git
          </h4>
        </div>
        <button
          type="button"
          onClick={handleCopyBranch}
          className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-lg transition-colors cursor-pointer"
          style={{
            backgroundColor: hasCopied
              ? 'var(--md-sys-color-primary-container)'
              : 'var(--md-sys-color-surface-container-highest)',
            color: hasCopied
              ? 'var(--md-sys-color-on-primary-container)'
              : 'var(--md-sys-color-on-surface)',
          }}
          title="Copy branch creation command to clipboard"
        >
          {hasCopied ? (
            <>
              <Check className="w-3.5 h-3.5" />
              <span>Copied</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5" />
              <span>Copy Branch</span>
            </>
          )}
        </button>
      </div>

      {/* Branch snippet */}
      <div
        className="px-3 py-2 rounded-lg font-mono text-xs overflow-x-auto select-all mb-4"
        style={{
          backgroundColor: 'var(--md-sys-color-surface-container-lowest)',
          color: 'var(--md-sys-color-on-surface-variant)',
          border: '1px solid var(--md-sys-color-outline-variant)',
        }}
      >
        {branchCommand}
      </div>

      {/* Linked Pull Requests */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span
            className="font-medium"
            style={{ color: 'var(--md-sys-color-on-surface-variant)' }}
          >
            Linked Pull Requests ({pullRequests.length})
          </span>
          <span
            className="text-[11px]"
            style={{ color: 'var(--md-sys-color-outline)' }}
          >
            Mention {issueKey} in PR to link
          </span>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-4">
            <Loader2
              className="w-4 h-4 animate-spin"
              style={{ color: 'var(--md-sys-color-primary)' }}
            />
          </div>
        ) : pullRequests.length === 0 ? (
          <div
            className="text-xs py-3 px-3 rounded-lg text-center"
            style={{
              backgroundColor: 'var(--md-sys-color-surface-container-lowest)',
              color: 'var(--md-sys-color-outline)',
            }}
          >
            No pull requests linked yet. Open a PR with branch or title containing {issueKey}.
          </div>
        ) : (
          <div className="space-y-2">
            {pullRequests.map((pr) => {
              const statusStyle = getStatusColor(pr.status);
              return (
                <div
                  key={pr.id}
                  className="flex items-center justify-between p-2.5 rounded-lg border text-xs gap-3"
                  style={{
                    backgroundColor: 'var(--md-sys-color-surface-container-lowest)',
                    borderColor: 'var(--md-sys-color-outline-variant)',
                  }}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <GitPullRequest
                      className="w-4 h-4 shrink-0"
                      style={{ color: 'var(--md-sys-color-primary)' }}
                    />
                    <div className="min-w-0">
                      <a
                        href={pr.url}
                        target="_blank"
                        rel="noreferrer"
                        className="font-medium hover:underline truncate block"
                        style={{ color: 'var(--md-sys-color-primary)' }}
                      >
                        #{pr.prNumber} {pr.title}
                      </a>
                      <div
                        className="flex items-center gap-1.5 text-[11px] truncate mt-0.5"
                        style={{ color: 'var(--md-sys-color-on-surface-variant)' }}
                      >
                        <span className="font-mono">{pr.sourceBranch}</span>
                        <span>&rarr;</span>
                        <span className="font-mono">{pr.targetBranch}</span>
                        {pr.authorUsername && (
                          <span>by @{pr.authorUsername}</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span
                      className="px-2 py-0.5 text-[10px] font-semibold rounded-full uppercase tracking-wider"
                      style={{
                        backgroundColor: statusStyle.bg,
                        color: statusStyle.text,
                      }}
                    >
                      {pr.status}
                    </span>
                    <a
                      href={pr.url}
                      target="_blank"
                      rel="noreferrer"
                      className="p-1 rounded hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                      style={{ color: 'var(--md-sys-color-on-surface-variant)' }}
                      title="Open in GitHub / GitLab"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
