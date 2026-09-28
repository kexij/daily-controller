const fs = require('fs');
let code = fs.readFileSync('src/components/HomeClient.tsx', 'utf8');

code = code.replace(
  /return <span className="ml-1.5 px-1.5 py-0.5 bg-blue-100 text-blue-600 rounded-md text-\[10px\] tracking-wide">\{spanText\}<\/span>;/g,
  'return <span className="ml-1.5 px-1.5 py-0.5 bg-blue-100 text-blue-600 rounded-md text-[10px] tracking-wide">短期</span>;'
);

code = code.replace(
  /return <span className="ml-1 px-1.5 py-0.5 bg-red-100 text-red-600 rounded-md text-\[10px\] tracking-wide">\{spanText\}<\/span>;/g,
  'return <span className="ml-1 px-1.5 py-0.5 bg-red-100 text-red-600 rounded-md text-[10px] tracking-wide">短期</span>;'
);

fs.writeFileSync('src/components/HomeClient.tsx', code);
