import React, { useState, useEffect, useMemo } from 'react';
import { format, addDays } from 'date-fns';
import { AppData, TabView, WorkStatus, DayLog, DayData, TodoItem, DayConfig, TimeBlock } from './types';
import { Tracker } from './components/Tracker';
import { Statistics } from './components/Statistics';
import { ChevronLeft, ChevronRight, LayoutList, PieChart as PieChartIcon, Download, CheckSquare, Square, Settings2, ZoomIn, ZoomOut, Plus, Trash2, Clock, Coffee, BookOpen, Cloud, User, Lock, UploadCloud, DownloadCloud, X, RefreshCw, PenLine, Save } from 'lucide-react';

const STORAGE_KEY = 'workflow_app_data_v3';

const INITIAL_TODOS: TodoItem[] = Array.from({ length: 5 }, (_, i) => ({
  id: i,
  text: '',
  completed: false
}));

const DEFAULT_CONFIG: DayConfig = [
  { id: 'sleep1', name: '晚间睡眠', start: 23, end: 8, enabled: true, color: 'text-indigo-400' },
  { id: 'sleep2', name: '午间休息', start: 13, end: 14, enabled: false, color: 'text-orange-400' },
  { id: 'out', name: '通勤/外出', start: 18, end: 19, enabled: true, color: 'text-emerald-400' }
];

const WEEK_DAYS = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];

const App: React.FC = () => {
  // State
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [data, setData] = useState<AppData>({});
  const [activeTab, setActiveTab] = useState<TabView>('TRACKER'); // For mobile only
  const [uiScale, setUiScale] = useState<number>(1.0); // 0.8 to 1.4
  
  // Modal States
  const [showSyncModal, setShowSyncModal] = useState(false);
  const [showJournalModal, setShowJournalModal] = useState(false);
  
  // Sync State
  const [syncState, setSyncState] = useState<'idle' | 'syncing' | 'success' | 'error'>('idle');
  const [account, setAccount] = useState({ username: '', token: '' });
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // Load data on mount with migration logic
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        const migratedData: AppData = {};
        
        Object.keys(parsed).forEach(date => {
          const item = parsed[date];
          let config: DayConfig = [];

          // Migration Logic for Config
          if (!item.config) {
            config = JSON.parse(JSON.stringify(DEFAULT_CONFIG));
          } else if (Array.isArray(item.config)) {
            // Already V4 format (Array)
            config = item.config;
          } else {
            // Convert V3 (Object) to V4 (Array)
            const oldConfig = item.config;
            if (oldConfig.sleep1) config.push({ id: 'sleep1', name: '晚间睡眠', start: oldConfig.sleep1.start, end: oldConfig.sleep1.end, enabled: oldConfig.sleep1.enabled, color: 'text-indigo-400' });
            else if (oldConfig.sleep) config.push({ id: 'sleep1', name: '晚间睡眠', start: oldConfig.sleep.start, end: oldConfig.sleep.end, enabled: oldConfig.sleep.enabled, color: 'text-indigo-400' });
            
            if (oldConfig.sleep2) config.push({ id: 'sleep2', name: '午间休息', start: oldConfig.sleep2.start, end: oldConfig.sleep2.end, enabled: oldConfig.sleep2.enabled, color: 'text-orange-400' });
            
            if (oldConfig.out) config.push({ id: 'out', name: '通勤/外出', start: oldConfig.out.start, end: oldConfig.out.end, enabled: oldConfig.out.enabled, color: 'text-emerald-400' });
            else config.push({ id: 'out', name: '通勤/外出', start: 18, end: 19, enabled: true, color: 'text-emerald-400' });
          }

          migratedData[date] = {
            log: item.log || {},
            todos: item.todos || JSON.parse(JSON.stringify(INITIAL_TODOS)),
            config: config,
            journal: item.journal || '' // Add default journal
          };
        });
        
        setData(migratedData);
      } catch (e) {
        console.error("Failed to parse local storage", e);
      }
    }
    
    // Check if user "logged in" previously (Simulated)
    const savedAccount = localStorage.getItem('workflow_account');
    if (savedAccount) {
        setAccount(JSON.parse(savedAccount));
        setIsLoggedIn(true);
    }
  }, []);

  // Save data on change
  useEffect(() => {
    if (Object.keys(data).length > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    }
  }, [data]);

  const dateStr = format(currentDate, 'yyyy-MM-dd');
  
  // Get current day's data or default
  const currentDayData: DayData = data[dateStr] || { 
    log: {}, 
    todos: JSON.parse(JSON.stringify(INITIAL_TODOS)),
    config: JSON.parse(JSON.stringify(DEFAULT_CONFIG)),
    journal: ''
  };

  const currentLog = currentDayData.log;
  const currentTodos = currentDayData.todos;
  const currentConfig = currentDayData.config;
  const currentJournal = currentDayData.journal;

  // --- Handlers ---

  const handleUpdateStatus = (hour: number, status: WorkStatus) => {
    setData(prev => ({
      ...prev,
      [dateStr]: {
        ...currentDayData,
        log: { ...currentLog, [hour]: status }
      }
    }));
  };

  const handleUpdateTodo = (index: number, updates: Partial<TodoItem>) => {
    const newTodos = [...currentTodos];
    if (!newTodos[index]) newTodos[index] = { id: index, text: '', completed: false };
    newTodos[index] = { ...newTodos[index], ...updates };

    setData(prev => ({
      ...prev,
      [dateStr]: { ...currentDayData, todos: newTodos }
    }));
  };
  
  const handleUpdateJournal = (text: string) => {
    setData(prev => ({
      ...prev,
      [dateStr]: { ...currentDayData, journal: text }
    }));
  };

  // --- Dynamic Config Handlers ---

  const handleUpdateConfigBlock = (id: string, updates: Partial<TimeBlock>) => {
    const newConfig = currentConfig.map(block => 
      block.id === id ? { ...block, ...updates } : block
    );
    setData(prev => ({
      ...prev,
      [dateStr]: { ...currentDayData, config: newConfig }
    }));
  };

  const handleAddConfigBlock = () => {
    const newId = Date.now().toString();
    const newBlock: TimeBlock = {
      id: newId,
      name: '新时间段',
      start: 12,
      end: 13,
      enabled: true,
      color: 'text-slate-500'
    };
    setData(prev => ({
      ...prev,
      [dateStr]: { ...currentDayData, config: [...currentConfig, newBlock] }
    }));
  };

  const handleRemoveConfigBlock = (id: string) => {
    const newConfig = currentConfig.filter(block => block.id !== id);
    setData(prev => ({
      ...prev,
      [dateStr]: { ...currentDayData, config: newConfig }
    }));
  };

  const navigateDate = (direction: 'prev' | 'next') => {
    setCurrentDate(curr => addDays(curr, direction === 'prev' ? -1 : 1));
  };

  const handleExportData = () => {
    const dataStr = JSON.stringify(data, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `workflow_backup_${format(new Date(), 'yyyyMMdd')}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };
  
  // --- Sync Handlers (Simulated) ---
  const handleLogin = (e: React.FormEvent) => {
      e.preventDefault();
      // Simulate API call
      setSyncState('syncing');
      setTimeout(() => {
          setIsLoggedIn(true);
          setSyncState('idle');
          localStorage.setItem('workflow_account', JSON.stringify(account));
      }, 800);
  };

  const handleSync = () => {
      setSyncState('syncing');
      // Simulate Cloud Sync
      setTimeout(() => {
          setSyncState('success');
          setTimeout(() => setSyncState('idle'), 2000);
      }, 1500);
  };
  
  const handleLogout = () => {
      setIsLoggedIn(false);
      setAccount({ username: '', token: '' });
      localStorage.removeItem('workflow_account');
  };

  // --- Scale Handlers ---
  const adjustScale = (delta: number) => {
    setUiScale(prev => Math.min(1.4, Math.max(0.8, Number((prev + delta).toFixed(1)))));
  };

  // --- Logic to calculate Active Hours ---
  const activeHours = useMemo(() => {
    const hours: number[] = [];
    
    const isTimeInRanges = (hour: number) => {
      return currentConfig.some(block => {
        if (!block.enabled) return false;
        if (block.start > block.end) {
          // Cross midnight (e.g., 23 to 8)
          return hour >= block.start || hour < block.end;
        } else {
          // Normal day
          return hour >= block.start && hour < block.end;
        }
      });
    };

    for (let i = 0; i < 24; i++) {
      if (!isTimeInRanges(i)) {
        hours.push(i);
      }
    }
    return hours.sort((a, b) => a - b);
  }, [currentConfig]);

  // Helper for select options
  const hourOptions = Array.from({ length: 24 }, (_, i) => (
    <option key={i} value={i}>{i.toString().padStart(2, '0')}:00</option>
  ));

  const renderConfigRow = (block: TimeBlock) => (
    <div key={block.id} className="bg-white rounded-xl border border-slate-200 shadow-sm group relative" style={{ padding: `${10 * uiScale}px` }}>
        {/* Header: Name Input and Toggle */}
        <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-2 text-xs font-medium text-slate-700 flex-1 min-w-0">
                <span className={block.color || 'text-slate-400'}><Clock size={14 * uiScale} /></span>
                <input 
                  type="text" 
                  value={block.name}
                  onChange={(e) => handleUpdateConfigBlock(block.id, { name: e.target.value })}
                  className="bg-transparent border border-transparent hover:border-slate-200 focus:border-indigo-500 rounded px-1 w-full outline-none transition-colors"
                  style={{ fontSize: `${12 * uiScale}px` }}
                />
            </div>
            
            <div className="flex items-center gap-2">
                <button 
                  onClick={() => handleRemoveConfigBlock(block.id)}
                  className="text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                  title="删除此时间段"
                >
                  <Trash2 size={14 * uiScale} />
                </button>

                <label className="relative inline-flex items-center cursor-pointer flex-shrink-0">
                    <input type="checkbox" checked={block.enabled} onChange={() => handleUpdateConfigBlock(block.id, { enabled: !block.enabled })} className="sr-only peer" />
                    <div 
                        className={`bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:transition-all peer-checked:bg-slate-600`}
                        style={{ width: `${28 * uiScale}px`, height: `${16 * uiScale}px` }}
                    >
                        <style>{`
                            .peer-checked:after { transform: translateX(100%); }
                            .after\\:w-2\\.5 { width: ${(16 * uiScale) - 4}px !important; } 
                            .after\\:h-2\\.5 { height: ${(16 * uiScale) - 4}px !important; }
                        `}</style>
                    </div>
                </label>
            </div>
        </div>

        {/* Time Selectors */}
        <div className="flex items-center gap-2 text-xs">
            <select 
                value={block.start} 
                onChange={(e) => handleUpdateConfigBlock(block.id, { start: parseInt(e.target.value) })}
                className="bg-slate-50 border border-slate-200 rounded px-1.5 text-slate-700 outline-none focus:border-indigo-500"
                style={{ height: `${24 * uiScale}px` }}
                disabled={!block.enabled}
            >{hourOptions}</select>
            <span className="text-slate-300">➜</span>
            <select 
                value={block.end} 
                onChange={(e) => handleUpdateConfigBlock(block.id, { end: parseInt(e.target.value) })}
                className="bg-slate-50 border border-slate-200 rounded px-1.5 text-slate-700 outline-none focus:border-indigo-500"
                style={{ height: `${24 * uiScale}px` }}
                disabled={!block.enabled}
            >{hourOptions}</select>
        </div>
    </div>
  );

  // --- Dynamic Layout Classes based on Scale ---
  const isLargeScale = uiScale > 1.1;
  const gridContainerClass = isLargeScale 
    ? "grid grid-cols-1 md:grid-cols-2" // 2 columns (Top: Tracker|Stats, Bottom: Settings)
    : "grid grid-cols-1 md:grid-cols-12 md:divide-x divide-slate-200"; // 3 columns

  // Column Spans
  const colTrackerClass = isLargeScale ? "col-span-1 border-r border-slate-200" : "col-span-1 md:col-span-3";
  const colStatsClass = isLargeScale ? "col-span-1" : "col-span-1 md:col-span-5";
  const colSettingsClass = isLargeScale ? "col-span-1 md:col-span-2 border-t border-slate-200" : "col-span-1 md:col-span-4";


  return (
    <div className="h-screen bg-slate-200 text-slate-900 font-sans flex items-center justify-center sm:p-4 p-0 overflow-hidden">
      <div className="w-full max-w-7xl bg-slate-50 h-full sm:h-[95vh] sm:rounded-2xl shadow-2xl overflow-hidden flex flex-col relative border border-slate-300 transition-all duration-300">
        
        {/* Top Bar */}
        <header className="bg-white px-4 py-3 border-b border-slate-200 flex-shrink-0 flex items-center justify-between">
             <div className="flex items-center gap-4">
                <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600 hidden sm:block">
                    WorkFlow
                </h1>
                
                {/* Date Navigator */}
                <div className="flex items-center bg-slate-50 p-1 rounded-lg border border-slate-200">
                  <button onClick={() => navigateDate('prev')} className="p-1 hover:text-indigo-600"><ChevronLeft size={16}/></button>
                  <div className="px-3 flex items-baseline gap-1">
                    <span className="font-bold text-slate-700 text-sm">{format(currentDate, 'MM月dd日')}</span>
                    <span className="text-xs text-slate-400 font-medium">{WEEK_DAYS[currentDate.getDay()]}</span>
                  </div>
                  <button onClick={() => navigateDate('next')} className="p-1 hover:text-indigo-600"><ChevronRight size={16}/></button>
                </div>
             </div>
             
             <div className="flex items-center gap-3">
                 {/* Journal Button - New! */}
                 <button 
                    onClick={() => setShowJournalModal(true)} 
                    className="flex items-center gap-1.5 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 hover:text-indigo-700 px-3 py-1.5 rounded-lg border border-indigo-100 transition-all text-xs font-medium"
                 >
                     <PenLine size={16} />
                     <span className="hidden sm:inline">写日记</span>
                 </button>

                 <div className="h-6 w-px bg-slate-200 mx-1 hidden sm:block"></div>

                 {/* Sync Button */}
                 <button onClick={() => setShowSyncModal(true)} className="p-1.5 text-slate-400 hover:text-indigo-600 rounded-lg hover:bg-slate-50 border border-transparent hover:border-slate-200 transition-all">
                     <Cloud size={18} />
                 </button>

                 {/* Zoom Controls */}
                 <div className="flex items-center gap-1 bg-slate-50 rounded-lg border border-slate-200 p-1 hidden sm:flex">
                    <button onClick={() => adjustScale(-0.1)} className="p-1 text-slate-400 hover:text-indigo-600 disabled:opacity-30" disabled={uiScale <= 0.8}>
                        <ZoomOut size={16} />
                    </button>
                    <div className="w-8 text-center text-xs font-mono text-slate-500">{Math.round(uiScale * 100)}%</div>
                    <button onClick={() => adjustScale(0.1)} className="p-1 text-slate-400 hover:text-indigo-600 disabled:opacity-30" disabled={uiScale >= 1.4}>
                        <ZoomIn size={16} />
                    </button>
                 </div>
                 
                 <button onClick={handleExportData} className="text-slate-400 hover:text-indigo-600 hidden sm:block"><Download size={18} /></button>
             </div>
        </header>

        {/* Main Content Grid (Dynamic Layout) */}
        <div className={`flex-1 overflow-hidden ${gridContainerClass}`}>
            
            {/* COLUMN 1: TRACKER */}
            <div className={`${colTrackerClass} flex flex-col h-full bg-white overflow-hidden ${activeTab === 'STATS' ? 'hidden md:flex' : 'flex'}`}>
                <Tracker 
                    currentLog={currentLog} 
                    onUpdateStatus={handleUpdateStatus} 
                    activeHours={activeHours}
                    scale={uiScale}
                />
            </div>

            {/* COLUMN 2: STATISTICS */}
            <div className={`${colStatsClass} flex flex-col h-full bg-slate-50 overflow-hidden ${activeTab === 'TRACKER' ? 'hidden md:flex' : 'flex'}`}>
                 <Statistics 
                    currentLog={currentLog} 
                    allData={data} 
                    dateStr={dateStr}
                    activeHoursCount={activeHours.length}
                    scale={uiScale}
                />
            </div>

            {/* COLUMN 3: SETTINGS & TODO */}
            <div className={`${colSettingsClass} flex flex-col h-full bg-white overflow-hidden ${activeTab === 'TRACKER' ? 'hidden md:flex' : 'flex'}`}>
                
                {/* 1. Time Settings (Fixed max height roughly) */}
                <div className="flex-none border-b border-slate-100 bg-slate-50/50 flex flex-col min-h-0" style={{ padding: `${16 * uiScale}px`, height: '45%' }}>
                    <div className="flex items-center justify-between mb-3 flex-shrink-0">
                        <div className="flex items-center gap-2 text-slate-700 font-semibold text-sm">
                            <Coffee size={16 * uiScale} className="text-indigo-500" />
                            <span>非工作时间</span>
                        </div>
                        <button 
                            onClick={handleAddConfigBlock}
                            className="p-1 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors"
                            title="添加时间段"
                        >
                            <Plus size={16 * uiScale} />
                        </button>
                    </div>

                    <div className="overflow-y-auto pr-1 flex-1">
                        <div className="grid grid-cols-1 gap-2" style={{ gridTemplateColumns: isLargeScale ? 'repeat(auto-fill, minmax(200px, 1fr))' : '1fr' }}>
                            {currentConfig.map(block => renderConfigRow(block))}
                        </div>
                    </div>
                </div>

                {/* 2. Todo List (Flex-1) */}
                <div className="flex-1 bg-white flex flex-col min-h-0" style={{ padding: `${16 * uiScale}px` }}>
                    <div className="flex items-center justify-between mb-3 flex-shrink-0" style={{ marginBottom: `${12 * uiScale}px` }}>
                        <div className="flex items-center gap-2 text-slate-700 font-semibold text-sm">
                            <CheckSquare size={16 * uiScale} className="text-indigo-500" />
                            <span>待办事项</span>
                        </div>
                        <span className="text-[10px] text-indigo-500 font-medium bg-indigo-50 px-2 py-0.5 rounded-full">
                            {currentTodos.filter(t => t.completed).length}/5
                        </span>
                    </div>
                    
                    <div className="flex-1 overflow-y-auto min-h-0 pr-1">
                        <div className="flex flex-col" style={{ gap: `${8 * uiScale}px` }}>
                            {Array.from({ length: 5 }).map((_, idx) => {
                                const todo = currentTodos[idx] || { id: idx, text: '', completed: false };
                                return (
                                    <div key={idx} className="flex items-center gap-3 group rounded-lg hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100 flex-shrink-0" style={{ padding: `${8 * uiScale}px` }}>
                                        <button
                                            onClick={() => handleUpdateTodo(idx, { completed: !todo.completed })}
                                            className={`flex-shrink-0 transition-colors ${todo.completed ? 'text-indigo-500' : 'text-slate-300 hover:text-indigo-400'}`}
                                        >
                                            {todo.completed ? <CheckSquare size={18 * uiScale} /> : <Square size={18 * uiScale} />}
                                        </button>
                                        <div className="flex-1 relative h-full flex items-center">
                                            <input 
                                                type="text"
                                                value={todo.text}
                                                onChange={(e) => handleUpdateTodo(idx, { text: e.target.value })}
                                                placeholder={`事项 ${idx + 1}`}
                                                className={`
                                                    w-full bg-transparent border-none p-0
                                                    text-sm outline-none transition-all
                                                    ${todo.completed ? 'text-slate-400 line-through' : 'text-slate-700'}
                                                    placeholder:text-slate-300
                                                `}
                                            />
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                    <div className="flex-shrink-0 pt-2 border-t border-slate-50 text-center" style={{ marginTop: `${12 * uiScale}px` }}>
                        <span className="text-[10px] text-slate-300">今日事今日毕</span>
                    </div>
                </div>

            </div>

        </div>

        {/* Journal Modal */}
        {showJournalModal && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/20 backdrop-blur-sm animate-in fade-in duration-200">
                <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl h-[80vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
                    <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 flex-shrink-0">
                        <div className="flex flex-col">
                            <h3 className="font-semibold text-slate-800 flex items-center gap-2 text-lg">
                                <BookOpen size={20} className="text-indigo-500"/> 每日随笔
                            </h3>
                            <span className="text-xs text-slate-500 mt-1">{format(currentDate, 'yyyy年MM月dd日')} {WEEK_DAYS[currentDate.getDay()]}</span>
                        </div>
                        <button onClick={() => setShowJournalModal(false)} className="text-slate-400 hover:text-slate-600 p-1 hover:bg-slate-100 rounded-lg">
                            <X size={24} />
                        </button>
                    </div>
                    
                    <div className="flex-1 p-6 bg-white overflow-hidden flex flex-col">
                        <textarea
                            value={currentJournal}
                            onChange={(e) => handleUpdateJournal(e.target.value)}
                            placeholder="记录今天的想法、反思、小确幸，或者任何想写下来的东西..."
                            className="w-full h-full text-base text-slate-700 placeholder:text-slate-300 resize-none outline-none leading-relaxed"
                            autoFocus
                        />
                    </div>

                    <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/30 flex justify-end gap-3 flex-shrink-0">
                        <button 
                            onClick={() => setShowJournalModal(false)}
                            className="text-slate-500 hover:text-slate-700 px-4 py-2 text-sm"
                        >
                            取消
                        </button>
                        <button 
                            onClick={() => setShowJournalModal(false)}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg text-sm font-medium flex items-center gap-2 shadow-sm hover:shadow transition-all"
                        >
                            <Save size={16} /> 保存
                        </button>
                    </div>
                </div>
            </div>
        )}

        {/* Sync Modal */}
        {showSyncModal && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/20 backdrop-blur-sm animate-in fade-in duration-200">
                <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200">
                    <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                        <h3 className="font-semibold text-slate-800 flex items-center gap-2">
                            <Cloud size={18} className="text-indigo-500"/> 账号与同步
                        </h3>
                        <button onClick={() => setShowSyncModal(false)} className="text-slate-400 hover:text-slate-600">
                            <X size={20} />
                        </button>
                    </div>
                    
                    <div className="p-6">
                        {!isLoggedIn ? (
                            <form onSubmit={handleLogin} className="space-y-4">
                                <div className="space-y-3">
                                    <div className="space-y-1">
                                        <label className="text-xs font-medium text-slate-500">用户名</label>
                                        <div className="relative">
                                            <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                            <input 
                                                type="text" 
                                                required
                                                value={account.username}
                                                onChange={e => setAccount({...account, username: e.target.value})}
                                                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-indigo-500 transition-colors"
                                                placeholder="输入任意用户名"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs font-medium text-slate-500">同步令牌 (Token)</label>
                                        <div className="relative">
                                            <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                            <input 
                                                type="password" 
                                                required
                                                value={account.token}
                                                onChange={e => setAccount({...account, token: e.target.value})}
                                                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-indigo-500 transition-colors"
                                                placeholder="输入任意密码以模拟登录"
                                            />
                                        </div>
                                    </div>
                                </div>
                                <button 
                                    type="submit" 
                                    disabled={syncState === 'syncing'}
                                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
                                >
                                    {syncState === 'syncing' ? <RefreshCw className="animate-spin" size={16} /> : '登录 / 注册'}
                                </button>
                                <p className="text-xs text-center text-slate-400 mt-2">
                                    这只是一个演示界面，点击登录后解锁同步按钮。
                                </p>
                            </form>
                        ) : (
                            <div className="space-y-4">
                                <div className="bg-indigo-50 rounded-lg p-3 flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-lg">
                                        {account.username.charAt(0).toUpperCase()}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="font-medium text-slate-900 truncate">{account.username}</div>
                                        <div className="text-xs text-indigo-600/70">已连接至云端节点</div>
                                    </div>
                                    <button onClick={handleLogout} className="text-xs text-slate-400 hover:text-red-500 underline">退出</button>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <button 
                                        onClick={handleSync}
                                        disabled={syncState === 'syncing'}
                                        className="flex flex-col items-center justify-center gap-2 p-4 bg-white border border-slate-200 hover:border-indigo-500 hover:bg-slate-50 rounded-xl transition-all group"
                                    >
                                        <UploadCloud size={24} className="text-slate-400 group-hover:text-indigo-500 transition-colors" />
                                        <span className="text-xs font-medium text-slate-600">上传备份</span>
                                    </button>
                                    <button 
                                        onClick={handleSync}
                                        disabled={syncState === 'syncing'}
                                        className="flex flex-col items-center justify-center gap-2 p-4 bg-white border border-slate-200 hover:border-indigo-500 hover:bg-slate-50 rounded-xl transition-all group"
                                    >
                                        <DownloadCloud size={24} className="text-slate-400 group-hover:text-indigo-500 transition-colors" />
                                        <span className="text-xs font-medium text-slate-600">恢复数据</span>
                                    </button>
                                </div>
                                
                                {syncState === 'syncing' && (
                                    <div className="text-xs text-center text-indigo-500 flex items-center justify-center gap-1.5">
                                        <RefreshCw size={12} className="animate-spin" /> 正在同步数据...
                                    </div>
                                )}
                                {syncState === 'success' && (
                                    <div className="text-xs text-center text-emerald-500 font-medium">
                                        同步成功！数据已安全存储。
                                    </div>
                                )}
                                
                                <div className="pt-4 border-t border-slate-100 mt-2">
                                     <h4 className="text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wider">手动备份</h4>
                                     <button onClick={handleExportData} className="w-full border border-slate-200 text-slate-600 hover:bg-slate-50 py-2 rounded-lg text-xs flex items-center justify-center gap-2 transition-colors">
                                        <Download size={14} /> 导出 JSON 文件
                                     </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        )}

        {/* Mobile Bottom Navigation */}
        <nav className="bg-white border-t border-slate-200 pb-safe md:hidden absolute bottom-0 left-0 right-0 z-50 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
            <div className="flex justify-around items-center p-2">
            <button onClick={() => setActiveTab('TRACKER')} className={`flex flex-col items-center p-2 flex-1 rounded-lg ${activeTab === 'TRACKER' ? 'text-indigo-600 bg-indigo-50' : 'text-slate-400'}`}>
                <LayoutList size={20} />
            </button>
            <button onClick={() => setActiveTab('STATS')} className={`flex flex-col items-center p-2 flex-1 rounded-lg ${activeTab === 'STATS' ? 'text-indigo-600 bg-indigo-50' : 'text-slate-400'}`}>
                <PieChartIcon size={20} />
            </button>
            </div>
        </nav>
      </div>
    </div>
  );
};

export default App;