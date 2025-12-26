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

export interface TimeRange {
  start: number; // 0-23
  end: number;   // 0-23
  enabled: boolean;
}

export interface DayConfig {
  sleep1: TimeRange; // 第一段睡眠 (e.g. 晚上)
  sleep2: TimeRange; // 第二段睡眠 (e.g. 午休)
  out: TimeRange;    // 外出/通勤
}

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