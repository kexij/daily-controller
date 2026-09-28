const fs = require('fs');
let code = fs.readFileSync('src/components/AddFAB.tsx', 'utf8');

if (!code.includes('const dateInputRef')) {
  code = code.replace(
    'const [showSpanDropdown, setShowSpanDropdown] = useState(false);',
    'const [showSpanDropdown, setShowSpanDropdown] = useState(false);\n  const dateInputRef = useRef<HTMLInputElement>(null);\n  const timeInputRef = useRef<HTMLInputElement>(null);'
  );
}

code = code.replace(/<button type="button" className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white border border-slate-200\/80 text-slate-700 text-\[12px\] font-semibold transition-all shadow-sm">/, '<button type="button" onClick={() => dateInputRef.current?.showPicker()} className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white border border-slate-200/80 text-slate-700 text-[12px] font-semibold transition-all shadow-sm">');

code = code.replace(/<input type="date" value=\{taskDate\} onChange=\{e => setTaskDate\(e.target.value\)\} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer \[\&::-webkit-calendar-picker-indicator\]:absolute \[\&::-webkit-calendar-picker-indicator\]:inset-0 \[\&::-webkit-calendar-picker-indicator\]:w-full \[\&::-webkit-calendar-picker-indicator\]:h-full \[\&::-webkit-calendar-picker-indicator\]:cursor-pointer \[\&::-webkit-calendar-picker-indicator\]:opacity-0" required \/>/, '<input ref={dateInputRef} type="date" value={taskDate} onChange={e => setTaskDate(e.target.value)} className="absolute w-0 h-0 opacity-0 pointer-events-none" required />');

code = code.replace(/<button type="button" className=\{`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border transition-all text-\[12px\] font-medium \$\{taskTime \? 'bg-blue-50 border-blue-200 text-blue-700 shadow-sm' : 'bg-white border-slate-200\/80 text-slate-500 shadow-sm hover:border-slate-300'\}`\}>/, '<button type="button" onClick={() => timeInputRef.current?.showPicker()} className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border transition-all text-[12px] font-medium ${taskTime ? \'bg-blue-50 border-blue-200 text-blue-700 shadow-sm\' : \'bg-white border-slate-200/80 text-slate-500 shadow-sm hover:border-slate-300\'}`}>');

code = code.replace(/<input type="time" value=\{taskTime\} onChange=\{e => setTaskTime\(e.target.value\)\} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer \[\&::-webkit-calendar-picker-indicator\]:absolute \[\&::-webkit-calendar-picker-indicator\]:inset-0 \[\&::-webkit-calendar-picker-indicator\]:w-full \[\&::-webkit-calendar-picker-indicator\]:h-full \[\&::-webkit-calendar-picker-indicator\]:cursor-pointer \[\&::-webkit-calendar-picker-indicator\]:opacity-0" \/>/, '<input ref={timeInputRef} type="time" value={taskTime} onChange={e => setTaskTime(e.target.value)} className="absolute w-0 h-0 opacity-0 pointer-events-none" />');

fs.writeFileSync('src/components/AddFAB.tsx', code);
