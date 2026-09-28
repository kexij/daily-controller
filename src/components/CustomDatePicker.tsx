'use client'
import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function CustomDatePicker({ 
  value, 
  onChange, 
  onClose 
}: { 
  value: string; 
  onChange: (d: string) => void; 
  onClose: () => void;
}) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const [viewDate, setViewDate] = useState(() => value ? new Date(value) : new Date());
  
  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDay = new Date(year, month, 1).getDay();
  const startDay = firstDay === 0 ? 6 : firstDay - 1; // Mon = 0
  
  const days = [];
  const prevMonthDays = new Date(year, month, 0).getDate();
  for (let i = startDay - 1; i >= 0; i--) {
    days.push({ day: prevMonthDays - i, isCurrentMonth: false, date: new Date(year, month - 1, prevMonthDays - i) });
  }
  for (let i = 1; i <= daysInMonth; i++) {
    days.push({ day: i, isCurrentMonth: true, date: new Date(year, month, i) });
  }
  const remaining = 42 - days.length;
  for (let i = 1; i <= remaining; i++) {
    days.push({ day: i, isCurrentMonth: false, date: new Date(year, month + 1, i) });
  }

  const prevMonth = () => setViewDate(new Date(year, month - 1, 1));
  const nextMonth = () => setViewDate(new Date(year, month + 1, 1));

  const formatValue = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

  const handleSelect = (d: Date) => { onChange(formatValue(d)); onClose(); };
  const handleToday = () => { onChange(formatValue(new Date())); onClose(); };
  const handleClear = () => { onChange(''); onClose(); };

  const weekDays = ['一', '二', '三', '四', '五', '六', '日'];

  if (!mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm animate-in fade-in" onClick={onClose}></div>
      <div className="relative w-full max-w-[320px] bg-white rounded-3xl shadow-2xl border border-slate-100 p-5 animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between mb-4 px-1">
          <span className="font-bold text-slate-800 text-[16px]">{year}年 {month + 1}月</span>
          <div className="flex items-center gap-1">
            <button type="button" onClick={prevMonth} className="p-1.5 hover:bg-slate-100 rounded-full text-slate-600 transition-colors bg-slate-50">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button type="button" onClick={nextMonth} className="p-1.5 hover:bg-slate-100 rounded-full text-slate-600 transition-colors bg-slate-50">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
        
        <div className="grid grid-cols-7 gap-1 text-center mb-2">
          {weekDays.map(d => (
            <div key={d} className="text-[13px] font-bold text-slate-400 py-1">{d}</div>
          ))}
        </div>
        
        <div className="grid grid-cols-7 gap-y-1 gap-x-1">
          {days.map((d, i) => {
            const dateStr = formatValue(d.date);
            const isSelected = dateStr === value;
            const isToday = dateStr === formatValue(new Date());
            
            return (
              <button
                key={i}
                type="button"
                onClick={() => handleSelect(d.date)}
                className={`
                  h-9 w-full rounded-full flex items-center justify-center text-[14px] font-bold transition-all
                  ${!d.isCurrentMonth ? 'text-slate-300 font-medium' : 'text-slate-700 hover:bg-slate-100'}
                  ${isToday && !isSelected ? 'text-[#1D4ED8] bg-blue-50/80' : ''}
                  ${isSelected ? 'bg-[#1D4ED8] text-white hover:bg-blue-700 shadow-md shadow-blue-500/30 scale-105' : ''}
                `}
              >
                {d.day}
              </button>
            );
          })}
        </div>
        
        <div className="flex items-center justify-between mt-5 pt-4 border-t border-slate-100">
          <button type="button" onClick={handleClear} className="text-[14px] font-bold text-slate-400 hover:text-slate-600 px-3 py-2">清除</button>
          <button type="button" onClick={handleToday} className="text-[14px] font-bold text-white bg-[#1D4ED8] hover:bg-blue-700 px-5 py-2 rounded-full shadow-md shadow-blue-500/20 transition-all active:scale-95">今天</button>
        </div>
      </div>
    </div>,
    document.body
  );
}
