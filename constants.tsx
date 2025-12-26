import { WorkStatus, StatusConfig } from './types';
import { Fish, Briefcase, BicepsFlexed, CircleDashed } from 'lucide-react';
import React from 'react';

export const STATUS_CONFIGS: Record<WorkStatus, StatusConfig> = {
  [WorkStatus.EMPTY]: {
    id: WorkStatus.EMPTY,
    label: '未记录',
    color: 'bg-slate-100 text-slate-400 border-slate-200',
    icon: 'CircleDashed',
    score: 0,
  },
  [WorkStatus.SLACKING]: {
    id: WorkStatus.SLACKING,
    label: '摸鱼',
    color: 'bg-emerald-100 text-emerald-600 border-emerald-200 hover:bg-emerald-200',
    icon: 'Fish',
    score: 0,
  },
  [WorkStatus.NORMAL]: {
    id: WorkStatus.NORMAL,
    label: '工作',
    color: 'bg-blue-100 text-blue-600 border-blue-200 hover:bg-blue-200',
    icon: 'Briefcase',
    score: 1,
  },
  [WorkStatus.FOCUSED]: {
    id: WorkStatus.FOCUSED,
    label: '努力',
    color: 'bg-rose-100 text-rose-600 border-rose-200 hover:bg-rose-200',
    icon: 'BicepsFlexed',
    score: 2,
  },
};

export const getIcon = (name: string, size = 18) => {
  switch (name) {
    case 'Fish': return <Fish size={size} strokeWidth={2} />;
    case 'Briefcase': return <Briefcase size={size} strokeWidth={2} />;
    case 'BicepsFlexed': return <BicepsFlexed size={size} strokeWidth={2} />;
    default: return <CircleDashed size={size} />;
  }
};