const fs = require('fs');
let code = fs.readFileSync('src/components/AddFAB.tsx', 'utf8');
const search = 'className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"';
const replace = 'className="absolute inset-0 w-full h-full opacity-0 cursor-pointer [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:inset-0 [&::-webkit-calendar-picker-indicator]:w-full [&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-0"';
code = code.split(search).join(replace);
fs.writeFileSync('src/components/AddFAB.tsx', code);
