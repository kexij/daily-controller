"use client";

import React, { useState, useMemo, useRef, useEffect } from "react";
import HabitDetailModal from "./HabitDetailModal";
import { ChevronRight, ChevronLeft } from "lucide-react";

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
  // 默认收起习惯名称，最大限度放大时间轴连线可视范围
  const [isCollapsed, setIsCollapsed] = useState(true);

  const scrollContainerRef = useRef<HTMLDivElement>(null);

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

  // 当切换天数或收起状态时，自动平滑对齐到最新日期（最右侧）
  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollLeft = scrollContainerRef.current.scrollWidth;
    }
  }, [displayDays, isCollapsed]);

  if (habits.length === 0) {
    return null;
  }

  const leftColWidth = isCollapsed ? 56 : 140;

  return (
    <div className="w-full bg-white border border-slate-100 rounded-[24px] p-5 sm:p-8 flex flex-col relative overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.04)] mt-8">
      
      {/* 装饰性光带 - 浅色版 */}
      <div className="absolute top-0 left-1/4 right-1/4 h-[2px] bg-gradient-to-r from-transparent via-blue-400 to-transparent opacity-20"></div>

      {/* Header 区域 */}
      <div className="flex justify-between items-end mb-6 border-b border-slate-100 pb-4">
        <div>
          <h2 className="text-[18px] font-bold text-slate-800 tracking-widest uppercase flex items-center gap-3 font-sans">
            <div className="w-6 h-6 rounded-md border border-blue-100 flex items-center justify-center bg-blue-50/50">
              <div className="w-2 h-2 rounded-sm bg-blue-500 shadow-sm shadow-blue-200"></div>
            </div>
            <span>习惯全景</span>
          </h2>
          <p className="text-[10px] text-slate-400 mt-1.5 tracking-wider">最顶级的自律是中断之后继续开始</p>
        </div>
        
        {/* 状态切换器 */}
        <div className="flex gap-4">
          <button onClick={() => setDisplayDays(14)} className={`text-[12px] font-bold relative tracking-widest transition-colors cursor-pointer ${displayDays === 14 ? 'text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}>
            14天
            {displayDays === 14 && <div className="absolute -bottom-[17px] left-0 right-0 h-[2px] bg-blue-600"></div>}
          </button>
          <button onClick={() => setDisplayDays(30)} className={`text-[12px] font-bold relative tracking-widest transition-colors cursor-pointer ${displayDays === 30 ? 'text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}>
            30天
            {displayDays === 30 && <div className="absolute -bottom-[17px] left-0 right-0 h-[2px] bg-blue-600"></div>}
          </button>
        </div>
      </div>

      <div ref={scrollContainerRef} className="relative w-full overflow-x-auto no-scrollbar pb-2">
        <div className="flex min-w-max">
          
          {/* 左侧完全不透明的独立侧边栏 (Sticky Column) */}
          <div 
            style={{ width: `${leftColWidth}px` }} 
            className="sticky left-0 z-20 bg-white shrink-0 border-r border-slate-100 shadow-[4px_0_12px_rgba(0,0,0,0.03)] flex flex-col select-none transition-all"
          >
            {/* 侧边栏表头 */}
            <div className="h-10 flex items-end justify-between pl-1 pr-2 mb-3">
              <span className="text-[10px] font-bold text-slate-400 truncate">{isCollapsed ? '习惯' : '习惯项目'}</span>
              <button
                type="button"
                onClick={() => setIsCollapsed(!isCollapsed)}
                className="p-1 rounded-md text-slate-400 hover:text-blue-600 hover:bg-slate-100 transition-colors cursor-pointer active:scale-95"
                title={isCollapsed ? "展开习惯名称" : "收起习惯名称，放大时间轴"}
              >
                {isCollapsed ? (
                  <ChevronRight className="w-3.5 h-3.5" />
                ) : (
                  <ChevronLeft className="w-3.5 h-3.5" />
                )}
              </button>
            </div>

            {/* 侧边栏习惯列表 */}
            <div className="flex flex-col gap-4">
              {habits.map((habit, index) => {
                const theme = THEME_COLORS[index % THEME_COLORS.length];
                return (
                  <div
                    key={habit.id}
                    onClick={() => setSelectedHabit(habit)}
                    className={`h-8 flex items-center rounded-lg hover:bg-slate-50 transition-colors cursor-pointer ${
                      isCollapsed ? 'justify-center px-1' : 'justify-between px-2 pr-3'
                    }`}
                    title={habit.title}
                  >
                    {isCollapsed ? (
                      <div className="flex items-center gap-1">
                        <span className="text-base select-none leading-none">{habit.icon || '✨'}</span>
                        <span className="text-[11px] font-black leading-none" style={{ color: theme.hex }}>
                          {habit.streak}
                        </span>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center gap-1.5 min-w-0 flex-1">
                          <span className="text-sm select-none shrink-0">{habit.icon || '✨'}</span>
                          <span className="text-[12px] font-bold text-slate-700 truncate hover:text-slate-900 transition-colors">
                            {habit.title}
                          </span>
                        </div>
                        <span className="text-[11px] font-black shrink-0 text-right ml-1" style={{ color: theme.hex }}>
                          {habit.streak}
                        </span>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* 右侧可横向滚动的内容区域 */}
          <div className="flex flex-col grow">
            {/* 表头：日期 (HUD 风格) */}
            <div className="h-10 flex items-end mb-3">
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

            {/* 习惯列表打卡轨迹 */}
            <div className="flex flex-col gap-4">
              {habits.map((habit, index) => {
                const theme = THEME_COLORS[index % THEME_COLORS.length];
                const habitCreatedStr = toLocalDateStr(new Date(habit.createdAt));

                return (
                  <div
                    key={habit.id}
                    onClick={() => setSelectedHabit(habit)}
                    className="h-8 flex items-center relative group cursor-pointer"
                  >
                    {/* 细长的贯穿底线 */}
                    <div className="absolute left-0 right-4 top-1/2 -translate-y-1/2 h-[1px] bg-slate-100 z-0"></div>

                    {/* 悬停轨道背景 */}
                    <div className="absolute inset-0 bg-slate-50/60 opacity-0 group-hover:opacity-100 rounded-md transition-opacity"></div>

                    {/* 右侧连线与打卡点 */}
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
