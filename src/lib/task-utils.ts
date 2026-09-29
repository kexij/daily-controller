/**
 * 任务跨度与进度计算工具模块
 * 支持跨天短期任务、长期任务以及逾期逻辑判定
 */

export interface TaskSpanInfo {
  spanText: string | null;
  totalDays: number;
  isMultiDay: boolean;
  isLongTerm: boolean;
  dayIndex: number; // 1-based index (例如任务创建当天为第1天，次日为第2天)
  isWithinSpan: boolean; // 是否处于跨度周期内
  isOverdue: boolean; // 是否已经真正逾期（超过跨度且未完成）
  badgeText: string | null; // 例如 "第 2/3 天", "第 1/2 天", "长期 · 第 2 天"
}

/**
 * 清除备注中可能残留的 [跨度: X] 历史标记，保证详细备注只保留用户自己输入的内容
 */
export function cleanDescription(description?: string | null): string {
  if (!description) return '';
  return description
    .replace(/\s*\[跨度:\s*.*?\]\s*/g, '')
    .trim();
}

/**
 * 解析任务的跨度信息（优先取独立的 span 字段，向下兼容 description 中的 [跨度: X] 标记）
 */
export function parseSpanText(span?: string | null, description?: string | null): {
  spanText: string | null;
  totalDays: number;
  isMultiDay: boolean;
  isLongTerm: boolean;
} {
  let spanText: string | null = null;

  // 1. 若描述中含有历史遗留的 [跨度: X] 标记，优先识别出来以完成自动迁移
  if (description) {
    const match = description.match(/\[跨度:\s*(.*?)\]/);
    if (match) {
      spanText = match[1].trim();
    }
  }

  // 2. 否则取独立存储的 span 字段
  if (!spanText && span && span.trim()) {
    spanText = span.trim();
  }

  if (!spanText || spanText === '当天' || spanText === '1天') {
    return { spanText: spanText || '当天', totalDays: 1, isMultiDay: false, isLongTerm: false };
  }
  if (spanText === '长期') {
    return { spanText, totalDays: Infinity, isMultiDay: true, isLongTerm: true };
  }
  const weekMatch = spanText.match(/^(\d+)\s*周$/);
  if (weekMatch) {
    const weeks = parseInt(weekMatch[1], 10);
    const days = weeks * 7;
    return { spanText, totalDays: days, isMultiDay: true, isLongTerm: false };
  }
  const dayMatch = spanText.match(/^(\d+)\s*天$/);
  if (dayMatch) {
    const days = parseInt(dayMatch[1], 10);
    return { spanText, totalDays: days, isMultiDay: days > 1, isLongTerm: false };
  }
  return { spanText, totalDays: 1, isMultiDay: false, isLongTerm: false };
}

/**
 * 计算任务相对于基准日期（通常为今天）的跨度天数进度与逾期状态
 */
export function getTaskSpanInfo(
  task: { dueDate: Date | string; span?: string | null; description?: string | null; isCompleted?: boolean },
  referenceDate: Date = new Date()
): TaskSpanInfo {
  const { spanText, totalDays, isMultiDay, isLongTerm } = parseSpanText(task.span, task.description);

  const dueDate = new Date(task.dueDate);
  // 按照本地时间取日期的 00:00:00 进行对齐，计算精确的自然日差
  const startDay = new Date(dueDate.getFullYear(), dueDate.getMonth(), dueDate.getDate()).getTime();
  const refDay = new Date(referenceDate.getFullYear(), referenceDate.getMonth(), referenceDate.getDate()).getTime();

  const msPerDay = 24 * 60 * 60 * 1000;
  const diffDays = Math.round((refDay - startDay) / msPerDay);
  const dayIndex = diffDays + 1;

  const isWithinSpan = dayIndex >= 1 && (isLongTerm || dayIndex <= totalDays);
  const isOverdue = !task.isCompleted && !isLongTerm && dayIndex > totalDays;

  let badgeText: string | null = null;
  if (isMultiDay) {
    if (isLongTerm) {
      badgeText = dayIndex >= 1 ? `长期 · 第 ${dayIndex} 天` : '长期';
    } else if (isWithinSpan) {
      badgeText = `第 ${dayIndex}/${totalDays} 天`;
    } else if (isOverdue) {
      const overdueDays = dayIndex - totalDays;
      badgeText = `逾期 ${overdueDays} 天`;
    }
  }

  return {
    spanText,
    totalDays,
    isMultiDay,
    isLongTerm,
    dayIndex,
    isWithinSpan,
    isOverdue,
    badgeText,
  };
}
