const fs = require('fs');
let code = fs.readFileSync('src/components/AddFAB.tsx', 'utf8');

// Insert the state variable
code = code.replace(
  /const \[taskSpan, setTaskSpan\] = useState\('当天'\);/,
  "const [taskSpan, setTaskSpan] = useState('当天');\n  const [showSpanDropdown, setShowSpanDropdown] = useState(false);"
);

// Replace the span dropdown HTML
const search = \{/* 任务跨度 (短期/中期/长期) */}
                    <div className="ml-auto relative">
                      <button type="button" className="flex items-center gap-1 px-3.5 py-1.5 rounded-full bg-blue-50/60 hover:bg-blue-50 border border-blue-100/50 text-blue-600 text-[12px] font-semibold transition-all shadow-sm">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
                        跨度: {taskSpan}
                        <svg className="w-3.5 h-3.5 text-blue-400 ml-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7"></path></svg>
                      </button>
                      <select name="span" value={taskSpan} onChange={e => setTaskSpan(e.target.value)} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:inset-0 [&::-webkit-calendar-picker-indicator]:w-full [&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-0">
                        <option value="当天">当天</option>
                        <option value="2天">2天</option>
                        <option value="3天">3天</option>
                        <option value="5天">5天</option>
                        <option value="1周">1周</option>
                        <option value="2周">2周</option>
                        <option value="长期">长期</option>
                      </select>
                    </div>\;

const replace = \{/* 任务跨度 (短期/中期/长期) */}
                    <div className="ml-auto relative">
                      <input type="hidden" name="span" value={taskSpan} />
                      <button 
                        type="button" 
                        onClick={() => setShowSpanDropdown(!showSpanDropdown)} 
                        className="flex items-center gap-1 px-3.5 py-1.5 rounded-full bg-blue-50/60 hover:bg-blue-50 border border-blue-100/50 text-blue-600 text-[12px] font-semibold transition-all shadow-sm"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
                        跨度: {taskSpan}
                        <svg className={\w-3.5 h-3.5 text-blue-400 ml-0.5 transition-transform \\} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7"></path></svg>
                      </button>
                      
                      {showSpanDropdown && (
                        <>
                          <div className="fixed inset-0 z-40" onClick={() => setShowSpanDropdown(false)}></div>
                          <div className="absolute right-0 bottom-full mb-2 w-28 bg-white rounded-2xl shadow-xl border border-slate-100 py-1.5 z-50 animate-in fade-in slide-in-from-bottom-2">
                            {['当天', '2天', '3天', '5天', '1周', '2周', '长期'].map(option => (
                              <button
                                key={option}
                                type="button"
                                onClick={() => { setTaskSpan(option); setShowSpanDropdown(false); }}
                                className={\w-full text-left px-4 py-2 text-[13px] font-bold transition-colors \\}
                              >
                                {option}
                              </button>
                            ))}
                          </div>
                        </>
                      )}
                    </div>\;

code = code.replace(search, replace);
fs.writeFileSync('src/components/AddFAB.tsx', code);
