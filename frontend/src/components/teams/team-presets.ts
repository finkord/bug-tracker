import {
  Rocket,
  Shield,
  Zap,
  Sparkles,
  Terminal,
  Code2,
  Cpu,
  Flame,
  Layers,
  Bot,
} from 'lucide-react';

export const TEAM_PRESET_ICONS = [
  { id: 'rocket', label: 'Rocket', Icon: Rocket },
  { id: 'shield', label: 'Shield', Icon: Shield },
  { id: 'zap', label: 'Lightning', Icon: Zap },
  { id: 'sparkles', label: 'Sparkles', Icon: Sparkles },
  { id: 'terminal', label: 'Terminal', Icon: Terminal },
  { id: 'code', label: 'Code', Icon: Code2 },
  { id: 'cpu', label: 'Core / CPU', Icon: Cpu },
  { id: 'flame', label: 'Flame', Icon: Flame },
  { id: 'layers', label: 'Layers', Icon: Layers },
  { id: 'bot', label: 'Automation', Icon: Bot },
] as const;

export const TEAM_PRESET_COLORS = [
  { id: 'indigo', label: 'Indigo', bg: 'bg-indigo-600', text: 'text-white' },
  { id: 'blue', label: 'Blue', bg: 'bg-blue-600', text: 'text-white' },
  { id: 'emerald', label: 'Emerald', bg: 'bg-emerald-600', text: 'text-white' },
  { id: 'amber', label: 'Amber', bg: 'bg-amber-600', text: 'text-white' },
  { id: 'rose', label: 'Rose', bg: 'bg-rose-600', text: 'text-white' },
  { id: 'purple', label: 'Purple', bg: 'bg-purple-600', text: 'text-white' },
  { id: 'cyan', label: 'Cyan', bg: 'bg-cyan-600', text: 'text-white' },
  { id: 'violet', label: 'Violet', bg: 'bg-violet-600', text: 'text-white' },
] as const;
