const fs = require('fs');
let code = fs.readFileSync('src/components/HomeClient.tsx', 'utf8');
code = code.replace(
  "{user ? \你好，\\ : '你好，请登录'}",
  "{user ? \你好，\\ : <>你好，<span onClick={() => router.push('/login')} className=\"text-blue-600 hover:text-blue-700 cursor-pointer underline decoration-blue-200 underline-offset-4 transition-colors\">请登录</span></>}"
);
fs.writeFileSync('src/components/HomeClient.tsx', code);
