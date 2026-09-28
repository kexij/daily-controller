"use client";
import React, { useState, useMemo } from 'react';
import { Search, ChevronDown, ChevronRight, Plus, Book, Calendar, Eye, EyeOff } from 'lucide-react';
import WeeklySummaryClient from './WeeklySummaryClient';
import { saveDailySummary } from '@/app/actions';

export default function JournalClient({ data }: { data: { weeklySummaries: any[], dailySummaries: any[] } }) {
  const [tab, setTab] = useState<'daily' | 'weekly'>('daily');
  const [searchQuery, setSearchQuery] = useState('');
  const [allExpanded, setAllExpanded] = useState(false);
  const [expandedIds, setExpandedIds] = useState<Record<string, boolean>>({});
  const [isCreatingWeekly, setIsCreatingWeekly] = useState(false);

  const toggleExpand = (id: string) => {
    setExpandedIds(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const toggleAll = () => {
    const nextState = !allExpanded;
    setAllExpanded(nextState);
    const newExpanded: Record<string, boolean> = {};
    const items = tab === 'daily' ? filteredDaily : filteredWeekly;
    items.forEach(item => {
      newExpanded[item.id || item.date || `${item.year}-${item.week}`] = nextState;
    });
    setExpandedIds(newExpanded);
  };

  const filteredDaily = useMemo(() => {
    if (!searchQuery) return data.dailySummaries;
    const lower = searchQuery.toLowerCase();
    return data.dailySummaries.filter(d => 
      (d.content && d.content.toLowerCase().includes(lower)) || 
      (new Date(d.date).toLocaleDateString().includes(lower))
    );
  }, [data.dailySummaries, searchQuery]);

  const filteredWeekly = useMemo(() => {
    if (!searchQuery) return data.weeklySummaries;
    const lower = searchQuery.toLowerCase();
    return data.weeklySummaries.filter(w => 
      (w.content && w.content.toLowerCase().includes(lower)) || 
      (w.year.toString().includes(lower)) || 
      (w.week.toString().includes(lower))
    );
  }, [data.weeklySummaries, searchQuery]);

  const currentYear = new Date().getFullYear();
  // Simple week calc for the 'Create' button default
  const getWeekNumber = (d: Date) => {
    const date = new Date(d.getTime());
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() + 3 - (date.getDay() + 6) % 7);
    const week1 = new Date(date.getFullYear(), 0, 4);
    return 1 + Math.round(((date.getTime() - week1.getTime()) / 86400000 - 3 + (week1.getDay() + 6) % 7) / 7);
  };
  const currentWeek = getWeekNumber(new Date());

  return (
    <div>
      <div className="flex justify-between items-center mb-5">
        <div className="flex bg-slate-100/80 p-1 rounded-full w-[160px]">
          <button onClick={() => setTab('daily')} className={`flex-1 py-1.5 text-[13px] font-bold rounded-full transition-all ${tab === 'daily' ? 'bg-white shadow-[0_2px_8px_rgba(0,0,0,0.04)] text-slate-800' : 'text-slate-500 hover:text-slate-700'}`}>日记</button>
          <button onClick={() => setTab('weekly')} className={`flex-1 py-1.5 text-[13px] font-bold rounded-full transition-all ${tab === 'weekly' ? 'bg-white shadow-[0_2px_8px_rgba(0,0,0,0.04)] text-slate-800' : 'text-slate-500 hover:text-slate-700'}`}>周记</button>
        </div>
        
        <button onClick={toggleAll} className="text-[12px] font-bold text-slate-400 hover:text-slate-600 flex items-center gap-1.5 transition-colors px-2 active:scale-95">
          {allExpanded ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
          {allExpanded ? '收起详情' : '展开详情'}
        </button>
      </div>

      <div className="flex items-center gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
          <input 
            type="text" 
            placeholder="搜索关键词..." 
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full bg-white border border-slate-100/80 rounded-full pl-10 pr-4 py-3 text-[13px] font-medium focus:outline-none focus:border-blue-200 focus:ring-4 focus:ring-blue-50 transition-all shadow-[0_4px_16px_-4px_rgba(0,0,0,0.04)]"
          />
        </div>
        {tab === 'weekly' && (
          <button onClick={() => setIsCreatingWeekly(!isCreatingWeekly)} className="w-[44px] h-[44px] flex items-center justify-center bg-slate-900 text-white rounded-full shadow-md shadow-slate-900/20 hover:bg-slate-800 transition-colors shrink-0 active:scale-95">
            <Plus className="w-5 h-5" />
          </button>
        )}
      </div>

      {tab === 'weekly' && isCreatingWeekly && (
        <div className="mb-6 bg-white p-4 rounded-2xl border border-rose-100 shadow-sm animate-in slide-in-from-top-2">
           <h3 className="font-bold text-slate-800 mb-3 flex items-center gap-2"><Book className="w-4 h-4 text-rose-500"/> 新增周记 ({currentYear}年 第{currentWeek}周)</h3>
           <WeeklySummaryClient initialContent="" year={currentYear} week={currentWeek} />
        </div>
      )}

      <div className="space-y-3">
        {tab === 'daily' && filteredDaily.length === 0 && <p className="text-center text-slate-400 py-10">暂无日记记录</p>}
        {tab === 'daily' && filteredDaily.map(item => {
          const id = item.id || item.date;
          const isExp = expandedIds[id] || false;
          const d = new Date(item.date);
          const dateStr = `${d.getFullYear()}/${String(d.getMonth()+1).padStart(2,'0')}/${String(d.getDate()).padStart(2,'0')}`;
          return (
            <div key={id} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
              <button onClick={() => toggleExpand(id)} className="w-full flex items-center justify-between p-4 bg-slate-50/30 hover:bg-slate-50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-500 flex items-center justify-center"><Calendar className="w-4 h-4"/></div>
                  <span className="font-bold text-slate-800">{dateStr}</span>
                </div>
                {isExp ? <ChevronDown className="w-5 h-5 text-slate-400" /> : <ChevronRight className="w-5 h-5 text-slate-400" />}
              </button>
              {isExp && (
                <div className="p-4 border-t border-slate-100 bg-white">
                  <p className="text-sm text-slate-600 whitespace-pre-wrap leading-relaxed">{item.content}</p>
                </div>
              )}
            </div>
          );
        })}

        {tab === 'weekly' && filteredWeekly.length === 0 && <p className="text-center text-slate-400 py-10">暂无周记记录</p>}
        {tab === 'weekly' && filteredWeekly.map(item => {
          const id = `${item.year}-${item.week}`;
          const isExp = expandedIds[id] || false;
          return (
            <div key={id} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
              <button onClick={() => toggleExpand(id)} className="w-full flex items-center justify-between p-4 bg-slate-50/30 hover:bg-slate-50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-rose-50 text-rose-500 flex items-center justify-center"><Book className="w-4 h-4"/></div>
                  <span className="font-bold text-slate-800">{item.year}年 第{item.week}周</span>
                </div>
                {isExp ? <ChevronDown className="w-5 h-5 text-slate-400" /> : <ChevronRight className="w-5 h-5 text-slate-400" />}
              </button>
              {isExp && (
                <div className="p-4 border-t border-slate-100 bg-white">
                  <WeeklySummaryClient initialContent={item.content || ''} year={item.year} week={item.week} />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}


