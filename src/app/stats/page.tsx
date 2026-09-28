import React from "react";
import { getStatsData, getHabitMatrixData, } from "@/app/actions";
import { Target, BookOpen } from "lucide-react";
import DailySummaryForm from "@/components/DailySummaryForm";
import StatsSidebar from "@/components/StatsSidebar";
import HabitMatrixView from "@/components/HabitMatrixView";

export const metadata = {
  title: "执行复盘 | Daily Controller",
  description: "数据见证你的每一次坚持"
};

export default async function StatsPage() {
  const { todayTasks, todayCompleted, summary } = await getStatsData();
      const { habits, logs } = await getHabitMatrixData(84);

  const completionRate = todayTasks === 0 ? 0 : Math.round((todayCompleted / todayTasks) * 100);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans pb-28 selection:bg-blue-100">
      <main className="max-w-md mx-auto p-6 pt-12 sm:pt-16">
        <StatsSidebar />

        {/* 1. 今日完成率仪表盘 */}
        <section className="mb-8 bg-white rounded-3xl p-6 shadow-sm border border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-1">今日完成率</h2>
            <div className="text-4xl font-black text-slate-800">{completionRate}%</div>
            <p className="text-xs font-semibold text-slate-400 mt-2">完成了 {todayCompleted} / {todayTasks} 项任务</p>
          </div>
          
          <div className="relative w-24 h-24 flex items-center justify-center">
            <svg className="w-full h-full transform -rotate-90">
              <circle cx="48" cy="48" r="40" stroke="currentColor" strokeWidth="12" fill="transparent" className="text-slate-100" />
              <circle 
                cx="48" cy="48" r="40" 
                stroke="currentColor" 
                strokeWidth="12" 
                fill="transparent" 
                strokeDasharray="251.2" 
                strokeDashoffset={251.2 - (251.2 * completionRate) / 100} 
                className="text-blue-500 transition-all duration-1000 ease-out" 
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <Target className="w-8 h-8 text-blue-500" />
            </div>
          </div>
        </section>



        {/* 3. 今日心得沉思文本域 */}
        <section className="mb-8">
          <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center">
            <BookOpen className="w-5 h-5 text-blue-500 mr-2" />
            今日心得
          </h2>
          <DailySummaryForm initialContent={summary?.content || ""} />
        </section>

        {/* 4. 习惯打卡全景矩阵图与 GitHub 式深度贡献日历 */}
        <HabitMatrixView habits={habits} logs={logs} />
      </main>
    </div>
  );
}
