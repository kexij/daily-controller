import React from 'react';
import { getJournalData } from '@/app/actions';
import JournalClient from '@/components/JournalClient';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';

export default async function JournalPage() {
  const data = await getJournalData();
  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans pb-24">
      <main className="max-w-md mx-auto p-6 pt-12 sm:pt-16">
        <header className="mb-6">
          <Link href="/stats" className="inline-flex items-center text-sm font-bold text-slate-500 hover:text-slate-800 mb-4 transition-colors">
            <ChevronLeft className="w-4 h-4 mr-1" /> 返回复盘
          </Link>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 text-rose-600">日志栏</h1>
          <p className="text-slate-500 mt-1.5 text-sm font-medium">所有的沉淀，终会发光 ✨</p>
        </header>
        <JournalClient data={data} />
      </main>
    </div>
  );
}