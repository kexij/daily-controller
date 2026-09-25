'use client'

import React, { useState } from 'react';
import { saveDailySummary } from '@/app/actions';

export default function DailySummaryForm({ initialContent }: { initialContent: string }) {
  const [content, setContent] = useState(initialContent);
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function handleSave() {
    setIsSaving(true);
    await saveDailySummary(content);
    setIsSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div className="bg-white p-5 rounded-3xl shadow-sm border border-slate-100 flex flex-col">
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="今天感觉怎么样？有哪些值得记录的进步或需要改进的地方？"
        className="w-full h-32 bg-slate-50 border-none rounded-xl p-4 text-sm text-slate-700 resize-none focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all mb-3"
      />
      <div className="flex justify-between items-center">
        <span className="text-xs font-semibold text-slate-400">
          {saved ? '✅ 已保存' : ''}
        </span>
        <button
          onClick={handleSave}
          disabled={isSaving}
          className={`px-6 py-2 rounded-xl text-sm font-bold text-white transition-all active:scale-95 ${isSaving ? 'bg-slate-300' : 'bg-slate-900 hover:bg-slate-800'}`}
        >
          {isSaving ? '保存中...' : '记录心得'}
        </button>
      </div>
    </div>
  );
}
