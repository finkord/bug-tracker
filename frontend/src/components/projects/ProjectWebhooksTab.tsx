import React, { useState } from 'react';
import {
  Webhook,
  Plus,
  Trash2,
  Play,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  RefreshCw,
  Sliders,
  ExternalLink,
  Shield,
  Radio,
  Zap,
} from 'lucide-react';
import {
  useProjectWebhooksQuery,
  useCreateWebhookMutation,
  useUpdateWebhookMutation,
  useDeleteWebhookMutation,
  useTestWebhookMutation,
} from '../../api/queries';
import type { ProjectWebhookItem } from '../../api/types/webhooks.types.js';
import { Card, Button, Input, Badge, Modal } from '../ui';

interface ProjectWebhooksTabProps {
  projectId: number;
}

const AVAILABLE_EVENTS = [
  { id: '*', label: 'All Events (Wildcard)', description: 'Trigger on all supported lifecycle events' },
  { id: 'issue.created', label: 'Issue Created', description: 'Triggered when any issue or subtask is opened' },
  { id: 'issue.updated', label: 'Issue Updated', description: 'Triggered on edits to issue fields or assignments' },
  { id: 'status.changed', label: 'Status Transitioned', description: 'Triggered on workflow status progression' },
  { id: 'comment.created', label: 'Comment Added', description: 'Triggered when discussion comments are posted' },
  { id: 'version.released', label: 'Version Released', description: 'Triggered when a software release is completed' },
];

export const ProjectWebhooksTab: React.FC<ProjectWebhooksTabProps> = ({ projectId }) => {
  const { data: webhooks = [], isLoading, error: loadError } = useProjectWebhooksQuery(projectId);

  const createMutation = useCreateWebhookMutation(projectId);
  const updateMutation = useUpdateWebhookMutation(projectId);
  const deleteMutation = useDeleteWebhookMutation(projectId);
  const testMutation = useTestWebhookMutation(projectId);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingWebhook, setEditingWebhook] = useState<ProjectWebhookItem | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
  const [format, setFormat] = useState<'generic' | 'discord' | 'slack'>('generic');
  const [secret, setSecret] = useState('');
  const [selectedEvents, setSelectedEvents] = useState<string[]>(['*']);
  const [isActive, setIsActive] = useState(true);
  const [formError, setFormError] = useState<string | null>(null);

  // Test ping feedback states
  const [testingId, setTestingId] = useState<number | null>(null);
  const [testResults, setTestResults] = useState<
    Record<number, { success: boolean; statusCode?: number; responseTimeMs: number; message: string }>
  >({});

  // Secret copied indicator
  const [copiedSecretId, setCopiedSecretId] = useState<number | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);

  const generateRandomSecret = () => {
    const bytes = new Uint8Array(20);
    window.crypto.getRandomValues(bytes);
    const hex = Array.from(bytes)
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
    setSecret(`whsec_${hex}`);
  };

  const handleUrlChange = (newUrl: string) => {
    setUrl(newUrl);
    const lower = newUrl.toLowerCase();
    if (lower.includes('discord.com/api/webhooks') || lower.includes('discordapp.com/api/webhooks')) {
      setFormat('discord');
    } else if (lower.includes('hooks.slack.com')) {
      setFormat('slack');
    }
  };

  const handleOpenCreateModal = () => {
    setEditingWebhook(null);
    setName('');
    setUrl('');
    setFormat('generic');
    generateRandomSecret();
    setSelectedEvents(['*']);
    setIsActive(true);
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (webhook: ProjectWebhookItem) => {
    setEditingWebhook(webhook);
    setName(webhook.name);
    setUrl(webhook.url);
    setFormat(((webhook as any).format as 'generic' | 'discord' | 'slack') || 'generic');
    setSecret(webhook.secret || '');
    setSelectedEvents(webhook.events && webhook.events.length > 0 ? webhook.events : ['*']);
    setIsActive(webhook.isActive);
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleToggleEvent = (eventId: string) => {
    if (eventId === '*') {
      setSelectedEvents(['*']);
      return;
    }
    const filtered = selectedEvents.filter((e) => e !== '*');
    if (filtered.includes(eventId)) {
      const next = filtered.filter((e) => e !== eventId);
      setSelectedEvents(next.length === 0 ? ['*'] : next);
    } else {
      setSelectedEvents([...filtered, eventId]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setFormError('Webhook name is required');
      return;
    }
    if (!url.trim() || !url.startsWith('http')) {
      setFormError('Valid HTTP or HTTPS URL is required');
      return;
    }

    try {
      if (editingWebhook) {
        await updateMutation.mutateAsync({
          id: editingWebhook.id,
          payload: {
            name: name.trim(),
            url: url.trim(),
            format,
            secret: format === 'generic' ? (secret.trim() || undefined) : undefined,
            events: selectedEvents,
            isActive,
          },
        });
      } else {
        await createMutation.mutateAsync({
          name: name.trim(),
          url: url.trim(),
          format,
          secret: format === 'generic' ? (secret.trim() || undefined) : undefined,
          events: selectedEvents,
          isActive,
        });
      }
      setIsModalOpen(false);
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : 'Failed to save webhook configuration');
    }
  };

  const handleToggleActive = async (webhook: ProjectWebhookItem) => {
    try {
      await updateMutation.mutateAsync({
        id: webhook.id,
        payload: { isActive: !webhook.isActive },
      });
    } catch {
      // Handled by query client
    }
  };

  const handleTestPing = async (id: number) => {
    setTestingId(id);
    try {
      const result = await testMutation.mutateAsync(id);
      setTestResults((prev) => ({ ...prev, [id]: result }));
    } catch (err: unknown) {
      setTestResults((prev) => ({
        ...prev,
        [id]: {
          success: false,
          responseTimeMs: 0,
          message: err instanceof Error ? err.message : 'Test delivery failed',
        },
      }));
    } finally {
      setTestingId(null);
    }
  };

  const handleCopySecret = (webhook: ProjectWebhookItem) => {
    const textToCopy = webhook.secret || webhook.maskedSecret || '';
    navigator.clipboard.writeText(textToCopy);
    setCopiedSecretId(webhook.id);
    setTimeout(() => setCopiedSecretId(null), 2000);
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteMutation.mutateAsync(id);
      setConfirmDeleteId(null);
    } catch {
      // Handled by query client
    }
  };

  if (isLoading) {
    return (
      <div className="py-16 text-center text-xs text-[var(--md-sys-color-on-surface-variant)] flex items-center justify-center gap-2">
        <RefreshCw className="w-4 h-4 animate-spin text-[var(--md-sys-color-primary)]" />
        <span>Loading outbound webhook configurations...</span>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="p-4 rounded-2xl bg-[var(--md-sys-color-error-container)] text-[var(--md-sys-color-on-error-container)] text-xs flex items-center gap-2">
        <AlertCircle className="w-4 h-4 shrink-0 text-[var(--md-sys-color-error)]" />
        <span>Failed to load project webhooks: {loadError.message}</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="p-6 rounded-3xl bg-[var(--md-sys-color-surface-container-low)] border border-[var(--md-sys-color-outline-variant)]/20 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-primary)] flex items-center justify-center shrink-0 shadow-xs">
            <Webhook className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-base font-bold text-[var(--md-sys-color-on-surface)] flex items-center gap-2">
              <span>Outbound Webhooks & Event Automation</span>
              <Badge variant="primary" size="sm">
                {webhooks.length} Active Endpoints
              </Badge>
            </h2>
            <p className="text-xs text-[var(--md-sys-color-on-surface-variant)] mt-1 max-w-2xl leading-relaxed">
              Dispatch signed JSON payloads to external systems (Slack, Discord, Jenkins, GitHub Actions, AWS EventBridge) on lifecycle events. Outbound events are signed with HMAC-SHA256 and backed by a distributed Redis retry queue.
            </p>
          </div>
        </div>

        <Button
          onClick={handleOpenCreateModal}
          variant="filled"
          size="md"
          className="rounded-2xl shrink-0 gap-2 font-semibold"
        >
          <Plus className="w-4 h-4" />
          <span>New Webhook</span>
        </Button>
      </div>

      {/* Webhooks List */}
      {webhooks.length === 0 ? (
        <div className="p-12 text-center rounded-3xl border border-dashed border-[var(--md-sys-color-outline-variant)]/40 bg-[var(--md-sys-color-surface-container-lowest)] space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-[var(--md-sys-color-surface-container)] text-[var(--md-sys-color-outline)] mx-auto flex items-center justify-center">
            <Radio className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-[var(--md-sys-color-on-surface)]">
            No Outbound Webhooks Registered
          </h3>
          <p className="text-xs text-[var(--md-sys-color-on-surface-variant)] max-w-md mx-auto">
            Configure webhooks to stream issue creations, status changes, and sprint updates directly into your CI/CD pipelines or communication platforms.
          </p>
          <Button
            onClick={handleOpenCreateModal}
            variant="tonal"
            size="sm"
            className="rounded-xl mt-2"
          >
            <Plus className="w-3.5 h-3.5 mr-1" />
            <span>Register First Webhook</span>
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {webhooks.map((webhook) => {
            const testResult = testResults[webhook.id];
            const isTesting = testingId === webhook.id;
            const hasFailures = webhook.failureCount > 0 || Boolean(webhook.lastFailureReason);

            return (
              <Card
                key={webhook.id}
                variant="outlined"
                padding="lg"
                rounded="2xl"
                className="bg-[var(--md-sys-color-surface-container-low)] border border-[var(--md-sys-color-outline-variant)]/30 shadow-xs space-y-4 hover:border-[var(--md-sys-color-primary)]/40 transition-all duration-150"
              >
                {/* Row Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[var(--md-sys-color-outline-variant)]/15 pb-4">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                        webhook.isActive
                          ? 'bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-primary)]'
                          : 'bg-[var(--md-sys-color-surface-container)] text-[var(--md-sys-color-outline)]'
                      }`}
                    >
                      <Zap className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-[var(--md-sys-color-on-surface)]">
                          {webhook.name}
                        </span>
                        <Badge
                          variant={webhook.isActive ? 'primary' : 'secondary'}
                          size="sm"
                        >
                          {webhook.isActive ? 'Enabled' : 'Paused'}
                        </Badge>
                        <Badge
                          variant={
                            (webhook as any).format === 'discord'
                              ? 'secondary'
                              : (webhook as any).format === 'slack'
                              ? 'neutral'
                              : 'tonal'
                          }
                          size="sm"
                          className="capitalize"
                        >
                          {(webhook as any).format || 'Generic'}
                        </Badge>
                        {hasFailures && (
                          <Badge variant="error" size="sm">
                            {webhook.failureCount} Failures
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5 text-xs text-[var(--md-sys-color-on-surface-variant)] font-mono">
                        <span className="truncate max-w-sm sm:max-w-md">{webhook.url}</span>
                        <a
                          href={webhook.url}
                          target="_blank"
                          rel="noreferrer"
                          className="hover:text-[var(--md-sys-color-primary)] inline-flex items-center"
                        >
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    </div>
                  </div>

                  {/* Actions Bar */}
                  <div className="flex items-center gap-2 shrink-0">
                    <Button
                      onClick={() => handleTestPing(webhook.id)}
                      disabled={isTesting}
                      variant="tonal"
                      size="sm"
                      className="rounded-xl text-xs font-semibold gap-1.5"
                    >
                      {isTesting ? (
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Play className="w-3.5 h-3.5" />
                      )}
                      <span>{isTesting ? 'Sending Ping...' : 'Test Ping'}</span>
                    </Button>

                    <Button
                      onClick={() => handleToggleActive(webhook)}
                      variant="outlined"
                      size="sm"
                      className="rounded-xl text-xs"
                    >
                      {webhook.isActive ? 'Pause' : 'Resume'}
                    </Button>

                    <Button
                      onClick={() => handleOpenEditModal(webhook)}
                      variant="outlined"
                      size="sm"
                      className="rounded-xl text-xs gap-1"
                    >
                      <Sliders className="w-3.5 h-3.5" />
                      <span>Edit</span>
                    </Button>

                    {confirmDeleteId === webhook.id ? (
                      <div className="flex items-center gap-1">
                        <Button
                          onClick={() => handleDelete(webhook.id)}
                          variant="danger"
                          size="sm"
                          className="rounded-xl text-xs font-bold"
                        >
                          Confirm
                        </Button>
                        <Button
                          onClick={() => setConfirmDeleteId(null)}
                          variant="outlined"
                          size="sm"
                          className="rounded-xl text-xs"
                        >
                          Cancel
                        </Button>
                      </div>
                    ) : (
                      <Button
                        onClick={() => setConfirmDeleteId(webhook.id)}
                        variant="outlined"
                        size="sm"
                        aria-label="Delete webhook"
                        className="rounded-xl text-xs text-[var(--md-sys-color-error)] hover:bg-[var(--md-sys-color-error-container)]"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    )}
                  </div>
                </div>

                {/* Subscribed Events & Details */}
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <span className="text-[11px] font-semibold text-[var(--md-sys-color-on-surface-variant)] uppercase tracking-wider">
                    Topics:
                  </span>
                  {(webhook.events || []).map((ev) => (
                    <span
                      key={ev}
                      className="px-2 py-0.5 rounded-lg bg-[var(--md-sys-color-surface-container)] text-[var(--md-sys-color-on-surface)] text-[11px] font-mono border border-[var(--md-sys-color-outline-variant)]/30"
                    >
                      {ev}
                    </span>
                  ))}

                  <div className="ml-auto flex items-center gap-3 text-[11px] text-[var(--md-sys-color-on-surface-variant)]">
                    {!(webhook as any).format || (webhook as any).format === 'generic' ? (
                      <Button
                        type="button"
                        variant="ghost"
                        size="xs"
                        onClick={() => handleCopySecret(webhook)}
                        leftIcon={
                          copiedSecretId === webhook.id ? (
                            <Check className="w-3 h-3 text-[var(--md-sys-color-success)]" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )
                        }
                        className="text-[11px] h-auto py-1 px-2 text-[var(--md-sys-color-on-surface-variant)] hover:text-[var(--md-sys-color-primary)]"
                      >
                        {copiedSecretId === webhook.id
                          ? 'Secret Copied'
                          : webhook.maskedSecret || 'Copy Secret'}
                      </Button>
                    ) : null}

                    {webhook.lastTriggeredAt && (
                      <span>
                        Last sent: {new Date(webhook.lastTriggeredAt).toLocaleTimeString()}
                      </span>
                    )}
                  </div>
                </div>

                {/* Failure Notice */}
                {webhook.lastFailureReason && (
                  <div className="p-3 rounded-2xl bg-[var(--md-sys-color-error-container)] text-[var(--md-sys-color-on-error-container)] text-xs flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0 text-[var(--md-sys-color-error)]" />
                      <span>Last delivery failure: {webhook.lastFailureReason}</span>
                    </div>
                  </div>
                )}

                {/* Test Ping Response Box */}
                {testResult && (
                  <div
                    className={`p-3 rounded-2xl text-xs flex items-center justify-between animate-in fade-in duration-150 ${
                      testResult.success
                        ? 'bg-[var(--md-sys-color-success-container)] text-[var(--md-sys-color-on-success-container)]'
                        : 'bg-[var(--md-sys-color-error-container)] text-[var(--md-sys-color-on-error-container)]'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {testResult.success ? (
                        <CheckCircle2 className="w-4 h-4 shrink-0 text-[var(--md-sys-color-success)]" />
                      ) : (
                        <AlertCircle className="w-4 h-4 shrink-0 text-[var(--md-sys-color-error)]" />
                      )}
                      <span className="font-semibold">
                        {testResult.success ? 'Test Ping Succeeded' : 'Test Ping Failed'}:
                      </span>
                      <span>{testResult.message}</span>
                      {testResult.statusCode && (
                        <span className="font-mono text-[11px] px-1.5 py-0.5 rounded bg-black/10">
                          HTTP {testResult.statusCode}
                        </span>
                      )}
                    </div>
                    <span className="font-mono text-[11px] opacity-75">
                      {testResult.responseTimeMs}ms
                    </span>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}

      {/* Webhook Configuration Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingWebhook ? 'Edit Webhook Configuration' : 'Register Outbound Webhook'}
        description="BugTracker dispatches real-time events to external webhooks, chat systems, or CI pipelines."
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-5">
          {formError && (
            <div className="p-3 rounded-2xl bg-[var(--md-sys-color-error-container)] text-[var(--md-sys-color-on-error-container)] text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-[var(--md-sys-color-error)]" />
              <span>{formError}</span>
            </div>
          )}

          <div className="space-y-4">
            <Input
              label="Webhook Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. CI/CD Pipeline, Discord Alerts, or Slack Channel"
              required
            />

            {/* Platform Preset Selector */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[var(--md-sys-color-on-surface-variant)] uppercase tracking-wider">
                Payload Format & Platform Preset
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'generic' as const, label: 'Generic JSON', sub: 'Standard HMAC' },
                  { id: 'discord' as const, label: 'Discord', sub: 'Rich Embeds' },
                  { id: 'slack' as const, label: 'Slack', sub: 'Attachments' },
                ].map((opt) => (
                  <button
                    type="button"
                    key={opt.id}
                    onClick={() => setFormat(opt.id)}
                    className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                      format === opt.id
                        ? 'bg-[var(--md-sys-color-primary-container)]/30 border-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-surface)] shadow-2xs font-bold'
                        : 'bg-[var(--md-sys-color-surface-container)] border-[var(--md-sys-color-outline-variant)]/20 text-[var(--md-sys-color-on-surface-variant)] hover:border-[var(--md-sys-color-outline)]'
                    }`}
                  >
                    <span className="block text-xs font-bold">{opt.label}</span>
                    <span className="block text-[10px] opacity-75">{opt.sub}</span>
                  </button>
                ))}
              </div>
            </div>

            <Input
              label="Endpoint URL"
              value={url}
              onChange={(e) => handleUrlChange(e.target.value)}
              placeholder={
                format === 'discord'
                  ? 'https://discord.com/api/webhooks/...'
                  : format === 'slack'
                  ? 'https://hooks.slack.com/services/...'
                  : 'https://example.com/api/v1/webhook'
              }
              type="url"
              required
            />

            {format === 'generic' ? (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-[var(--md-sys-color-on-surface-variant)] uppercase tracking-wider">
                    HMAC Signing Secret
                  </label>
                  <Button
                    type="button"
                    variant="ghost"
                    size="xs"
                    onClick={generateRandomSecret}
                    leftIcon={<RefreshCw className="w-3 h-3" />}
                    className="text-xs font-semibold text-[var(--md-sys-color-primary)]"
                  >
                    Generate New Secret
                  </Button>
                </div>
                <div className="flex items-center gap-2">
                  <Input
                    type="text"
                    value={secret}
                    onChange={(e) => setSecret(e.target.value)}
                    placeholder="whsec_..."
                    className="text-xs font-mono flex-1"
                  />
                  <Button
                    type="button"
                    variant="outlined"
                    size="sm"
                    onClick={() => {
                      navigator.clipboard.writeText(secret);
                      setFormError(null);
                    }}
                    leftIcon={<Copy className="w-3.5 h-3.5" />}
                    title="Copy secret"
                  >
                    Copy
                  </Button>
                </div>
                <p className="text-[11px] text-[var(--md-sys-color-on-surface-variant)] flex items-center gap-1 mt-1">
                  <Shield className="w-3 h-3 text-[var(--md-sys-color-primary)]" />
                  <span>The request signature is sent in the X-BugTracker-Signature header.</span>
                </p>
              </div>
            ) : (
              <div className="p-3 rounded-2xl bg-[var(--md-sys-color-surface-container)] border border-[var(--md-sys-color-outline-variant)]/30 text-xs text-[var(--md-sys-color-on-surface-variant)] flex items-start gap-2.5">
                <Shield className="w-4 h-4 shrink-0 text-[var(--md-sys-color-primary)] mt-0.5" />
                <span>
                  {format === 'discord'
                    ? 'Discord incoming webhooks authenticate using the secret token embedded in the webhook URL. Event payloads are automatically formatted into Discord rich embeds.'
                    : 'Slack incoming webhooks authenticate using the secret token in the webhook URL. Event payloads are automatically formatted into native Slack attachments.'}
                </span>
              </div>
            )}

            {/* Event Topics Selection */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-[var(--md-sys-color-on-surface-variant)] uppercase tracking-wider">
                Event Subscriptions
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {AVAILABLE_EVENTS.map((event) => {
                  const isChecked = selectedEvents.includes(event.id);
                  return (
                    <button
                      type="button"
                      key={event.id}
                      onClick={() => handleToggleEvent(event.id)}
                      className={`p-3 rounded-2xl border text-left transition-all duration-150 flex items-start gap-2.5 cursor-pointer ${
                        isChecked
                          ? 'bg-[var(--md-sys-color-primary-container)]/30 border-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-surface)]'
                          : 'bg-[var(--md-sys-color-surface-container)] border-[var(--md-sys-color-outline-variant)]/20 text-[var(--md-sys-color-on-surface-variant)] hover:border-[var(--md-sys-color-outline)]'
                      }`}
                    >
                      <div
                        className={`w-4 h-4 mt-0.5 rounded-md flex items-center justify-center shrink-0 border ${
                          isChecked
                            ? 'bg-[var(--md-sys-color-primary)] border-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)]'
                            : 'border-[var(--md-sys-color-outline)]'
                        }`}
                      >
                        {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                      </div>
                      <div className="space-y-0.5">
                        <span className="text-xs font-bold block">{event.label}</span>
                        <span className="text-[11px] opacity-75 block">{event.description}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Active Toggle */}
            <label className="flex items-center gap-2.5 cursor-pointer pt-2">
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="w-4 h-4 rounded text-[var(--md-sys-color-primary)] focus:ring-[var(--md-sys-color-primary)] cursor-pointer"
              />
              <span className="text-xs font-semibold text-[var(--md-sys-color-on-surface)]">
                Enable immediately (active dispatching)
              </span>
            </label>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-[var(--md-sys-color-outline-variant)]/20">
            <Button
              type="button"
              onClick={() => setIsModalOpen(false)}
              variant="outlined"
              size="md"
              className="rounded-2xl"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="filled"
              size="md"
              className="rounded-2xl font-semibold"
            >
              {editingWebhook ? 'Save Changes' : 'Create Webhook'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
