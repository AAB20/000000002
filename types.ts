export interface Score {
  id: string;
  title: string;
  value: number;
  max: number;
  date: string;
  notes?: string;
}

export interface Subject {
  id: string;
  name: string;
  color: string;
  scores: Score[];
}

export type ViewState = 
  | { type: 'dashboard' }
  | { type: 'subject'; subjectId: string };

export interface AIInsight {
  analysis: string;
  tips: string[];
  sentiment: 'positive' | 'neutral' | 'negative' | 'encouraging';
}

export const SUBJECT_COLORS = [
  'bg-blue-500',
  'bg-emerald-500', 
  'bg-violet-500',
  'bg-rose-500',
  'bg-amber-500',
  'bg-cyan-500',
  'bg-fuchsia-500',
  'bg-indigo-500'
];

export const TEXT_COLORS = {
  'bg-blue-500': 'text-blue-500',
  'bg-emerald-500': 'text-emerald-500',
  'bg-violet-500': 'text-violet-500',
  'bg-rose-500': 'text-rose-500',
  'bg-amber-500': 'text-amber-500',
  'bg-cyan-500': 'text-cyan-500',
  'bg-fuchsia-500': 'text-fuchsia-500',
  'bg-indigo-500': 'text-indigo-500'
};