import React from 'react';
import { DayLog, WorkStatus } from '../types';
import { STATUS_CONFIGS, getIcon } from '../constants';
import { Clock } from 'lucide-react';

interface TrackerProps {
  currentLog: DayLog;
  onUpdateStatus: (hour: number, status: WorkStatus) => void;
  activeHours: number[];
  scale: number;
}

export const Tracker: React.FC<TrackerProps> = ({ currentLog, onUpdateStatus, activeHours, scale }) => {
  return (
    <div className="flex flex-col h-full bg-white relative"> 
      
      {/* Header */}
      <div className="border-b border-slate-100 flex justify-between items-center bg-white flex-shrink-0 z-10" style={{ padding: `${12 * scale}px ${16 * scale}px` }}>
        <h2 className="font-semibold text-slate-800 flex items-center gap-2 text-sm">
          <Clock size={16 * scale} className="text-indigo-500" />
          <span>有效时间 ({activeHours.length}h)</span>
        </h2>
      </div>

      {/* Grid Rows - Flex 1 to fill available space evenly */}
      <div className="flex-1 flex flex-col min-h-0 overflow-y-auto">
        {activeHours.length > 0 ? (
          activeHours.map((hour) => {
            const status = currentLog[hour] || WorkStatus.EMPTY;
            const config = STATUS_CONFIGS[status];
            const isCurrentHour = new Date().getHours() === hour;

            return (
              <div 
                key={hour} 
                className="flex-1 flex items-center gap-2 border-b border-slate-50 last:border-0 hover:bg-slate-50/50 transition-colors"
                style={{ minHeight: `${48 * scale}px`, paddingLeft: `${12 * scale}px`, paddingRight: `${12 * scale}px` }}
              >
                {/* Time Label */}
                <div className={`text-right text-xs font-mono leading-none flex-shrink-0 ${isCurrentHour ? 'text-indigo-600 font-bold' : 'text-slate-400'}`} style={{ width: `${40 * scale}px` }}>
                  {hour.toString().padStart(2, '0')}:00
                </div>
                
                {/* Buttons Container */}
                <div className="flex-1 py-1"> 
                  <div className="grid grid-cols-3 gap-1 h-full">
                     {[WorkStatus.SLACKING, WorkStatus.NORMAL, WorkStatus.FOCUSED].map((s) => {
                       const sConf = STATUS_CONFIGS[s];
                       const isActive = status === s;
                       
                       return (
                         <button
                           key={s}
                           onClick={() => onUpdateStatus(hour, isActive ? WorkStatus.EMPTY : s)}
                           className={`
                             relative flex items-center justify-center gap-1.5 rounded-md text-[11px] font-medium transition-all duration-200
                             w-full
                             ${isActive 
                               ? `${sConf.color} shadow-sm ring-1 ring-black/5` 
                               : 'text-slate-400 hover:bg-white hover:shadow-sm hover:text-slate-600 bg-slate-50/50'
                             }
                           `}
                           style={{ height: `${32 * scale}px` }}
                           title={sConf.label}
                         >
                           {/* Icon */}
                           <span className={`transition-transform duration-200 ${isActive ? 'scale-110' : ''}`}>
                              {getIcon(sConf.icon, 16 * scale)}
                           </span>
                           <span className="truncate">{sConf.label}</span>
                         </button>
                       );
                     })}
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-400 text-sm gap-2">
            <Clock size={24 * scale} className="opacity-20" />
            <p>全天都在休息/外出中</p>
          </div>
        )}
      </div>
    </div>
  );
};