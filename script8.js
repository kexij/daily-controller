const fs = require('fs');
let code = fs.readFileSync('src/components/HomeClient.tsx', 'utf8');

const regexPending = /<div className="flex items-center gap-1 text-xs font-bold text-blue-500 mt-1.5">[\s\S]*?<\/div>/g;

code = code.replace(regexPending, (match) => {
  if (match.includes("text-slate-400")) return match; // skip completed
  return match.replace(
    /<\/div>$/,
    `  {(() => {
                          const spanMatch = task.description?.match(/\\[跨度:\\s*(.*?)\\]/);
                          const spanText = spanMatch ? spanMatch[1] : null;
                          if (spanText && spanText !== '当天') {
                            return <span className="ml-1.5 px-1.5 py-0.5 bg-blue-100 text-blue-600 rounded-md text-[10px] tracking-wide">{spanText}</span>;
                          }
                          return null;
                        })()}
                      </div>`
  );
});

const regexOverdue = /<div className="flex items-center gap-1 text-xs font-bold text-red-500 mt-1.5 bg-red-50 w-fit px-1.5 py-0.5 rounded-md">[\s\S]*?逾期未完成\s*<\/div>/g;

code = code.replace(regexOverdue, (match) => {
  return match.replace(
    /<\/div>$/,
    `  {(() => {
                          const spanMatch = task.description?.match(/\\[跨度:\\s*(.*?)\\]/);
                          const spanText = spanMatch ? spanMatch[1] : null;
                          if (spanText && spanText !== '当天') {
                            return <span className="ml-1 px-1.5 py-0.5 bg-red-100 text-red-600 rounded-md text-[10px] tracking-wide">{spanText}</span>;
                          }
                          return null;
                        })()}
                      </div>`
  );
});

fs.writeFileSync('src/components/HomeClient.tsx', code);
