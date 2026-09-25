"use client";

import React, { useState } from 'react';
import { saveWeeklySummary } from '@/app/actions';

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
    } catch (e) {
      console.error(e);
      alert('保存周复盘失败');
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
      <div className="flex justify-end mt-3">
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
