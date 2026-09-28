import React from 'react';
import { getAllTasks } from '@/app/actions';
import TasksClient from '@/components/TasksClient';

export const metadata = {
  title: '任务中心 | Daily Controller'
};

export default async function TasksPage() {
  const tasks = await getAllTasks();
  
  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans selection:bg-blue-100">
      <main className="max-w-md mx-auto p-5 pt-10 pb-24">
        <TasksClient initialTasks={tasks} />
      </main>
    </div>
  );
}
