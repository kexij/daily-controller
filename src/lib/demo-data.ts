/**
 * 固定演示数据集模版（Seed Template Data）
 * 永远固定不变，仅用于初始化访客沙盒，任何访客的操作都不会污染此模版。
 */

export function getInitialDemoData(guestUserId: string) {
  const now = new Date();
  
  // 今日基准时间
  const todayMorning = new Date(now);
  todayMorning.setHours(9, 30, 0, 0);

  const todayNoon = new Date(now);
  todayNoon.setHours(12, 0, 0, 0);

  const yesterdayMorning = new Date(now);
  yesterdayMorning.setDate(yesterdayMorning.getDate() - 1);
  yesterdayMorning.setHours(10, 0, 0, 0);

  const twoDaysAgo = new Date(now);
  twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
  twoDaysAgo.setHours(18, 0, 0, 0);

  const todayAfternoon = new Date(now);
  todayAfternoon.setHours(17, 30, 0, 0);

  const todayNight = new Date(now);
  todayNight.setHours(22, 0, 0, 0);

  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(18, 0, 0, 0);

  // 1. 初始固定任务
  const tasks = [
    {
      title: '晨间项目站会与技术拆解',
      dueDate: todayMorning,
      priority: 1,
      isCompleted: true,
      description: '探讨核心架构方案，梳理访客沙盒隔离机制',
      span: '当天',
      userId: guestUserId,
    },
    {
      title: '重构数据同步与离线缓存协议',
      dueDate: yesterdayMorning,
      priority: 1,
      isCompleted: false,
      description: '设计多端双向同步协议与离线冲突解决机制',
      span: '3天',
      userId: guestUserId,
    },
    {
      title: '阅读《原子习惯》第三章并做笔记',
      dueDate: todayAfternoon,
      priority: 1,
      isCompleted: false,
      description: '重点在于把每日阻力降到极低，维持不断连胜心流',
      span: '当天',
      userId: guestUserId,
    },
    {
      title: '整理技术演进报告与架构总结',
      dueDate: todayNight,
      priority: 1,
      isCompleted: false,
      description: '汇总 Q3 重点功能点与下阶段规划',
      span: '2天',
      userId: guestUserId,
    },
    {
      title: '提交月度工时与报销单据',
      dueDate: twoDaysAgo,
      priority: 1,
      isCompleted: false,
      description: '按财务要求核对电子发票与打车记录',
      span: '当天',
      userId: guestUserId,
    },
    {
      title: '预约周末车辆常规保养与检修',
      dueDate: tomorrow,
      priority: 1,
      isCompleted: false,
      description: '提前在客户端领取保养券',
      span: '当天',
      userId: guestUserId,
    },
  ];

  // 2. 初始固定习惯
  const habitDefinitions = [
    {
      title: '早起晨跑 3km',
      icon: '🏃‍♂️',
      streak: 5,
    },
    {
      title: '每日阅读 30分钟',
      icon: '📚',
      streak: 12,
    },
    {
      title: '正念冥想',
      icon: '🧘',
      streak: 4,
    },
    {
      title: '核心编码 1小时',
      icon: '💻',
      streak: 8,
    },
  ];

  // 3. 初始固定标签
  const tags = [
    { name: '灵感', color: '#A78BFA', userId: guestUserId },
    { name: '杂记', color: '#60A5FA', userId: guestUserId },
    { name: '备忘', color: '#FBBF24', userId: guestUserId },
    { name: '读书笔记', color: '#34D399', userId: guestUserId },
  ];

  // 4. 初始固定灵感笔记
  const memos = [
    {
      id: `memo_${guestUserId}_1`,
      content: '微习惯法则反思：把每天的阻力降到不可思议的低（比如每天只读1页书），重点在于永远不断连胜心流。',
      tags: JSON.stringify(['灵感', '读书笔记']),
      category: 'INSPIRATION',
      userId: guestUserId,
    },
    {
      id: `memo_${guestUserId}_2`,
      content: '可以做一个智能相册软件，根据人脸和时间地点自动聚合成每周旅行回忆卡片，支持一键导出排版。',
      tags: JSON.stringify(['灵感']),
      category: 'INSPIRATION',
      userId: guestUserId,
    },
    {
      id: `memo_${guestUserId}_3`,
      content: '宽带账号: 13800138000，光猫后台 192.168.1.1 密码在光猫背面贴纸。',
      tags: JSON.stringify(['杂记', '备忘']),
      category: 'TRIVIA',
      userId: guestUserId,
    },
  ];

  // 5. 初始今日心得
  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);

  const summary = {
    userId: guestUserId,
    date: todayStart,
    content: '今天整体专注度非常高，体验了全新的预演沙盒架构！看到连胜打卡格子，自驱感瞬间拉满。保持简单，持续行动。',
  };

  return {
    tasks,
    habitDefinitions,
    tags,
    memos,
    summary,
  };
}
