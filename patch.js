const fs = require('fs');
const path = require('path');

try {
  // 1. AddFAB.tsx
  const addFabPath = path.join(__dirname, 'src/components/AddFAB.tsx');
  let addFab = fs.readFileSync(addFabPath, 'utf8');
  addFab = addFab.replace(/async function handleSubmit[\s\S]*?setIsSubmitting\(false\);\n    setIsOpen\(false\);\n  }/, 
  `async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
      e.preventDefault();
      setIsSubmitting(true);
      try {
        const formData = new FormData(e.currentTarget);
        
        if (tab === 'task') {
          const dateStr = formData.get('date') as string;
          const timeStr = formData.get('time') as string;
          const dueDate = new Date(\`\${dateStr}T\${timeStr}:00\`);
          
          await createTask({
            title: formData.get('title') as string,
            description: formData.get('description') as string,
            dueDate
          });
          alert('任务创建成功！');
        } else {
          await createHabit({
            title: formData.get('title') as string,
            icon: (formData.get('icon') as string) || '✨'
          });
          alert('习惯创建成功！');
        }
        
        setIsOpen(false);
      } catch (error) {
        console.error(error);
        alert('创建失败，请重试');
      } finally {
        setIsSubmitting(false);
      }
    }`);
  fs.writeFileSync(addFabPath, addFab);

  // 2. actions.ts
  const actionsPath = path.join(__dirname, 'src/app/actions.ts');
  let actions = fs.readFileSync(actionsPath, 'utf8');
  if(!actions.includes('updateHabit')) {
    actions += `
  export async function updateHabit(habitId: string, data: { title: string; icon: string }) {
    await prisma.habit.update({ where: { id: habitId }, data });
    revalidatePath('/');
    revalidatePath('/stats');
    revalidatePath('/profile');
  }
  export async function deleteHabit(habitId: string) {
    await prisma.habitLog.deleteMany({ where: { habitId } });
    await prisma.habit.delete({ where: { id: habitId } });
    revalidatePath('/');
    revalidatePath('/stats');
    revalidatePath('/profile');
  }
  `;
    fs.writeFileSync(actionsPath, actions);
  }

  // 3. BottomNav.tsx
  const navPath = path.join(__dirname, 'src/components/BottomNav.tsx');
  let nav = fs.readFileSync(navPath, 'utf8');
  if(!nav.includes('/profile')) {
    nav = nav.replace('Home, BarChart2', 'Home, BarChart2, User');
    nav = nav.replace(/<\/div>\r?\n    <\/div>/, 
  `        <Link href="/profile" className={\`flex flex-col items-center p-2 transition-all \${pathname === '/profile' ? 'text-blue-600 scale-105' : 'text-slate-400 hover:text-slate-600'}\`}>
            <User className="w-6 h-6 mb-1" />
            <span className="text-[10px] font-bold">我的</span>
          </Link>
        </div>
      </div>`);
    fs.writeFileSync(navPath, nav);
  }
  console.log("Patch applied successfully");
} catch(e) {
  console.error("Error applying patch:", e);
}
