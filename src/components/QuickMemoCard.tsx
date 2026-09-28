"use client";

import React, { useState, useRef } from "react";
import Link from "next/link";
import { Lightbulb, Send, ArrowRight, Tag as TagIcon, Plus, Check, X } from "lucide-react";
import { createMemo, createTag } from "@/app/actions";
import { toast } from "@/components/Feedback";
import { getTagColorDef, TagItem } from "./TagManagerModal";

const DEFAULT_FALLBACK_TAGS: TagItem[] = [
  { id: "def-1", name: "灵感", color: "purple" },
  { id: "def-2", name: "杂记", color: "blue" },
  { id: "def-3", name: "备忘", color: "amber" },
];

export default function QuickMemoCard({
  initialCount = 0,
  initialTags = []
}: {
  initialCount?: number;
  initialTags?: TagItem[];
}) {
  const [content, setContent] = useState("");
  const [tags, setTags] = useState<TagItem[]>(initialTags.length > 0 ? initialTags : DEFAULT_FALLBACK_TAGS);
  const [selectedTag, setSelectedTag] = useState<string>(tags[0]?.name || "灵感");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [count, setCount] = useState(initialCount);
  
  // 随手添加标签状态
  const [isAddingTag, setIsAddingTag] = useState(false);
  const [newTagName, setNewTagName] = useState("");

  const draftIdRef = useRef<string>(crypto.randomUUID());

  async function handleQuickAddTag(e?: React.FormEvent) {
    if (e) e.preventDefault();
    const trimmed = newTagName.trim().replace(/^#+/, "");
    if (!trimmed) {
      setIsAddingTag(false);
      return;
    }

    try {
      const res = await createTag(trimmed, "amber");
      if (res && res.ok && res.tag) {
        if (!tags.some(t => t.name === res.tag.name)) {
          setTags(prev => [...prev, res.tag]);
        }
        setSelectedTag(res.tag.name);
        toast.success("已创建并加入持久标签库 #" + trimmed);
      } else {
        toast.error(res?.error || "创建标签失败");
      }
    } catch {
      toast.error("创建标签失败");
    } finally {
      setNewTagName("");
      setIsAddingTag(false);
    }
  }

  async function handleSend(e?: React.FormEvent) {
    if (e) e.preventDefault();
    const trimmed = content.trim();
    if (!trimmed) {
      toast.info("请输入内容");
      return;
    }

    const currentDraftId = draftIdRef.current;
    const backupContent = content;

    setIsSubmitting(true);
    setContent(""); // 乐观清空输入框

    try {
      const res = await createMemo({
        id: currentDraftId,
        content: trimmed,
        tags: selectedTag ? [selectedTag] : []
      });

      if (!res || !res.ok) {
        setContent(backupContent);
        toast.error(res?.error || "保存失败，内容已恢复至输入框");
        return;
      }

      draftIdRef.current = crypto.randomUUID();
      setCount(prev => prev + 1);
      toast.success("灵感已记录 ✨");
    } catch (err) {
      console.error(err);
      setContent(backupContent);
      toast.error("保存失败，内容已恢复至输入框");
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  return (
    <section className="mb-8 bg-gradient-to-br from-amber-50/60 via-white to-orange-50/40 rounded-3xl p-5 shadow-sm border border-amber-100/80">
      <div className="flex justify-between items-center mb-3">
        <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
          <span className="w-7 h-7 rounded-xl bg-amber-100 flex items-center justify-center text-amber-600 shadow-sm shadow-amber-200/50">
            <Lightbulb className="w-4 h-4" />
          </span>
          灵感速记
        </h2>
        <Link 
          href="/memos" 
          className="text-xs font-bold text-amber-600 hover:text-amber-700 bg-amber-50 hover:bg-amber-100/80 px-2.5 py-1 rounded-full flex items-center gap-1 transition-colors"
        >
          查看全部 {count > 0 ? "(" + count + "条)" : ""} <ArrowRight className="w-3 h-3" />
        </Link>
      </div>

      <form onSubmit={handleSend} className="space-y-3">
        <div className="relative flex items-center">
          <input
            type="text"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="记下一个闪念、好点子或取件码小记..."
            disabled={isSubmitting}
            className="w-full bg-white/90 border border-slate-200/80 rounded-2xl pl-4 pr-11 py-3 text-sm font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400 shadow-sm transition-all"
          />
          <button
            type="submit"
            disabled={isSubmitting || !content.trim()}
            className="absolute right-2 p-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white disabled:opacity-40 disabled:hover:bg-amber-500 transition-all active:scale-95 shadow-sm shadow-amber-500/30"
            title="发送 (Enter)"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* 持久标签选取与快速新建 */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          <span className="text-[11px] font-bold text-slate-400 flex items-center mr-1">
            <TagIcon className="w-3 h-3 mr-0.5" /> 标签:
          </span>

          {tags.map((tag) => {
            const isSelected = selectedTag === tag.name;
            const colorDef = getTagColorDef(tag.color);
            return (
              <button
                type="button"
                key={tag.id}
                onClick={() => setSelectedTag(tag.name)}
                className={"text-xs px-2.5 py-1 rounded-full font-bold transition-all shrink-0 flex items-center gap-1 " + (
                  isSelected
                    ? "bg-amber-500 text-white shadow-sm shadow-amber-500/20 scale-105"
                    : "bg-white/80 border border-slate-200/60 text-slate-600 hover:bg-amber-50 hover:text-amber-700"
                )}
              >
                <span className={"w-1.5 h-1.5 rounded-full " + (isSelected ? "bg-white" : colorDef.dot)} />
                #{tag.name}
              </button>
            );
          })}

          {/* 行内即席添加新持久标签 */}
          {isAddingTag ? (
            <div className="inline-flex items-center bg-amber-50 rounded-full px-2 py-0.5 border border-amber-300 shrink-0">
              <span className="text-xs text-amber-600 font-bold mr-0.5">#</span>
              <input
                type="text"
                value={newTagName}
                onChange={e => setNewTagName(e.target.value)}
                onKeyDown={e => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleQuickAddTag();
                  }
                }}
                placeholder="新标签..."
                autoFocus
                className="w-20 bg-transparent text-xs font-bold text-slate-800 outline-none"
              />
              <button type="button" onClick={() => handleQuickAddTag()} className="text-amber-600 hover:text-amber-800 p-0.5">
                <Check className="w-3 h-3" />
              </button>
              <button type="button" onClick={() => setIsAddingTag(false)} className="text-slate-400 hover:text-slate-600 p-0.5">
                <X className="w-3 h-3" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setIsAddingTag(true)}
              className="text-xs px-2 py-1 rounded-full font-bold bg-white/80 border border-slate-200/60 text-slate-500 hover:text-amber-600 hover:bg-amber-50 transition-colors shrink-0 flex items-center gap-0.5"
              title="新建持久标签"
            >
              <Plus className="w-3 h-3" /> 新标签
            </button>
          )}
        </div>
      </form>
    </section>
  );
}
