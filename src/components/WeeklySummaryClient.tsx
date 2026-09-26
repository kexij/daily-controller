"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { saveWeeklySummary } from '@/app/actions';
import { toast } from '@/components/Feedback';

export default function WeeklySummaryClient({ initialContent, year, week }: { initialContent: string, year: number, week: number }) {
  const [content, setContent] = useState(initialContent);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saved'>('idle');

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await saveWeeklySummary(year, week, content);
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2000);
      toast.success('周复盘已保存');
    } catch (e) {
      console.error(e);
      toast.error('保存失败，请重试');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4 relative">
      <textarea 
        value={content}
        onChange={e => setContent(e.target.value)}
        placeholder="这周整体感觉如何？有哪些需要调整的习惯？" 
        className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-sm font-medium text-slate-700 h-32 resize-none focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:bg-white transition-all"
      />
      <div className="flex justify-end items-center gap-4 mt-3">
        <Link href={`/data-center/week/${year}/${week}`} className="text-xs font-semibold text-slate-400 hover:text-slate-600 transition-colors underline underline-offset-4 decoration-slate-200 hover:decoration-slate-400">
          查看详情记录
        </Link>
        <button 
          onClick={handleSave}
          disabled={isSaving}
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-5 rounded-lg text-sm transition-all active:scale-95 disabled:opacity-50"
        >
          {isSaving ? '保存中...' : saveStatus === 'saved' ? '已保存！' : '保存周复盘'}
        </button>
      </div>
    </div>
  );
}
