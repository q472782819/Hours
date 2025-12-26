export enum WorkStatus {
  SLACKING = 'SLACKING', // 摸鱼 (0)
  NORMAL = 'NORMAL',     // 正常/工作 (1)
  FOCUSED = 'FOCUSED',   // 认真/努力 (2)
  EMPTY = 'EMPTY'        // 未记录
}

export interface DayLog {
  [hour: number]: WorkStatus;
}

export interface TodoItem {
  id: number;
  text: string;
  completed: boolean;
}

export interface TimeBlock {
  id: string;
  name: string;
  start: number; // 0-23
  end: number;   // 0-23
  enabled: boolean;
  color?: string; // Optional for UI decoration
}

export type DayConfig = TimeBlock[];

export interface DayData {
  log: DayLog;
  todos: TodoItem[];
  config: DayConfig;
}

export interface AppData {
  [dateIso: string]: DayData;
}

export type TabView = 'TRACKER' | 'STATS';

export interface StatusConfig {
  id: WorkStatus;
  label: string;
  color: string;
  icon: string;
  score: number;
}