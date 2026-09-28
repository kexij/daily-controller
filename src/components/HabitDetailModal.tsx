
"use client";

import React, { useMemo } from "react";
import { ChevronLeft, Flame, Quote } from "lucide-react";

interface HabitDetailModalProps {
  habit: {
    id: string;
    title: string;
    icon: string | null;
    streak: number;
    createdAt: string | Date;
  };
  logs: Array<{
    date: string | Date;
    isCompleted: boolean;
  }>;
  onClose: () => void;
}

function toLocalDateStr(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export default function HabitDetailModal({ habit, logs, onClose }: HabitDetailModalProps) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStr = toLocalDateStr(today);

  const habitCreatedDate = new Date(habit.createdAt);
  habitCreatedDate.setHours(0, 0, 0, 0);
  const habitCreatedStr = toLocalDateStr(habitCreatedDate);

  const completedDateSet = new Set<string>();
  logs.forEach(l => {
    if (l.isCompleted) {
      completedDateSet.add(toLocalDateStr(new Date(l.date)));
    }
  });

  // Stats calculation
  let totalLogs = completedDateSet.size;
  let activeDays = 0;
  
  const daysDiff = Math.floor((today.getTime() - habitCreatedDate.getTime()) / (1000 * 3600 * 24)) + 1;
  activeDays = Math.max(daysDiff, 1);
  const completionRate = Math.round((totalLogs / activeDays) * 100);

  // Generate WeChat Read style calendar data (last 3 months)
  const monthsData = useMemo(() => {
    const data = [];
    for (let i = 0; i < 4; i++) {
      const targetDate = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const year = targetDate.getFullYear();
      const month = targetDate.getMonth(); 
      const daysInMonth = new Date(year, month + 1, 0).getDate();
      
      let startDayOfWeek = targetDate.getDay();
      if (startDayOfWeek === 0) startDayOfWeek = 7; // Make Monday=1, Sunday=7

      let monthTotal = 0;
      const days = [];
      
      for (let d = 1; d <= daysInMonth; d++) {
        const cellDate = new Date(year, month, d);
        const cellDateStr = toLocalDateStr(cellDate);
        
        let status: "completed" | "missed" | "future" | "na" = "missed";
        if (cellDateStr > todayStr) {
          status = "future";
        } else if (cellDateStr < habitCreatedStr) {
          status = "na";
        } else if (completedDateSet.has(cellDateStr)) {
          status = "completed";
          monthTotal++;
        }
        
        days.push({ day: d, status });
      }

      const monthStr = `${year}-${String(month + 1).padStart(2, '0')}`;
      const createdMonthStr = `${habitCreatedDate.getFullYear()}-${String(habitCreatedDate.getMonth() + 1).padStart(2, '0')}`;
      
      if (monthStr >= createdMonthStr || i === 0) {
        data.push({
          title: `${month + 1}月`,
          year,
          daysInMonth,
          startDayOfWeek,
          days,
          monthTotal
        });
      }
    }
    return data;
  }, [todayStr, habitCreatedStr, completedDateSet, today]);

  const weekNames = ['一', '二', '三', '四', '五', '六', '日'];

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-[480px] h-[88vh] sm:h-[80vh] rounded-t-[32px] sm:rounded-[32px] shadow-2xl overflow-hidden flex flex-col animate-in slide-in-from-bottom-10 sm:zoom-in-95 duration-300">
        
        {/* 顶部轻盈导航 */}
        <div className="px-6 pt-6 pb-4 flex items-center justify-between sticky top-0 bg-white/90 backdrop-blur-md z-20 border-b border-slate-50">
          <button onClick={onClose} className="flex items-center text-slate-800 font-bold text-[16px] tracking-wide hover:text-blue-600 transition-colors">
            <ChevronLeft className="w-5 h-5 mr-1 text-slate-400" />
            <span className="bg-blue-50/50 w-7 h-7 rounded-xl flex items-center justify-center mr-2.5 shadow-sm text-sm border border-blue-100/50">
              {habit.icon || "✨"}
            </span>
            {habit.title}
          </button>
        </div>

        <div className="flex flex-col flex-1 overflow-y-auto no-scrollbar pb-16">
          
          {/* 轻盈数据面板 */}
          <div className="px-8 pt-6 pb-2">
            <div className="flex justify-between items-end">
              
              <div className="flex flex-col">
                <div className="flex items-center gap-1.5 text-orange-500 mb-1">
                  <Flame className="w-4 h-4" />
                  <span className="text-[12px] font-black uppercase tracking-widest opacity-90">当前连胜</span>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-[48px] font-black text-slate-800 leading-none tracking-tighter">{habit.streak}</span>
                  <span className="text-[14px] font-bold text-slate-400">天</span>
                </div>
              </div>
              
              <div className="flex gap-6 pb-1.5">
                <div className="flex flex-col items-end">
                  <span className="text-[11px] font-bold text-slate-400 mb-1.5">达成率</span>
                  <span className="text-[22px] font-black text-slate-700 leading-none tracking-tight">{completionRate}<span className="text-[12px] font-bold text-slate-400 ml-0.5">%</span></span>
                </div>
                <div className="flex flex-col items-end">
                  <span className="text-[11px] font-bold text-slate-400 mb-1.5">累计</span>
                  <span className="text-[22px] font-black text-slate-700 leading-none tracking-tight">{totalLogs}<span className="text-[12px] font-bold text-slate-400 ml-0.5">次</span></span>
                </div>
              </div>

            </div>

            {/* 金句引言：极简优雅的治愈系排版 */}
            <div className="mt-8 flex items-start gap-2.5 bg-blue-50/40 px-5 py-3.5 rounded-[16px] border border-blue-100/30">
              <Quote className="w-4 h-4 text-blue-300 shrink-0 mt-0.5 rotate-180" />
              <span className="text-[13px] text-blue-600/80 font-bold tracking-widest leading-relaxed">
                最顶级的自律，是中断后还能继续
              </span>
            </div>
          </div>

          <div className="mx-8 my-6 border-t border-slate-100/80"></div>

          {/* 微信读书轻盈版日历流 */}
          <div className="px-8 flex flex-col gap-10">
            {monthsData.map((month, mIdx) => (
              <div key={mIdx} className="relative z-0">
                <div className="mb-5 flex items-baseline gap-3">
                  <h2 className="text-[20px] font-black text-slate-800 tracking-tight">{month.title}</h2>
                  <span className="text-[13px] text-slate-400 font-bold tracking-wide">
                    打卡 <span className="text-blue-500 font-black">{month.monthTotal}</span> 天
                  </span>
                </div>

                <div className="w-full">
                  {/* 周标题 */}
                  <div className="grid grid-cols-7 mb-4 place-items-center">
                    {weekNames.map(w => (
                      <div key={w} className="text-[11px] text-slate-300 font-bold">{w}</div>
                    ))}
                  </div>

                  {/* 日期网格 */}
                  <div className="grid grid-cols-7 gap-y-4 gap-x-2 place-items-center">
                    {Array.from({ length: month.startDayOfWeek - 1 }).map((_, i) => (
                      <div key={`empty-${i}`} />
                    ))}
                    
                    {month.days.map(day => {
                      let bgColor = "bg-transparent";
                      let textColor = "text-slate-300 font-medium";
                      
                      if (day.status === "completed") {
                        bgColor = "bg-blue-500 shadow-md shadow-blue-500/20";
                        textColor = "text-white font-bold";
                      } else if (day.status === "missed") {
                        bgColor = "bg-slate-50 border border-slate-100";
                        textColor = "text-slate-400 font-bold";
                      } else if (day.status === "na") {
                        textColor = "text-slate-200";
                      }

                      return (
                        <div key={day.day} className="flex justify-center w-full">
                          <div className={`w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center text-[12px] transition-transform ${bgColor} ${textColor}`}>
                            {day.day}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            ))}
          </div>

        </div>
      </div>
    </div>
  );
}
