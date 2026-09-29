'use client';

import React, { useState, useEffect } from 'react';
import { createMemo, deleteMemo, getTags } from '@/app/actions';
import { toast, confirmDialog } from '@/components/Feedback';
import { parseMemoContent } from '@/lib/task-utils';

export interface MemoItem {
  id: string;
  content: string;
  tags: string; // JSON string array
  category?: string;
  createdAt?: Date | string;
  updatedAt?: Date | string;
}

export interface TagItem {
  id?: string;
  name: string;
  color?: string;
}

interface MemoDetailModalProps {
  memo: MemoItem | null;
  availableTags?: TagItem[];
  onClose: () => void;
  onSaveSuccess?: (updatedMemo: MemoItem) => void;
  onDeleteSuccess?: (deletedId: string) => void;
}

export default function MemoDetailModal({
  memo,
  availableTags = [],
  onClose,
  onSaveSuccess,
  onDeleteSuccess
}: MemoDetailModalProps) {
  const [title, setTitle] = useState('');
  const [details, setDetails] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [tags, setTags] = useState<TagItem[]>(availableTags);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 初始化模态框数据
  useEffect(() => {
    if (memo) {
      const parsed = parseMemoContent(memo.content);
      setTitle(parsed.title);
      setDetails(parsed.details);
      try {
        const parsedTags = JSON.parse(memo.tags || '[]');
        setSelectedTags(Array.isArray(parsedTags) ? parsedTags : []);
      } catch {
        setSelectedTags([]);
      }
    }
  }, [memo]);

  // 同步并补充可用标签库
  useEffect(() => {
    if (availableTags && availableTags.length > 0) {
      setTags(availableTags);
    } else {
      getTags().then(dbTags => {
        if (dbTags && dbTags.length > 0) {
          setTags(dbTags);
        }
      }).catch(console.error);
    }
  }, [availableTags]);

  if (!memo) return null;

  const getFreshColor = (c?: string) => {
    if (!c) return '#CBD5E1';
    const legacyMap: Record<string, string> = {
      'purple': '#A78BFA',
      'blue': '#60A5FA',
      'amber': '#FBBF24',
      'green': '#34D399',
      'emerald': '#34D399',
      'red': '#F472B6',
      'rose': '#F472B6',
      'orange': '#FB923C',
      'indigo': '#818CF8',
      'slate': '#94A3B8'
    };
    return legacyMap[c] || c;
  };

  const toggleTag = (tagName: string) => {
    setSelectedTags(prev =>
      prev.includes(tagName)
        ? prev.filter(t => t !== tagName)
        : [...prev, tagName]
    );
  };

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    const cleanTitle = title.trim();
    if (!cleanTitle) {
      toast.error('灵感主题不能为空');
      return;
    }
    const cleanDetails = details.trim();
    const fullContent = cleanDetails ? `${cleanTitle}\n\n${cleanDetails}` : cleanTitle;

    setIsSubmitting(true);
    try {
      const res = await createMemo({
        id: memo!.id,
        content: fullContent,
        tags: selectedTags
      });

      if (res && res.ok === false) {
        toast.error(res.error || '保存失败');
        return;
      }

      toast.success('灵感更新成功');
      onSaveSuccess?.({
        ...memo!,
        content: fullContent,
        tags: JSON.stringify(selectedTags)
      });
      onClose();
    } catch (err) {
      console.error(err);
      toast.error('保存失败，请重试');
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDelete() {
    if (await confirmDialog('确定要删除这条灵感吗？此操作无法撤销。')) {
      setIsSubmitting(true);
      try {
        const res = await deleteMemo(memo!.id);
        if (res && res.ok === false) {
          toast.error(res.error || '删除失败');
          return;
        }
        toast.success('已删除');
        onDeleteSuccess?.(memo!.id);
        onClose();
      } catch (err) {
        console.error(err);
        toast.error('删除失败，请重试');
      } finally {
        setIsSubmitting(false);
      }
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm transition-opacity animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
        
        {/* 弹窗头部 */}
        <div className="flex justify-between items-center p-5 border-b border-slate-100 bg-slate-50/60">
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-full bg-amber-50 text-[#D97706] flex items-center justify-center text-sm font-bold shadow-xs">
              💡
            </span>
            <h3 className="font-bold text-slate-800 text-lg">灵感详情</h3>
          </div>
          <button 
            type="button" 
            onClick={onClose} 
            className="p-2 bg-white text-slate-400 hover:text-slate-600 rounded-full transition-colors active:scale-95 border border-slate-100 shadow-xs cursor-pointer"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>
        </div>

        {/* 弹窗表单 */}
        <form onSubmit={handleSave} className="p-5 flex flex-col gap-4">
          {/* 灵感主题 (标题) */}
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wider">灵感主题</label>
            <input
              name="title"
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="记下一个闪念、好点子或取件码小记..."
              className="w-full bg-slate-50 border border-slate-200/80 rounded-2xl px-4 py-3 text-sm font-bold text-slate-800 placeholder-slate-400 focus:outline-none focus:border-amber-300 focus:ring-4 focus:ring-amber-50 focus:bg-white transition-all"
              required
            />
          </div>

          {/* 标签选择与修改 */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">标签</label>
              <span className="text-[11px] text-slate-400">点击选择/取消</span>
            </div>
            <div className="flex flex-wrap gap-1.5 items-center max-h-24 overflow-y-auto pr-1 py-1">
              {tags.map(tag => {
                const isActive = selectedTags.includes(tag.name);
                return (
                  <button
                    key={tag.id || tag.name}
                    type="button"
                    onClick={() => toggleTag(tag.name)}
                    className={`px-3 py-1 rounded-full text-[11px] font-semibold transition-all flex items-center gap-1 active:scale-95 cursor-pointer ${
                      isActive
                        ? 'bg-[#F59E0B] text-white border border-[#F59E0B] shadow-xs'
                        : 'bg-slate-50 text-slate-600 border border-slate-200/80 hover:border-slate-300'
                    }`}
                  >
                    <span 
                      className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-white opacity-90' : ''}`} 
                      style={{ backgroundColor: isActive ? undefined : getFreshColor(tag.color) }}
                    ></span>
                    #{tag.name}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 详细备注 */}
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wider">详细备注</label>
            <textarea
              name="details"
              value={details}
              onChange={e => setDetails(e.target.value)}
              placeholder="更多细节补充... (可选)"
              className="w-full bg-slate-50 border border-slate-200/80 rounded-2xl px-4 py-3 text-sm font-medium text-slate-700 h-28 resize-none focus:outline-none focus:border-amber-300 focus:ring-4 focus:ring-amber-50 focus:bg-white transition-all placeholder:text-slate-400"
            />
          </div>

          {/* 操作按钮组 */}
          <div className="pt-2 flex flex-col gap-2.5">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-gradient-to-br from-[#FDBA74] to-[#F59E0B] hover:opacity-95 text-white font-bold py-3.5 rounded-2xl transition-all active:scale-[0.98] shadow-lg shadow-orange-500/25 text-sm tracking-wide flex justify-center items-center gap-2 disabled:opacity-70 cursor-pointer"
            >
              {isSubmitting ? '保存中...' : '保存更改'}
            </button>
            <button
              type="button"
              disabled={isSubmitting}
              onClick={handleDelete}
              className="w-full bg-white text-red-500 border border-red-200/80 hover:bg-red-50/60 font-bold py-3.5 rounded-2xl transition-all active:scale-[0.98] disabled:opacity-50 text-sm cursor-pointer shadow-xs"
            >
              直接删除
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
