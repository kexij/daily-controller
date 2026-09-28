'use client'
import React, { useRef, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

export default function CustomTimePicker({
  value,
  onChange,
  onClose
}: {
  value: string;
  onChange: (t: string) => void;
  onClose: () => void;
}) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const currentHour = value ? value.split(':')[0] : '12';
  const currentMinute = value ? value.split(':')[1] : '00';
  
  const hours = Array.from({length: 24}, (_, i) => String(i).padStart(2, '0'));
  const minutes = Array.from({length: 60}, (_, i) => String(i).padStart(2, '0'));
  
  const hourRef = useRef<HTMLDivElement>(null);
  const minRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (hourRef.current) {
      const selectedHour = hourRef.current.querySelector('.selected-hour');
      if (selectedHour) selectedHour.scrollIntoView({ block: 'center' });
    }
    if (minRef.current) {
      const selectedMin = minRef.current.querySelector('.selected-min');
      if (selectedMin) selectedMin.scrollIntoView({ block: 'center' });
    }
  }, [mounted]);
  
  if (!mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm animate-in fade-in" onClick={onClose}></div>
      <div className="relative w-full max-w-[280px] bg-white rounded-3xl shadow-2xl border border-slate-100 p-5 animate-in zoom-in-95 duration-200">
        
        <div className="flex justify-between font-bold text-slate-800 mb-4 px-10 text-[15px]">
          <span>时</span>
          <span>分</span>
        </div>
        
        <div className="flex gap-3 h-52 px-2 relative">
          <div className="absolute top-1/2 -translate-y-1/2 left-2 right-2 h-10 bg-blue-50/70 rounded-xl pointer-events-none -z-10"></div>
          
          <div ref={hourRef} className="flex-1 overflow-y-auto scrollbar-hide flex flex-col gap-1 pr-1 border-r border-slate-100 pb-24 pt-24 snap-y">
            {hours.map(h => (
              <button
                key={h}
                type="button"
                onClick={() => onChange(`${h}:${currentMinute}`)}
                className={`h-10 shrink-0 snap-center px-2 text-center rounded-xl text-[16px] font-bold transition-all ${h === currentHour ? 'text-[#1D4ED8] selected-hour scale-110' : 'text-slate-400 hover:bg-slate-50'}`}
              >
                {h}
              </button>
            ))}
          </div>
          <div ref={minRef} className="flex-1 overflow-y-auto scrollbar-hide flex flex-col gap-1 pl-1 pb-24 pt-24 snap-y">
            {minutes.map(m => (
              <button
                key={m}
                type="button"
                onClick={() => onChange(`${currentHour}:${m}`)}
                className={`h-10 shrink-0 snap-center px-2 text-center rounded-xl text-[16px] font-bold transition-all ${m === currentMinute ? 'text-[#1D4ED8] selected-min scale-110' : 'text-slate-400 hover:bg-slate-50'}`}
              >
                {m}
              </button>
            ))}
          </div>
        </div>
        
        <div className="flex justify-between items-center mt-5 pt-4 border-t border-slate-100">
          <button type="button" onClick={() => { onChange(''); onClose(); }} className="px-3 py-2 text-slate-400 hover:text-slate-600 text-[14px] font-bold transition-colors">
            清除
          </button>
          <button type="button" onClick={onClose} className="px-6 py-2 bg-[#1D4ED8] hover:bg-blue-700 text-white text-[14px] font-bold rounded-full transition-colors shadow-md shadow-blue-500/25 active:scale-95">
            确定
          </button>
        </div>
        
        <style dangerouslySetInnerHTML={{__html: `
          .scrollbar-hide::-webkit-scrollbar { display: none; }
          .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
        `}} />
      </div>
    </div>,
    document.body
  );
}
