'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

import { getSession, createSession, clearSession } from '@/lib/session';
import bcrypt from 'bcryptjs';

export async function getUser() {
  const session = await getSession();
  if (!session?.userId) return null;
  return await prisma.user.findUnique({ where: { id: session.userId } });
}

export async function getDashboardData(overrideUserId?: string) {
  const user = await getUser()
  const targetId = overrideUserId || user?.id;
  if (!targetId) return { tasks: [], habits: [] }

  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)
  const todayEnd = new Date()
  todayEnd.setHours(23, 59, 59, 999)

  const tasks = await prisma.task.findMany({
    where: { 
      userId: targetId,
      OR: [
        { dueDate: { gte: todayStart, lte: todayEnd } },
        { dueDate: { lt: todayStart }, isCompleted: false }
      ]
    },
    orderBy: { dueDate: 'asc' }
  })

  const habits = await prisma.habit.findMany({
    where: { userId: targetId },
    include: {
      logs: {
        where: { date: { gte: todayStart, lte: todayEnd } }
      }
    }
  })

  return { tasks, habits }
}

export async function getStatsData() {
  const user = await getUser()
  if (!user) return { todayTasks: 0, todayCompleted: 0, habits: [], summary: null }

  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)
  const todayEnd = new Date()
  todayEnd.setHours(23, 59, 59, 999)

  const todayTasksList = await prisma.task.findMany({
    where: { 
      userId: user.id,
      dueDate: { gte: todayStart, lte: todayEnd }
    }
  })

  const habits = await prisma.habit.findMany({
    where: { userId: user.id },
    orderBy: { streak: 'desc' }
  })

  const summary = await prisma.dailySummary.findUnique({
    where: {
      userId_date: {
        userId: user.id,
        date: todayStart
      }
    }
  })

  return {
    todayTasks: todayTasksList.length,
    todayCompleted: todayTasksList.filter(t => t.isCompleted).length,
    habits,
    summary
  }
}

export async function saveDailySummary(content: string) {
  const user = await getUser()
  if (!user) return

  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)

  await prisma.dailySummary.upsert({
    where: {
      userId_date: {
        userId: user.id,
        date: todayStart
      }
    },
    update: { content },
    create: {
      content,
      date: todayStart,
      userId: user.id
    }
  })
  revalidatePath('/stats')
}

// ... other existing functions unchanged ...
export async function toggleTask(taskId: string, isCompleted: boolean) {
  await prisma.task.update({ where: { id: taskId }, data: { isCompleted } })
  revalidatePath('/')
  revalidatePath('/stats')
}
export async function updateTaskDetails(taskId: string, title: string, description: string) {
  await prisma.task.update({ where: { id: taskId }, data: { title, description } })
  revalidatePath('/')
}
export async function createTask(data: { title: string; description: string; dueDate: Date }) {
  const user = await getUser()
  if (!user) return { ok: false as const, error: '请先登录' }
  await prisma.task.create({ data: { ...data, userId: user.id } })
  revalidatePath('/')
  revalidatePath('/stats')
  return { ok: true as const }
}
export async function createHabit(data: { title: string; icon: string }) {
  const user = await getUser()
  if (!user) return { ok: false as const, error: '请先登录' }
  await prisma.habit.create({ data: { ...data, userId: user.id } })
  revalidatePath('/')
  revalidatePath('/stats')
  return { ok: true as const }
}
export async function toggleHabitCheckIn(habitId: string) {
  const user = await getUser()
  if (!user) return
  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)
  const existingLog = await prisma.habitLog.findFirst({ where: { habitId, date: { gte: todayStart } } })
  if (existingLog) {
    await prisma.habitLog.delete({ where: { id: existingLog.id } })
    const habit = await prisma.habit.findUnique({ where: { id: habitId } })
    if (habit && habit.streak > 0) {
      await prisma.habit.update({ where: { id: habitId }, data: { streak: { decrement: 1 } } })
    }
  } else {
    await prisma.habitLog.create({ data: { date: new Date(), habitId } })
    await prisma.habit.update({ where: { id: habitId }, data: { streak: { increment: 1 } } })
  }
  revalidatePath('/')
  revalidatePath('/stats')
}

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
  
export async function deleteTask(taskId: string) {
  await prisma.task.delete({ where: { id: taskId } })
  revalidatePath('/')
  revalidatePath('/stats')
}

export async function getWeeklySummary(year: number, week: number) {
  const user = await getUser();
  if (!user) return null;
  return await prisma.weeklySummary.findUnique({
    where: { userId_year_week: { userId: user.id, year, week } }
  });
}

export async function saveWeeklySummary(year: number, week: number, content: string) {
  const user = await getUser();
  if (!user) return;
  await prisma.weeklySummary.upsert({
    where: { userId_year_week: { userId: user.id, year, week } },
    update: { content },
    create: { userId: user.id, year, week, content }
  });
  revalidatePath('/stats');
}

export async function getOverdueTasks() {
  const user = await getUser();
  if (!user) return [];
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  return await prisma.task.findMany({
    where: { 
      userId: user.id, 
      isCompleted: false, 
      dueDate: { lt: todayStart } 
    },
    orderBy: { dueDate: 'asc' }
  });
}

export async function getDataCenterData() {
  const user = await getUser();
  if (!user) return { futureTasks: [], weeklySummaries: [], dailySummaries: [], completedTasks: [] };
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const futureTasks = await prisma.task.findMany({
    where: { userId: user.id, isCompleted: false, dueDate: { gte: todayStart } },
    orderBy: { dueDate: 'asc' }
  });
  const weeklySummaries = await prisma.weeklySummary.findMany({
    where: { userId: user.id },
    orderBy: [{ year: 'desc' }, { week: 'desc' }]
  });
  const dailySummaries = await prisma.dailySummary.findMany({
    where: { userId: user.id },
    orderBy: { date: 'desc' }
  });
  const completedTasks = await prisma.task.findMany({
    where: { userId: user.id, isCompleted: true },
    orderBy: { updatedAt: 'desc' }
  });
  return { futureTasks, weeklySummaries, dailySummaries, completedTasks };
}


export async function login(formData: FormData) {
  const username = formData.get('username') as string;
  const password = formData.get('password') as string;
  
  if (!username || !password) return { error: '请填写完整信息' };
  
  const user = await prisma.user.findUnique({ where: { username } });
  if (!user) return { error: '账号或密码错误' };
  
  const isValid = await bcrypt.compare(password, user.password);
  if (!isValid) return { error: '账号或密码错误' };
  
  await createSession(user.id);
  return { success: true };
}

export async function register(formData: FormData) {
  const username = formData.get('username') as string;
  const password = formData.get('password') as string;
  const name = formData.get('name') as string;
  
  if (!username || !password) return { error: '请填写完整信息' };
  
  const existing = await prisma.user.findUnique({ where: { username } });
  if (existing) return { error: '该账号已被注册' };
  
  const hashedPassword = await bcrypt.hash(password, 10);
  
  const user = await prisma.user.create({
    data: {
      username,
      password: hashedPassword,
      name: name || username
    }
  });
  
  await createSession(user.id);
  return { success: true };
}

export async function logout() {
  await clearSession();
}



// ==========================================
// 灵感速记 (Memo) & 习惯矩阵 (Habit Matrix) Actions
// ==========================================

export async function getMemos() {
  const user = await getUser();
  if (!user) return [];
  return await prisma.memo.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 100
  });
}

export async function getMemoCount() {
  const user = await getUser();
  if (!user) return 0;
  return await prisma.memo.count({
    where: { userId: user.id }
  });
}

export async function createMemo(data: { id?: string; content: string; tags: string[] }) {
  const user = await getUser();
  if (!user) return { ok: false as const, error: "请先登录" };
  const trimmed = data.content?.trim();
  if (!trimmed) return { ok: false as const, error: "内容不能为空" };
  if (trimmed.length > 1000) return { ok: false as const, error: "内容不能超过1000字" };

  const memoId = data.id || crypto.randomUUID();
  const tagsArr = Array.isArray(data.tags) ? data.tags : [];
  const category = tagsArr[0] === "灵感" ? "INSPIRATION" : "TRIVIA";

  const existing = await prisma.memo.findUnique({ where: { id: memoId } });
  if (existing) {
    if (existing.userId !== user.id) {
      return { ok: false as const, error: "无权操作他人记录" };
    }
    const updated = await prisma.memo.update({
      where: { id: memoId },
      data: {
        content: trimmed,
        tags: JSON.stringify(tagsArr),
        category
      }
    });
    revalidatePath("/memos");
    revalidatePath("/stats");
    return { ok: true as const, memo: updated };
  }

  const created = await prisma.memo.create({
    data: {
      id: memoId,
      content: trimmed,
      tags: JSON.stringify(tagsArr),
      category,
      userId: user.id
    }
  });
  revalidatePath("/memos");
  revalidatePath("/stats");
  return { ok: true as const, memo: created };
}

export async function deleteMemo(memoId: string) {
  const user = await getUser();
  if (!user) return { ok: false as const, error: "请先登录" };

  const res = await prisma.memo.deleteMany({
    where: { id: memoId, userId: user.id }
  });
  if (res.count === 0) {
    return { ok: false as const, error: "无权删除或记录不存在" };
  }
  revalidatePath("/memos");
  revalidatePath("/stats");
  return { ok: true as const };
}

export async function getHabitMatrixData(days = 84) {
  const user = await getUser();
  if (!user) return { habits: [], logs: [] };

  const habits = await prisma.habit.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "asc" }
  });

  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  startDate.setHours(0, 0, 0, 0);

  const logs = await prisma.habitLog.findMany({
    where: {
      habit: { userId: user.id },
      date: { gte: startDate }
    },
    select: {
      id: true,
      habitId: true,
      date: true,
      isCompleted: true
    }
  });

  return { habits, logs };
}


// ==========================================
// 持久化标签 (Persistent Tag) 核心 Actions
// ==========================================

export async function getTags() {
  const user = await getUser();
  if (!user) return [];
  let tags = await prisma.tag.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "asc" }
  });

  // 初次使用自动初始化 3 个默认标签
  if (tags.length === 0) {
    const defaultPresets = [
      { name: "灵感", color: "#A78BFA" },
      { name: "杂记", color: "#60A5FA" },
      { name: "备忘", color: "#FBBF24" }
    ];
    for (const p of defaultPresets) {
      await prisma.tag.upsert({
        where: { userId_name: { userId: user.id, name: p.name } },
        update: {},
        create: { name: p.name, color: p.color, userId: user.id }
      }).catch(() => {});
    }
    tags = await prisma.tag.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "asc" }
    });
  }
  return tags;
}

export async function createTag(name: string, color = "#A78BFA") {
  const user = await getUser();
  if (!user) return { ok: false as const, error: "请先登录" };
  const trimmed = name?.trim().replace(/^#+/, "");
  if (!trimmed) return { ok: false as const, error: "标签名不能为空" };
  if (trimmed.length > 20) return { ok: false as const, error: "标签名不能超过20个字符" };

  const existing = await prisma.tag.findUnique({
    where: { userId_name: { userId: user.id, name: trimmed } }
  });
  if (existing) {
    return { ok: true as const, tag: existing };
  }

  const tag = await prisma.tag.create({
    data: {
      name: trimmed,
      color: color || "#A78BFA",
      userId: user.id
    }
  });

  revalidatePath("/memos");
  revalidatePath("/stats");
  return { ok: true as const, tag };
}

export async function updateTag(tagId: string, name: string, color: string) {
  const user = await getUser();
  if (!user) return { ok: false as const, error: "请先登录" };
  const trimmed = name?.trim().replace(/^#+/, "");
  if (!trimmed) return { ok: false as const, error: "标签名不能为空" };
  if (trimmed.length > 20) return { ok: false as const, error: "标签名不能超过20个字符" };

  const existing = await prisma.tag.findUnique({ where: { id: tagId } });
  if (!existing || existing.userId !== user.id) {
    return { ok: false as const, error: "标签不存在或无权修改" };
  }

  const oldName = existing.name;
  if (oldName !== trimmed) {
    const conflict = await prisma.tag.findUnique({
      where: { userId_name: { userId: user.id, name: trimmed } }
    });
    if (conflict) {
      return { ok: false as const, error: "已存在名为 #" + trimmed + " 的标签" };
    }
  }

  const updatedTag = await prisma.tag.update({
    where: { id: tagId },
    data: { name: trimmed, color }
  });

  // 级联重命名：同步更新所有引用此标签的 Memo 记录
  if (oldName !== trimmed) {
    const userMemos = await prisma.memo.findMany({ where: { userId: user.id } });
    for (const m of userMemos) {
      try {
        const arr = JSON.parse(m.tags || "[]");
        if (Array.isArray(arr) && arr.includes(oldName)) {
          const nextArr = arr.map(t => (t === oldName ? trimmed : t));
          await prisma.memo.update({
            where: { id: m.id },
            data: { tags: JSON.stringify(nextArr) }
          });
        }
      } catch (err) {
        console.error("Cascade update memo error:", err);
      }
    }
  }

  revalidatePath("/memos");
  revalidatePath("/stats");
  return { ok: true as const, tag: updatedTag };
}

export async function deleteTag(tagId: string) {
  const user = await getUser();
  if (!user) return { ok: false as const, error: "请先登录" };

  const existing = await prisma.tag.findUnique({ where: { id: tagId } });
  if (!existing || existing.userId !== user.id) {
    return { ok: false as const, error: "标签不存在或无权删除" };
  }

  const tagName = existing.name;
  await prisma.tag.delete({ where: { id: tagId } });

  // 级联清理：从用户的所有 Memo 中移除该标签
  const userMemos = await prisma.memo.findMany({ where: { userId: user.id } });
  for (const m of userMemos) {
    try {
      const arr = JSON.parse(m.tags || "[]");
      if (Array.isArray(arr) && arr.includes(tagName)) {
        const nextArr = arr.filter(t => t !== tagName);
        await prisma.memo.update({
          where: { id: m.id },
          data: { tags: JSON.stringify(nextArr) }
        });
      }
    } catch (err) {
      console.error("Cascade delete memo tag error:", err);
    }
  }

  revalidatePath("/memos");
  revalidatePath("/stats");
  return { ok: true as const };
}


export async function getJournalData() {
  const user = await getUser();
  if (!user) return { weeklySummaries: [], dailySummaries: [] };
  const weeklySummaries = await prisma.weeklySummary.findMany({
    where: { userId: user.id },
    orderBy: [{ year: 'desc' }, { week: 'desc' }]
  });
  const dailySummaries = await prisma.dailySummary.findMany({
    where: { userId: user.id },
    orderBy: { date: 'desc' }
  });
  return { weeklySummaries, dailySummaries };
}


export async function updateProfile(name: string, avatar: string) {
  const user = await getUser();
  if (!user) throw new Error("未登录");
  await prisma.user.update({
    where: { id: user.id },
    data: { name, avatar } as any,
  });
  return { success: true };
}

export async function changePassword(oldPass: string, newPass: string) {
  const user = await getUser();
  if (!user) throw new Error("未登录");
  const dbUser = await prisma.user.findUnique({ where: { id: user.id } });
  if (!dbUser) return { ok: false, error: "用户不存在" };
  const isValid = await bcrypt.compare(oldPass, dbUser.password);
  if (!isValid) return { ok: false, error: "旧密码错误" };
  const hashedPassword = await bcrypt.hash(newPass, 10);
  await prisma.user.update({
    where: { id: user.id },
    data: { password: hashedPassword },
  });
  return { ok: true };
}

export async function deleteAccount() {
  const user = await getUser();
  if (!user) throw new Error("未登录");
  await prisma.user.delete({
    where: { id: user.id }
  });
  await clearSession();
  return { ok: true };
}




export async function getAllTasks() {
  const user = await getUser();
  if (!user) return [];
  const tasks = await prisma.task.findMany({
    where: { userId: user.id },
    orderBy: { dueDate: "asc" }
  });
  return tasks;
}


