
"use client";

import React, { useState, useMemo } from "react";
import HabitDetailModal from "./HabitDetailModal";

interface HabitItem {
  id: string;
  title: string;
  icon: string | null;
  streak: number;
  createdAt: string | Date;
}

interface HabitLogItem {
  id: string;
  habitId: string;
  date: string | Date;
  isCompleted: boolean;
}

function toLocalDateStr(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

// 清新的浅色系色彩映射
const THEME_COLORS = [
  { hex: '#3B82F6', light: 'rgba(59, 130, 246, 0.2)' }, // Blue
  { hex: '#8B5CF6', light: 'rgba(139, 92, 246, 0.2)' }, // Violet
  { hex: '#10B981', light: 'rgba(16, 185, 129, 0.2)' }, // Emerald
  { hex: '#F43F5E', light: 'rgba(244, 63, 94, 0.2)' },  // Rose
  { hex: '#F59E0B', light: 'rgba(245, 158, 11, 0.2)' }  // Amber
];

export default function HabitMatrixView({
  habits,
  logs
}: {
  habits: HabitItem[];
  logs: HabitLogItem[];
}) {
  const [selectedHabit, setSelectedHabit] = useState<HabitItem | null>(null);
  const [displayDays, setDisplayDays] = useState<14 | 30>(14);

  const dateColumns = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const cols = [];
    for (let i = displayDays - 1; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      cols.push({
        date: d,
        dateStr: toLocalDateStr(d),
        day: String(d.getDate())
      });
    }
    return cols;
  }, [displayDays]);

  const logMap = useMemo(() => {
    const map = new Map<string, boolean>();
    logs.forEach(l => {
      if (l.isCompleted) {
        const dStr = toLocalDateStr(new Date(l.date));
        map.set(`${l.habitId}_${dStr}`, true);
      }
    });
    return map;
  }, [logs]);

  const perfectDayMap = useMemo(() => {
    const perfectMap = new Map<string, boolean>();
    const todayStr = toLocalDateStr(new Date());

    dateColumns.forEach(col => {
      if (col.dateStr > todayStr) {
        perfectMap.set(col.dateStr, false);
        return;
      }
      const activeHabitsOnDate = habits.filter(h => toLocalDateStr(new Date(h.createdAt)) <= col.dateStr);
      if (activeHabitsOnDate.length > 0) {
        const allCompleted = activeHabitsOnDate.every(h => logMap.has(`${h.id}_${col.dateStr}`));
        perfectMap.set(col.dateStr, allCompleted);
      } else {
        perfectMap.set(col.dateStr, false);
      }
    });
    return perfectMap;
  }, [dateColumns, habits, logMap]);

  if (habits.length === 0) {
    return null;
  }

  return (
    <div className="w-full bg-white border border-slate-100 rounded-[24px] p-6 sm:p-8 flex flex-col relative overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.04)] mt-8">
      
      {/* 装饰性光带 - 浅色版 */}
      <div className="absolute top-0 left-1/4 right-1/4 h-[2px] bg-gradient-to-r from-transparent via-blue-400 to-transparent opacity-20"></div>

      {/* 极简 Header */}
      <div className="flex justify-between items-end mb-8 border-b border-slate-100 pb-4">
        <div>
          <h2 className="text-[18px] font-bold text-slate-800 tracking-widest uppercase flex items-center gap-3 font-sans">
            <div className="w-6 h-6 rounded-md border border-blue-100 flex items-center justify-center bg-blue-50/50">
              <div className="w-2 h-2 rounded-sm bg-blue-500 shadow-sm shadow-blue-200"></div>
            </div>
            <span>习惯全景</span>
          </h2>
          <p className="text-[10px] text-slate-400 mt-2 tracking-widest">最顶级的自律是中断之后继续开始</p>
        </div>
        
        {/* 状态切换器 */}
        <div className="flex gap-4">
          <button onClick={() => setDisplayDays(14)} className={`text-[12px] font-bold relative tracking-widest transition-colors ${displayDays === 14 ? 'text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}>
            14天
            {displayDays === 14 && <div className="absolute -bottom-[17px] left-0 right-0 h-[2px] bg-blue-600"></div>}
          </button>
          <button onClick={() => setDisplayDays(30)} className={`text-[12px] font-bold relative tracking-widest transition-colors ${displayDays === 30 ? 'text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}>
            30天
            {displayDays === 30 && <div className="absolute -bottom-[17px] left-0 right-0 h-[2px] bg-blue-600"></div>}
          </button>
        </div>
      </div>

      <div className="relative w-full overflow-x-auto no-scrollbar pb-2">
        <div className="min-w-max">
          
          {/* 表头：日期 (HUD 风格) */}
          <div className="flex mb-5 items-end">
            <div className="w-[140px] shrink-0 text-[9px] font-bold text-slate-400 tracking-[0.2em] pl-1 uppercase sticky left-0 z-20 bg-white/95 backdrop-blur-sm">习惯项目</div>
            <div className="flex">
              {dateColumns.map(col => {
                const isPerfect = perfectDayMap.get(col.dateStr);
                const textColor = isPerfect ? 'text-slate-800' : 'text-slate-400';
                return (
                  <div key={col.dateStr} className="flex flex-col items-center justify-end w-8 shrink-0">
                    <div className={`text-[10px] mb-1 leading-none font-bold transition-colors ${isPerfect ? 'text-blue-500' : 'text-transparent'}`}>+</div>
                    <span className={`text-[13px] ${textColor} tracking-wider font-bold`}>{col.day}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 习惯列表 */}
          <div className="flex flex-col gap-5">
            {habits.map((habit, index) => {
              const theme = THEME_COLORS[index % THEME_COLORS.length];
              const habitCreatedStr = toLocalDateStr(new Date(habit.createdAt));

              return (
                <div key={habit.id} onClick={() => setSelectedHabit(habit)} className="flex items-center h-7 rounded-lg group relative cursor-pointer">
                  {/* 悬停轨道背景 */}
                  <div className="absolute inset-0 bg-slate-50 opacity-0 group-hover:opacity-100 rounded-md transition-opacity"></div>
                  
                  {/* 细长的贯穿底线 */}
                  <div className="absolute left-[140px] right-4 top-1/2 -translate-y-1/2 h-[1px] bg-slate-100 z-0"></div>

                  <div className="w-[140px] shrink-0 flex items-center pr-4 tracking-wide sticky left-0 z-20 bg-white/95 backdrop-blur-sm group-hover:bg-slate-50/95 transition-colors">
                    <span className="text-[13px] font-bold text-slate-700 truncate flex-1 group-hover:text-slate-900 transition-colors">{habit.title}</span>
                    <span className="text-[11px] font-black ml-2 w-5 text-right transition-all" style={{ color: theme.hex }}>
                      {habit.streak}
                    </span>
                  </div>

                  <div className="flex z-10">
                    {dateColumns.map((col, i) => {
                      const isDone = logMap.has(`${habit.id}_${col.dateStr}`);
                      const isNextDone = i < dateColumns.length - 1 && logMap.has(`${habit.id}_${dateColumns[i+1].dateStr}`);
                      const isBeforeCreated = col.dateStr < habitCreatedStr;

                      return (
                        <div key={col.dateStr} className="relative flex justify-center items-center w-8 shrink-0 group-hover:scale-110 transition-transform">
                          {isDone && isNextDone && (
                            <div className="absolute left-1/2 right-[-50%] top-1/2 -translate-y-1/2 h-[2px] z-0 opacity-40" style={{ background: theme.hex }}></div>
                          )}
                          {isDone ? (
                            <div className="w-[8px] h-[8px] rounded-full z-10 relative" style={{ background: theme.hex, boxShadow: `0 2px 6px ${theme.light}` }}></div>
                          ) : isBeforeCreated ? (
                            <div className="w-[4px] h-[4px] bg-transparent rounded-full z-10 relative"></div>
                          ) : (
                            <div className="w-[4px] h-[4px] bg-slate-200 rounded-full z-10 relative"></div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

        </div>
      </div>

      {selectedHabit && (
        <HabitDetailModal
          habit={selectedHabit}
          logs={logs.filter(l => l.habitId === selectedHabit.id)}
          onClose={() => setSelectedHabit(null)}
        />
      )}
    </div>
  );
}
