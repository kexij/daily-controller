'use client'

import { useEffect, useRef } from 'react';
import { getDashboardData } from '@/app/actions';

export default function ReminderTracker() {
  const notifiedTasks = useRef<Set<string>>(new Set());

  useEffect(() => {
    // 仅在支持 Notification 且不在 iframe/无头环境下运行
    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission !== 'granted' && Notification.permission !== 'denied') {
        Notification.requestPermission();
      }

      const checkTasks = async () => {
        if (Notification.permission !== 'granted') return;

        try {
          const { tasks } = await getDashboardData();
          const now = new Date();

          tasks.forEach(task => {
            if (task.isCompleted) return;

            const dueDate = new Date(task.dueDate);
            const timeDiff = dueDate.getTime() - now.getTime();
            const minutesLeft = timeDiff / (1000 * 60);

            // 如果任务在未来 15 分钟内到期，或者已经逾期不到 1 小时，且未提醒过
            if (minutesLeft <= 15 && minutesLeft >= -60 && !notifiedTasks.current.has(task.id)) {
              new Notification('任务提醒 ⏰', {
                body: `${task.title} ${minutesLeft < 0 ? '已逾期！' : '即将在15分钟内到期！'}`,
                icon: '/favicon.ico'
              });
              notifiedTasks.current.add(task.id);
            }
          });
        } catch (e) {
          console.error("Failed to fetch tasks for reminder", e);
        }
      };

      // 初始检查一次
      checkTasks();
      // 每分钟轮询一次
      const interval = setInterval(checkTasks, 60000);
      return () => clearInterval(interval);
    }
  }, []);

  return null;
}
