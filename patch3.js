const fs = require('fs');
const path = require('path');

try {
  // 1. actions.ts - Add getWeeklySummary and saveWeeklySummary
  const actionsPath = path.join(__dirname, 'src/app/actions.ts');
  let actions = fs.readFileSync(actionsPath, 'utf8');
  if(!actions.includes('saveWeeklySummary')) {
    actions += `
export async function getWeeklySummary(year: number, week: number) {
  const user = await getUser();
  if (!user) return null;
  return await prisma.weeklySummary.findUnique({
    where: { userId_year_week: { userId: user.id, year, week } }
  });
}

export async function saveWeeklySummary(year: number, week: number, content: string) {
  const user = await getUser();
  if (!user) return;
  await prisma.weeklySummary.upsert({
    where: { userId_year_week: { userId: user.id, year, week } },
    update: { content },
    create: { userId: user.id, year, week, content }
  });
  revalidatePath('/stats');
}

export async function getOverdueTasks() {
  const user = await getUser();
  if (!user) return [];
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  return await prisma.task.findMany({
    where: { 
      userId: user.id, 
      isCompleted: false, 
      dueDate: { lt: todayStart } 
    },
    orderBy: { dueDate: 'asc' }
  });
}
`;
    fs.writeFileSync(actionsPath, actions);
  }

  // 2. Add link to overdue tasks in dashboard (page.tsx)
  const dashboardPath = path.join(__dirname, 'src/app/page.tsx');
  let dashboard = fs.readFileSync(dashboardPath, 'utf8');
  if(!dashboard.includes('/overdue')) {
    dashboard = dashboard.replace('import { Check } from \'lucide-react\';', 'import { Check, AlertCircle } from \'lucide-react\';\nimport Link from \'next/link\';');
    dashboard = dashboard.replace('<h2 className="text-xl font-bold text-slate-900">今日任务</h2>', 
    `<div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-slate-900">今日任务</h2>
              <Link href="/overdue" className="flex items-center text-xs text-red-500 bg-red-50 hover:bg-red-100 px-2 py-1 rounded-full transition-colors font-bold">
                <AlertCircle className="w-3 h-3 mr-1" /> 查看逾期
              </Link>
            </div>`);
    fs.writeFileSync(dashboardPath, dashboard);
  }

  // 3. Modify stats/page.tsx to include Weekly Summary
  const statsPath = path.join(__dirname, 'src/app/stats/page.tsx');
  let stats = fs.readFileSync(statsPath, 'utf8');
  if(!stats.includes('WeeklySummaryClient')) {
    stats = stats.replace('import DailySummaryForm from \'@/components/DailySummaryForm\';', 'import DailySummaryForm from \'@/components/DailySummaryForm\';\nimport WeeklySummaryClient from \'@/components/WeeklySummaryClient\';\nimport { getWeeklySummary } from \'@/app/actions\';');
    
    // Get ISO week
    stats = stats.replace('const completionRate', `
  const now = new Date();
  const year = now.getFullYear();
  const getWeekNumber = (d: Date) => {
    const date = new Date(d.getTime());
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() + 3 - (date.getDay() + 6) % 7);
    const week1 = new Date(date.getFullYear(), 0, 4);
    return 1 + Math.round(((date.getTime() - week1.getTime()) / 86400000 - 3 + (week1.getDay() + 6) % 7) / 7);
  };
  const week = getWeekNumber(now);
  const weeklySummary = await getWeeklySummary(year, week);

  const completionRate`);
    
    stats = stats.replace('</section>\n\n        {/* Habits Streaks */}', `</section>\n\n        {/* Weekly Summary */}\n        <section className="mb-8">\n          <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center">\n            <BookOpen className="w-5 h-5 text-indigo-500 mr-2" />\n            本周复盘 (第{week}周)\n          </h2>\n          <WeeklySummaryClient initialContent={weeklySummary?.content || ''} year={year} week={week} />\n        </section>\n\n        {/* Habits Streaks */}`);
    
    fs.writeFileSync(statsPath, stats);
  }

  console.log("Stats and actions patched successfully");
} catch(e) {
  console.error(e);
}
