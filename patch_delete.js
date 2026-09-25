const fs = require('fs');
const path = require('path');

try {
  // 1. actions.ts
  const actionsPath = path.join(__dirname, 'src/app/actions.ts');
  let actions = fs.readFileSync(actionsPath, 'utf8');
  if(!actions.includes('deleteTask')) {
    actions += `
export async function deleteTask(taskId: string) {
  await prisma.task.delete({ where: { id: taskId } })
  revalidatePath('/')
  revalidatePath('/stats')
}
`;
    fs.writeFileSync(actionsPath, actions);
  }

  // 2. TaskListClient.tsx
  const listPath = path.join(__dirname, 'src/components/TaskListClient.tsx');
  let list = fs.readFileSync(listPath, 'utf8');
  
  if(!list.includes('deleteTask')) {
    list = list.replace("import { toggleTask, updateTaskDetails } from '@/app/actions';", "import { toggleTask, updateTaskDetails, deleteTask } from '@/app/actions';");
    
    // Insert handleDelete
    list = list.replace(/async function handleSave[\s\S]*?setSelectedTask\(null\);\n  }/, 
`$&

  async function handleDelete() {
    if (!confirm('确定要删除这个任务吗？')) return;
    setIsSubmitting(true);
    try {
      await deleteTask(selectedTask.id);
      setSelectedTask(null);
    } catch (error) {
      console.error(error);
      alert('删除失败，请重试');
    } finally {
      setIsSubmitting(false);
    }
  }`);

    // Insert Delete button
    list = list.replace(/<button type="submit" disabled=\{isSubmitting\}[\s\S]*?<\/button>/,
`$&
                <button 
                  type="button" 
                  disabled={isSubmitting} 
                  onClick={handleDelete}
                  className="w-full mt-3 bg-white text-red-500 border border-red-100 hover:bg-red-50 font-bold rounded-xl py-3.5 transition-all active:scale-[0.98] disabled:opacity-50"
                >
                  删除任务
                </button>`);
                
    fs.writeFileSync(listPath, list);
  }
  
  console.log("Delete Task feature patched successfully");
} catch(e) {
  console.error("Error patching delete task:", e);
}
