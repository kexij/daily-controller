
"use client";

import React, { useState, useMemo, useRef } from "react";
import { Search, Trash2, Copy, Check, ChevronLeft, Plus, X, Settings2 } from "lucide-react";
import { createMemo, deleteMemo, createTag, deleteTag } from "@/app/actions";
import { toast, confirmDialog } from "@/components/Feedback";
import { useRouter } from "next/navigation";

interface TagItem {
  id: string;
  name: string;
  color: string;
}

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

  // Create Area State
  const [newContent, setNewContent] = useState("");
  const [selectedTagsForCreate, setSelectedTagsForCreate] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Tag Management State
  const [isManaging, setIsManaging] = useState(false);
  const [isAddTagModalOpen, setIsAddTagModalOpen] = useState(false);
  const [newTagName, setNewTagName] = useState("");
  const colors = ['#A78BFA', '#60A5FA', '#34D399', '#FBBF24', '#F472B6', '#2DD4BF', '#FB923C', '#818CF8'];
  const [newTagColor, setNewTagColor] = useState(colors[0]);
  
  const [copiedId, setCopiedId] = useState<string | null>(null);


  const getFreshColor = (c?: string) => {
    if (!c) return '#CBD5E1';
    const legacyMap: Record<string, string> = {
      'purple': '#A78BFA',
      'blue': '#60A5FA',
      'amber': '#FBBF24',
      'green': '#34D399',
      'red': '#F472B6',
      'orange': '#FB923C'
    };
    return legacyMap[c] || c;
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
      // Refresh list
      router.refresh();
      // optimistic update is tricky since we don't get the full object back in the simple `createMemo` without changing backend. 
      // A router.refresh() handles the UI sync.
    } catch (err) {
      toast.error("记录失败");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleCreateTag() {
    if (!newTagName.trim()) return;
    try {
      const res = await createTag(newTagName, newTagColor);
      if (res && res.ok && res.tag) {
        if (!tags.some(t => t.name === res.tag.name)) {
          setTags([...tags, res.tag]);
        }
        setIsAddTagModalOpen(false);
        setNewTagName("");
      } else if (res && res.error) {
        toast.error(res.error);
      }
    } catch (e) {
      toast.error("添加标签失败");
    }
  }

  async function handleDeleteTagAction(tagId: string, tagName: string) {
    if (!(await confirmDialog(`确定要删除标签 #${tagName} 吗？`))) return;
    try {
      const res = await deleteTag(tagId);
      if (res && res.ok) {
        setTags(tags.filter(t => t.id !== tagId));
        setSelectedTagsForCreate(prev => prev.filter(t => t !== tagName));
        toast.success("已删除");
        router.refresh();
      }
    } catch {
      toast.error("删除失败");
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
        <button onClick={() => router.push('/stats')} className="flex items-center text-slate-500 font-medium text-[15px] mb-4 hover:text-slate-800 transition-colors">
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

      {/* 记录卡片 */}
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
        
        {/* 标签展示区 */}
        <div className="flex flex-wrap gap-2.5 items-center">
          {tags.map(tag => {
            const isSelected = selectedTagsForCreate.includes(tag.name);
            const baseClasses = isSelected
              ? "bg-slate-800 text-white shadow-sm border-transparent"
              : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50";
            
            const shakeClass = isManaging ? "animate-[wiggle_0.25s_ease-in-out_infinite]" : "";
            
            return (
              <div key={tag.id} className={`relative inline-block ${shakeClass}`}>
                <button 
                  onClick={() => {
                    if (isManaging) return;
                    setSelectedTagsForCreate(prev => 
                      prev.includes(tag.name) ? prev.filter(t => t !== tag.name) : [...prev, tag.name]
                    );
                  }} 
                  className={`px-3.5 py-1.5 rounded-full text-[13px] font-bold border transition-all flex items-center gap-1.5 ${baseClasses}`}
                >
                  <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: getFreshColor(tag.color) }}></span>
                  #{tag.name}
                </button>
                {isManaging && (
                  <button 
                    onClick={() => handleDeleteTagAction(tag.id, tag.name)} 
                    className="absolute -top-1.5 -right-1.5 w-[18px] h-[18px] bg-red-500 text-white rounded-full flex items-center justify-center shadow-md hover:bg-red-600 transition-all z-10 border border-white"
                  >
                    <X className="w-2.5 h-2.5" />
                  </button>
                )}
              </div>
            );
          })}

          {isManaging && (
            <button onClick={() => setIsAddTagModalOpen(true)} className="px-3.5 py-1.5 rounded-full text-[13px] font-bold bg-[#F1F5F9] text-slate-500 border border-transparent hover:bg-slate-200 transition-all flex items-center gap-1">
              <Plus className="w-3.5 h-3.5" />
              新标签
            </button>
          )}
          
          <button 
            onClick={() => setIsManaging(!isManaging)} 
            className={`px-3 py-1.5 rounded-full text-[13px] font-bold transition-all flex items-center gap-1 ml-auto ${isManaging ? 'text-blue-500 bg-blue-50' : 'text-slate-400 bg-transparent hover:bg-slate-100'}`}
          >
            {isManaging ? <Check className="w-3.5 h-3.5" /> : <Settings2 className="w-3.5 h-3.5" />}
            {isManaging ? '完成' : '管理'}
          </button>
        </div>
        
        <div className="mt-1 flex justify-end">
          <button 
            onClick={handleCreateMemo} 
            disabled={isSubmitting}
            className="bg-[#D8B4FE] hover:bg-[#C084FC] text-white font-bold py-2.5 px-6 rounded-[14px] transition-all active:scale-95 text-[14px] shadow-lg shadow-purple-500/20 disabled:opacity-70 disabled:active:scale-100"
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
            className={`shrink-0 px-4 py-2 rounded-full text-[13px] font-bold flex items-center gap-1.5 transition-all ${selectedTagFilter === '全部' ? 'bg-[#1E293B] text-white shadow-md' : 'bg-white text-slate-600 border border-slate-100 shadow-[0_2px_8px_rgba(0,0,0,0.02)]'}`}
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
                className={`shrink-0 px-4 py-2 rounded-full text-[13px] font-bold flex items-center gap-1.5 transition-all ${isSelected ? 'bg-[#1E293B] text-white shadow-md border border-transparent' : 'bg-white text-slate-600 border border-slate-100 shadow-[0_2px_8px_rgba(0,0,0,0.02)]'}`}
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
                    <button onClick={() => handleCopy(memo.id, memo.content)} className="p-1.5 text-slate-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors">
                      {copiedId === memo.id ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                    <button onClick={() => handleDeleteMemo(memo.id)} className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
      
      {/* 新建标签专属弹窗 (Overlay) */}
      <div className={`fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm transition-all duration-300 ${isAddTagModalOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
        <div className={`bg-white rounded-[28px] shadow-2xl w-full max-w-[320px] overflow-hidden flex flex-col transition-all duration-300 ${isAddTagModalOpen ? 'translate-y-0 scale-100' : 'translate-y-12 scale-95'}`}>
          
          <div className="flex justify-between items-center p-6 pb-4">
            <h3 className="font-bold text-slate-800 text-[16px]">新建标签</h3>
            <button onClick={() => setIsAddTagModalOpen(false)} className="p-2 bg-slate-100 text-slate-400 hover:text-slate-600 rounded-full transition-colors active:scale-95">
              <X className="w-4 h-4" />
            </button>
          </div>
          
          <div className="px-6 pb-6 flex flex-col gap-5">
            <div>
              <label className="block text-[12px] font-bold text-slate-400 mb-2">标签名称</label>
              <input 
                type="text" 
                value={newTagName}
                onChange={e => setNewTagName(e.target.value)}
                placeholder="例如：学习" 
                className="w-full bg-slate-50 border border-slate-100 rounded-[16px] px-4 py-3 text-[14px] font-bold text-slate-800 focus:outline-none focus:border-purple-300 focus:bg-white transition-all" 
              />
            </div>
            
            <div>
              <label className="block text-[12px] font-bold text-slate-400 mb-2">选择颜色</label>
              <div className="flex flex-wrap gap-3">
                {colors.map(color => {
                  const isSelected = newTagColor === color;
                  return (
                    <button 
                      key={color}
                      onClick={() => setNewTagColor(color)}
                      className={`w-7 h-7 rounded-full relative transition-all duration-200 ${isSelected ? 'ring-2 ring-offset-2 scale-110' : 'hover:scale-110'}`} 
                      style={{ backgroundColor: color, ...(isSelected ? { '--tw-ring-color': color } as any : {}) }}
                    >
                      {isSelected && <Check className="w-3 h-3 text-white absolute inset-0 m-auto" />}
                    </button>
                  );
                })}
              </div>
            </div>
            
            <button 
              onClick={handleCreateTag}
              className="w-full mt-2 bg-slate-900 hover:bg-slate-800 text-white font-bold py-3.5 rounded-[16px] transition-all active:scale-95 shadow-md text-[14px]"
            >
              确定创建
            </button>
          </div>
        </div>
      </div>
      
    </div>
  );
}

