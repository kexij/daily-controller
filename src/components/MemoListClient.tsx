"use client";

import React, { useState, useMemo, useEffect } from "react";
import { Search, Trash2, Copy, Check, ChevronLeft, Plus, Settings2 } from "lucide-react";
import { createMemo, deleteMemo, createTag } from "@/app/actions";
import { toast, confirmDialog } from "@/components/Feedback";
import { useRouter } from "next/navigation";
import TagManagerModal, { TagItem, getTagColorDef } from "./TagManagerModal";

interface MemoItem {
  id: string;
  content: string;
  tags: string; // JSON string array
  category: string;
  createdAt: Date | string;
}

export default function MemoListClient({
  initialMemos = [],
  initialTags = []
}: {
  initialMemos?: MemoItem[];
  initialTags?: TagItem[];
}) {
  const router = useRouter();
  const [memos, setMemos] = useState<MemoItem[]>(initialMemos);
  const [tags, setTags] = useState<TagItem[]>(initialTags);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTagFilter, setSelectedTagFilter] = useState<string>("全部");

  // 当外部传入数据刷新时，自动保持内部状态同步
  useEffect(() => {
    setTags(initialTags);
  }, [initialTags]);

  useEffect(() => {
    setMemos(initialMemos);
  }, [initialMemos]);

  // 新建灵感状态
  const [newContent, setNewContent] = useState("");
  const [selectedTagsForCreate, setSelectedTagsForCreate] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 标签管理弹窗状态
  const [isTagManagerOpen, setIsTagManagerOpen] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

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

  // 标签管理变更后，全方位联动同步（新建区域、筛选区域、已有灵感）
  const handleTagsChange = (
    nextTags: TagItem[],
    cascade?: { oldName?: string; newName?: string; deletedName?: string }
  ) => {
    setTags(nextTags);

    // 1. 如果修改重命名了标签 (oldName -> newName)
    if (cascade?.oldName && cascade?.newName) {
      const { oldName, newName } = cascade;
      // 实时同步新建灵感的选中标签列表
      setSelectedTagsForCreate(prev =>
        prev.map(t => (t === oldName ? newName : t))
      );
      // 实时同步当前筛选标签
      if (selectedTagFilter === oldName) {
        setSelectedTagFilter(newName);
      }
      // 实时同步已展示灵感卡片中的标签名
      setMemos(prev =>
        prev.map(m => {
          try {
            const arr = JSON.parse(m.tags || "[]");
            if (Array.isArray(arr) && arr.includes(oldName)) {
              return {
                ...m,
                tags: JSON.stringify(arr.map((t: string) => (t === oldName ? newName : t))),
              };
            }
          } catch {}
          return m;
        })
      );
    }

    // 2. 如果删除了标签 (deletedName)
    if (cascade?.deletedName) {
      const { deletedName } = cascade;
      // 从新建灵感选中列表中移除已删除标签
      setSelectedTagsForCreate(prev => prev.filter(t => t !== deletedName));
      // 若当前筛选为已删除标签，重置回全部
      if (selectedTagFilter === deletedName) {
        setSelectedTagFilter("全部");
      }
      // 从已展示灵感卡片中剔除该标签
      setMemos(prev =>
        prev.map(m => {
          try {
            const arr = JSON.parse(m.tags || "[]");
            if (Array.isArray(arr) && arr.includes(deletedName)) {
              return {
                ...m,
                tags: JSON.stringify(arr.filter((t: string) => t !== deletedName)),
              };
            }
          } catch {}
          return m;
        })
      );
    }

    router.refresh();
  };

  // Computed
  const tagCounts = useMemo(() => {
    const counts: Record<string, number> = { "全部": memos.length };
    memos.forEach(m => {
      try {
        const parsed = JSON.parse(m.tags || "[]");
        if (Array.isArray(parsed)) {
          parsed.forEach((t: string) => {
            if (t) counts[t] = (counts[t] || 0) + 1;
          });
        }
      } catch {}
    });
    return counts;
  }, [memos]);

  const filteredMemos = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return memos.filter(item => {
      if (selectedTagFilter !== "全部") {
        try {
          const parsed = JSON.parse(item.tags || "[]");
          if (!Array.isArray(parsed) || !parsed.includes(selectedTagFilter)) return false;
        } catch { return false; }
      }
      if (query) {
        const inContent = item.content.toLowerCase().includes(query);
        let inTags = false;
        try {
          const parsed = JSON.parse(item.tags || "[]");
          inTags = Array.isArray(parsed) && parsed.some(t => t.toLowerCase().includes(query));
        } catch {}
        return inContent || inTags;
      }
      return true;
    });
  }, [memos, searchQuery, selectedTagFilter]);

  // Handlers
  async function handleCreateMemo() {
    if (!newContent.trim()) {
      toast.error("内容不能为空");
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await createMemo({ content: newContent, tags: selectedTagsForCreate });
      if (res && res.ok === false) {
        toast.error(res.error);
        return;
      }
      toast.success("记录成功");
      setNewContent("");
      router.refresh();
    } catch (err) {
      toast.error("记录失败");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDeleteMemo(id: string) {
    if (!(await confirmDialog("确定要删除这条速记吗？"))) return;
    try {
      await deleteMemo(id);
      setMemos(memos.filter(m => m.id !== id));
      toast.success("已删除");
    } catch {
      toast.error("删除失败");
    }
  }

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    toast.success("已复制到剪贴板");
    setTimeout(() => setCopiedId(null), 2000);
  };

  const formatTime = (dateInput: Date | string) => {
    const d = new Date(dateInput);
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const h = String(d.getHours()).padStart(2, '0');
    const min = String(d.getMinutes()).padStart(2, '0');
    return `${m}-${day} ${h}:${min}`;
  };

  return (
    <div className="w-full max-w-[480px] bg-[#F6F7F9] min-h-screen relative shadow-2xl flex flex-col mx-auto font-sans text-slate-800">
      
      {/* Header 区域 */}
      <div className="px-5 pt-8 pb-4">
        <button onClick={() => router.push('/stats')} className="flex items-center text-slate-500 font-medium text-[15px] mb-4 hover:text-slate-800 transition-colors cursor-pointer">
          <ChevronLeft className="w-4 h-4 mr-1" />
          返回复盘
        </button>
        
        <div className="flex items-center justify-between mb-1.5">
          <h1 className="text-[28px] font-bold text-slate-900 flex items-center gap-2">
            灵感速记 <span className="text-2xl">💡</span>
          </h1>
          <span className="bg-[#F3E8FF] text-[#9333EA] text-[13px] font-bold px-3 py-1 rounded-full">
            共 {memos.length} 条
          </span>
        </div>
        <p className="text-slate-500 text-[14px] font-medium">捕捉一闪而过的火花与生活备忘</p>
      </div>

      {/* 记录卡片（新建灵感区） */}
      <div className="mx-5 bg-white rounded-[24px] p-5 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 flex flex-col gap-4 relative z-10">
        <textarea 
          value={newContent}
          onChange={(e) => setNewContent(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
              e.preventDefault();
              handleCreateMemo();
            }
          }}
          placeholder="随时记下灵感碎片、待办线索或生活杂记... (Ctrl+Enter 发送)" 
          className="w-full bg-[#F8FAFC] border border-slate-100 rounded-[16px] px-4 py-3.5 text-[14px] font-medium text-slate-700 h-24 resize-none focus:outline-none focus:border-purple-200 focus:ring-4 focus:ring-purple-50 transition-all"
        ></textarea>
        
        {/* 标签选择区 */}
        <div className="flex flex-wrap gap-2.5 items-center">
          {tags.map(tag => {
            const isSelected = selectedTagsForCreate.includes(tag.name);
            const baseClasses = isSelected
              ? "bg-slate-800 text-white shadow-sm border-transparent"
              : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50";
            
            return (
              <button 
                key={tag.id}
                type="button"
                onClick={() => {
                  setSelectedTagsForCreate(prev => 
                    prev.includes(tag.name) ? prev.filter(t => t !== tag.name) : [...prev, tag.name]
                  );
                }} 
                className={`px-3.5 py-1.5 rounded-full text-[13px] font-bold border transition-all flex items-center gap-1.5 cursor-pointer ${baseClasses}`}
              >
                <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: getFreshColor(tag.color) }}></span>
                #{tag.name}
              </button>
            );
          })}

          <button 
            type="button"
            onClick={() => setIsTagManagerOpen(true)} 
            className="px-3 py-1.5 rounded-full text-[13px] font-bold text-slate-400 bg-transparent hover:bg-slate-100 transition-all flex items-center gap-1 ml-auto cursor-pointer"
            title="管理/修改/删除标签"
          >
            <Settings2 className="w-3.5 h-3.5" />
            管理标签
          </button>
        </div>
        
        <div className="mt-1 flex justify-end">
          <button 
            onClick={handleCreateMemo} 
            disabled={isSubmitting}
            className="bg-[#D8B4FE] hover:bg-[#C084FC] text-white font-bold py-2.5 px-6 rounded-[14px] transition-all active:scale-95 text-[14px] shadow-lg shadow-purple-500/20 disabled:opacity-70 disabled:active:scale-100 cursor-pointer"
          >
            {isSubmitting ? '记录中...' : '记录灵感'}
          </button>
        </div>
      </div>

      {/* 搜索与筛选 */}
      <div className="px-5 mt-6 flex flex-col gap-4 relative z-0">
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="搜索灵感内容或标签..." 
              className="w-full bg-white rounded-2xl pl-11 pr-4 py-3.5 text-[14px] font-medium text-slate-800 focus:outline-none shadow-[0_2px_10px_rgb(0,0,0,0.02)] border border-slate-100" 
            />
          </div>
        </div>

        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
          <button 
            onClick={() => setSelectedTagFilter("全部")}
            className={`shrink-0 px-4 py-2 rounded-full text-[13px] font-bold flex items-center gap-1.5 transition-all cursor-pointer ${selectedTagFilter === '全部' ? 'bg-[#1E293B] text-white shadow-md' : 'bg-white text-slate-600 border border-slate-100 shadow-[0_2px_8px_rgba(0,0,0,0.02)]'}`}
          >
            全部 <span className={`text-[11px] px-1.5 py-0.5 rounded-md ${selectedTagFilter === '全部' ? 'bg-slate-700 text-white' : 'bg-slate-100 text-slate-500'}`}>{memos.length}</span>
          </button>
          
          {tags.map(t => {
            const count = tagCounts[t.name] || 0;
            const isSelected = selectedTagFilter === t.name;
            return (
              <button 
                key={t.id}
                onClick={() => setSelectedTagFilter(t.name)}
                className={`shrink-0 px-4 py-2 rounded-full text-[13px] font-bold flex items-center gap-1.5 transition-all cursor-pointer ${isSelected ? 'bg-[#1E293B] text-white shadow-md border border-transparent' : 'bg-white text-slate-600 border border-slate-100 shadow-[0_2px_8px_rgba(0,0,0,0.02)]'}`}
              >
                <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: getFreshColor(t.color) }}></span>
                #{t.name} <span className={`text-[11px] px-1.5 py-0.5 rounded-md ${isSelected ? 'bg-slate-700 text-white' : 'bg-slate-100 text-slate-500'}`}>{count}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 列表区 */}
      <div className="px-5 mt-5 flex-1 pb-10 flex flex-col gap-4">
        {filteredMemos.length === 0 ? (
          <div className="text-center py-10 opacity-60">
            <span className="text-slate-400 text-sm font-medium">没有找到匹配的灵感 ✨</span>
          </div>
        ) : (
          filteredMemos.map(memo => {
            let tagsArray: string[] = [];
            try { tagsArray = JSON.parse(memo.tags || "[]"); } catch {}

            return (
              <div key={memo.id} className="bg-white p-5 rounded-[20px] shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-slate-100 flex flex-col gap-3">
                <p className="text-[14px] font-medium text-slate-800 leading-relaxed whitespace-pre-wrap break-words">
                  {memo.content}
                </p>
                <div className="flex items-center justify-between mt-1 pt-3 border-t border-slate-50">
                  <div className="flex items-center gap-2 flex-wrap">
                    {tagsArray.map(tName => {
                      const matchedTag = tags.find(t => t.name === tName);
                      return (
                        <span key={tName} className="text-[11px] font-bold px-2 py-0.5 rounded-md border border-slate-100 bg-slate-50 text-slate-500 flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: getFreshColor(matchedTag?.color) }}></span>
                          #{tName}
                        </span>
                      );
                    })}
                    <span className="text-[11px] font-semibold text-slate-400 ml-1">
                      {formatTime(memo.createdAt)}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-1">
                    <button onClick={() => handleCopy(memo.id, memo.content)} className="p-1.5 text-slate-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors cursor-pointer">
                      {copiedId === memo.id ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                    <button onClick={() => handleDeleteMemo(memo.id)} className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors cursor-pointer">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* 完整标签管理弹窗（支持查看、重命名、修改颜色、删除级联、新增） */}
      {isTagManagerOpen && (
        <TagManagerModal
          tags={tags}
          onClose={() => setIsTagManagerOpen(false)}
          onTagsChange={handleTagsChange}
        />
      )}
      
    </div>
  );
}
