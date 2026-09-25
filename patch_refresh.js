const fs = require('fs');
const path = require('path');

const addFabPath = path.join(__dirname, 'src/components/AddFAB.tsx');
let addFab = fs.readFileSync(addFabPath, 'utf8');

// We will import useRouter and call router.refresh()
if (!addFab.includes('useRouter')) {
  addFab = addFab.replace("import { Plus, X, CheckSquare, Sparkles } from 'lucide-react';", 
    "import { Plus, X, CheckSquare, Sparkles } from 'lucide-react';\nimport { useRouter } from 'next/navigation';");
}

if (!addFab.includes('const router = useRouter()')) {
  addFab = addFab.replace("const [isSubmitting, setIsSubmitting] = useState(false);", 
    "const [isSubmitting, setIsSubmitting] = useState(false);\n  const router = useRouter();");
}

// Add router.refresh() after closing modal
if (addFab.includes('setIsOpen(false);') && !addFab.includes('router.refresh()')) {
  addFab = addFab.replace(/setIsOpen\(false\);/, "setIsOpen(false);\n      router.refresh();");
}

fs.writeFileSync(addFabPath, addFab);
console.log('AddFAB patched for auto-refresh');
