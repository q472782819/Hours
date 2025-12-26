import React, { useMemo } from 'react';
import { DayLog, WorkStatus, AppData } from '../types';
import { STATUS_CONFIGS } from '../constants';
import { 
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip, 
  BarChart, Bar, XAxis, YAxis, CartesianGrid
} from 'recharts';
import { Award, AlertCircle, TrendingUp } from 'lucide-react';
import { format, subDays, parseISO } from 'date-fns';

interface StatisticsProps {
  currentLog: DayLog;
  allData: AppData;
  dateStr: string;
  activeHoursCount: number;
  scale: number;
}

export const Statistics: React.FC<StatisticsProps> = ({ currentLog, allData, dateStr, activeHoursCount, scale }) => {

  // Calculate Daily Stats
  const stats = useMemo(() => {
    let slacking = 0;
    let normal = 0;
    let focused = 0;
    let totalRecorded = 0;
    let totalScore = 0;

    (Object.values(currentLog) as WorkStatus[]).forEach((status) => {
      if (status === WorkStatus.SLACKING) slacking++;
      if (status === WorkStatus.NORMAL) normal++;
      if (status === WorkStatus.FOCUSED) focused++;
      
      if (status !== WorkStatus.EMPTY) {
        totalRecorded++;
        totalScore += STATUS_CONFIGS[status].score; // 0, 1, or 2
      }
    });

    // Score Ratio Logic
    const focusScore = totalRecorded > 0 ? Math.round((totalScore / (totalRecorded * 2)) * 100) : 0;

    return { slacking, normal, focused, totalRecorded, focusScore };
  }, [currentLog]);

  // Calculate History Stats (Last 7 Days)
  const historyData = useMemo(() => {
    const data = [];
    const today = parseISO(dateStr);
    
    for (let i = 6; i >= 0; i--) {
      const d = subDays(today, i);
      const dStr = format(d, 'yyyy-MM-dd');
      const dayData = allData[dStr];
      const log = dayData ? ('log' in dayData ? dayData.log : (dayData as any)) : {}; 
      
      let slacking = 0;
      let normal = 0;
      let focused = 0;
      
      if (log) {
        Object.values(log as DayLog).forEach((status) => {
          if (status === WorkStatus.SLACKING) slacking++;
          if (status === WorkStatus.NORMAL) normal++;
          if (status === WorkStatus.FOCUSED) focused++;
        });
      }

      data.push({
        date: format(d, 'MM/dd'),
        '摸鱼': slacking,
        '工作': normal,
        '努力': focused,
      });
    }
    return data;
  }, [allData, dateStr]);

  const pieChartData = [
    { name: '摸鱼', value: stats.slacking, color: '#10b981' }, 
    { name: '工作', value: stats.normal, color: '#3b82f6' },   
    { name: '努力', value: stats.focused, color: '#e11d48' },  
  ].filter(d => d.value > 0);

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-rose-600';
    if (score >= 50) return 'text-blue-600';
    return 'text-emerald-600';
  };

  const getScoreLabel = (score: number) => {
    if (score >= 80) return '全速前进';
    if (score >= 50) return '稳步推进';
    return '状态低迷';
  };

  const hoursToRecord = Math.max(0, activeHoursCount - stats.totalRecorded);

  return (
    <div className="h-full flex flex-col overflow-hidden" style={{ padding: `${16 * scale}px` }}>
      
      {/* Top Stats Cards */}
      <div className="grid grid-cols-2 flex-shrink-0" style={{ gap: `${16 * scale}px`, marginBottom: `${16 * scale}px` }}>
        <div className="bg-white rounded-2xl shadow-[0_2px_8px_-2px_rgba(0,0,0,0.05)] border border-slate-100 flex flex-col justify-between" style={{ padding: `${16 * scale}px` }}>
          <div className="flex items-center gap-2 text-slate-500 mb-2">
               <Award size={16 * scale} className="text-rose-500" />
               <span className="text-xs font-medium uppercase tracking-wider">有效工作比例</span>
          </div>
          <div className="flex items-baseline justify-between">
            <span className={`font-bold ${getScoreColor(stats.focusScore)}`} style={{ fontSize: `${30 * scale}px`, lineHeight: 1 }}>{stats.focusScore}<span className="text-base">%</span></span>
            <span className="text-xs text-slate-400 font-medium">{getScoreLabel(stats.focusScore)}</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-[0_2px_8px_-2px_rgba(0,0,0,0.05)] border border-slate-100 flex flex-col justify-between" style={{ padding: `${16 * scale}px` }}>
           <div className="flex items-center gap-2 text-slate-500 mb-2">
                <AlertCircle size={16 * scale} className="text-blue-500" />
                <span className="text-xs font-medium uppercase tracking-wider">记录进度</span>
           </div>
           <div className="flex items-baseline justify-between">
             <span className="font-bold text-slate-700" style={{ fontSize: `${30 * scale}px`, lineHeight: 1 }}>{Math.round((stats.totalRecorded / (activeHoursCount || 1)) * 100)}<span className="text-base font-normal text-slate-400">%</span></span>
             <span className="text-xs text-slate-400">还需 {hoursToRecord}h</span>
           </div>
        </div>
      </div>

      {/* Main Charts Area */}
      <div className="flex-1 flex flex-col min-h-0" style={{ gap: `${16 * scale}px` }}>
        
        {/* Pie Chart */}
        <div className="flex-1 bg-white rounded-2xl shadow-[0_2px_8px_-2px_rgba(0,0,0,0.05)] border border-slate-100 flex flex-col min-h-0" style={{ padding: `${16 * scale}px` }}>
            <h3 className="text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
                今日分布
            </h3>
            <div className="flex-1 min-h-0 relative">
                {stats.totalRecorded > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={pieChartData}
                            cx="50%"
                            cy="50%"
                            innerRadius="50%"
                            outerRadius="80%"
                            paddingAngle={5}
                            dataKey="value"
                            stroke="none"
                        >
                            {pieChartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                        </Pie>
                        <Tooltip 
                            contentStyle={{ borderRadius: '12px', padding: '8px 12px', fontSize: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                        />
                    </PieChart>
                </ResponsiveContainer>
                ) : (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-300 gap-2">
                        <div className="rounded-full border-4 border-slate-100" style={{ width: `${64 * scale}px`, height: `${64 * scale}px` }}></div>
                        <span className="text-xs">等待数据...</span>
                    </div>
                )}
            </div>
            {/* Legend */}
            <div className="flex justify-center mt-2" style={{ gap: `${16 * scale}px` }}>
                {pieChartData.map(d => (
                    <div key={d.name} className="flex items-center gap-1.5">
                        <div className="w-2 h-2 rounded-full" style={{background: d.color}}></div>
                        <span className="text-xs text-slate-500">{d.name}</span>
                    </div>
                ))}
            </div>
        </div>

        {/* Bar Chart */}
        <div className="flex-1 bg-white rounded-2xl shadow-[0_2px_8px_-2px_rgba(0,0,0,0.05)] border border-slate-100 flex flex-col min-h-0" style={{ padding: `${16 * scale}px` }}>
            <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                    <TrendingUp size={16 * scale} className="text-indigo-500"/>
                    趋势分析
                </h3>
            </div>
            <div className="flex-1 min-h-0">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={historyData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }} barGap={2}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10}} dy={10} />
                        <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10}} />
                        <Tooltip 
                            cursor={{fill: '#f8fafc', radius: 4}}
                            contentStyle={{ borderRadius: '12px', padding: '8px 12px', fontSize: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                        />
                        <Bar dataKey="摸鱼" stackId="a" fill="#10b981" radius={[0, 0, 2, 2]} barSize={16 * scale} />
                        <Bar dataKey="工作" stackId="a" fill="#3b82f6" radius={[0, 0, 0, 0]} barSize={16 * scale} />
                        <Bar dataKey="努力" stackId="a" fill="#e11d48" radius={[4, 4, 0, 0]} barSize={16 * scale} />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>

      </div>
    </div>
  );
};