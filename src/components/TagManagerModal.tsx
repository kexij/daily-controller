"use client";

import React, { useState } from "react";
import { X, Tag as TagIcon, Trash2, Edit2, Check, Plus } from "lucide-react";
import { createTag, updateTag, deleteTag } from "@/app/actions";
import { toast, confirmDialog } from "@/components/Feedback";

export interface TagItem {
  id: string;
  name: string;
  color: string;
}

export const COLOR_PALETTE = [
  { key: "purple", label: "紫", bg: "bg-purple-100 text-purple-700 border-purple-200", dot: "bg-purple-500" },
  { key: "blue", label: "蓝", bg: "bg-blue-100 text-blue-700 border-blue-200", dot: "bg-blue-500" },
  { key: "amber", label: "橙", bg: "bg-amber-100 text-amber-700 border-amber-200", dot: "bg-amber-500" },
  { key: "emerald", label: "绿", bg: "bg-emerald-100 text-emerald-700 border-emerald-200", dot: "bg-emerald-500" },
  { key: "rose", label: "红", bg: "bg-rose-100 text-rose-700 border-rose-200", dot: "bg-rose-500" },
  { key: "indigo", label: "靛", bg: "bg-indigo-100 text-indigo-700 border-indigo-200", dot: "bg-indigo-500" },
  { key: "slate", label: "灰", bg: "bg-slate-100 text-slate-700 border-slate-200", dot: "bg-slate-500" },
];

export function getTagColorDef(colorKey?: string) {
  const match = COLOR_PALETTE.find(c => c.key === colorKey);
  return match || COLOR_PALETTE[0];
}

interface TagManagerModalProps {
  tags: TagItem[];
  onClose: () => void;
  onTagsChange: (newTags: TagItem[], cascade?: { oldName?: string; newName?: string; deletedName?: string }) => void;
}

export default function TagManagerModal({ tags, onClose, onTagsChange }: TagManagerModalProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editColor, setEditColor] = useState("purple");

  // 新增标签表单状态
  const [newName, setNewName] = useState("");
  const [newColor, setNewColor] = useState("purple");
  const [isSubmitting, setIsSubmitting] = useState(false);

  function startEdit(t: TagItem) {
    setEditingId(t.id);
    setEditName(t.name);
    setEditColor(t.color || "purple");
  }

  async function handleSaveEdit(t: TagItem) {
    const trimmed = editName.trim().replace(/^#+/, "");
    if (!trimmed) {
      toast.info("标签名称不能为空");
      return;
    }

    try {
      const res = await updateTag(t.id, trimmed, editColor);
      if (!res || !res.ok) {
        toast.error(res?.error || "修改失败");
        return;
      }

      const nextTags = tags.map(item => (item.id === t.id ? { ...item, name: trimmed, color: editColor } : item));
      onTagsChange(nextTags, { oldName: t.name, newName: trimmed });
      setEditingId(null);
      toast.success("标签已更新并同步至关联速记");
    } catch (e) {
      console.error(e);
      toast.error("保存失败，请重试");
    }
  }

  async function handleDelete(t: TagItem) {
    const ok = await confirmDialog("确定要删除标签 #" + t.name + " 吗？\n删除后将同时从所有已有关联速记中移除此标签。");
    if (!ok) return;

    try {
      const res = await deleteTag(t.id);
      if (!res || !res.ok) {
        toast.error(res?.error || "删除失败");
        return;
      }

      const nextTags = tags.filter(item => item.id !== t.id);
      onTagsChange(nextTags, { deletedName: t.name });
      toast.success("已删除标签 #" + t.name);
    } catch (e) {
      console.error(e);
      toast.error("删除失败，请重试");
    }
  }

  async function handleCreateTag(e?: React.FormEvent) {
    if (e) e.preventDefault();
    const trimmed = newName.trim().replace(/^#+/, "");
    if (!trimmed) {
      toast.info("请输入标签名称");
      return;
    }

    if (tags.some(t => t.name === trimmed)) {
      toast.info("已存在同名标签");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await createTag(trimmed, newColor);
      if (!res || !res.ok) {
        toast.error(res?.error || "创建失败");
        return;
      }

      if (res.tag) {
        const nextTags = [...tags, res.tag];
        onTagsChange(nextTags);
      }
      setNewName("");
      toast.success("已新建持久标签 #" + trimmed + " ✨");
    } catch (e) {
      console.error(e);
      toast.error("创建失败，请重试");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden flex flex-col animate-in zoom-in-95 duration-200 max-h-[85vh]">
        {/* Header */}
        <div className="flex justify-between items-center p-5 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-xl bg-purple-100 flex items-center justify-center text-purple-600 shadow-sm shadow-purple-200/50">
              <TagIcon className="w-4 h-4" />
            </span>
            <div>
              <h3 className="font-bold text-slate-800 text-base">自定义标签管理</h3>
              <p className="text-[11px] text-slate-400 font-medium">持久存储 · 修改删除实时级联同步</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 bg-slate-100 text-slate-400 hover:text-slate-600 rounded-full transition-colors active:scale-95"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 标签列表区 */}
        <div className="p-5 overflow-y-auto space-y-2.5 flex-1 scrollbar-thin">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
            当前专属标签库 ({tags.length})
          </div>

          {tags.length === 0 ? (
            <div className="text-center py-6 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
              <p className="text-xs text-slate-400">还没有任何标签，在下方创建一个吧</p>
            </div>
          ) : (
            tags.map(t => {
              const colorDef = getTagColorDef(t.color);
              const isEditing = editingId === t.id;

              if (isEditing) {
                return (
                  <div key={t.id} className="p-3 bg-purple-50/60 rounded-2xl border border-purple-200 space-y-2 animate-in fade-in">
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={editName}
                        onChange={e => setEditName(e.target.value)}
                        className="flex-1 bg-white border border-purple-300 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-purple-400"
                        autoFocus
                      />
                      <button
                        onClick={() => handleSaveEdit(t)}
                        className="p-1.5 rounded-lg bg-purple-600 text-white hover:bg-purple-700 transition-colors"
                        title="保存修改"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setEditingId(null)}
                        className="p-1.5 rounded-lg bg-slate-200 text-slate-600 hover:bg-slate-300 transition-colors"
                        title="取消"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    {/* 颜色修改 */}
                    <div className="flex items-center gap-1.5 pt-1">
                      <span className="text-[10px] font-bold text-purple-700">色彩:</span>
                      {COLOR_PALETTE.map(c => (
                        <button
                          type="button"
                          key={c.key}
                          onClick={() => setEditColor(c.key)}
                          className={"w-5 h-5 rounded-full " + c.dot + " transition-transform " + (editColor === c.key ? "ring-2 ring-purple-600 ring-offset-1 scale-110" : "opacity-70 hover:opacity-100")}
                        />
                      ))}
                    </div>
                  </div>
                );
              }

              return (
                <div
                  key={t.id}
                  className="flex items-center justify-between p-2.5 bg-white border border-slate-100 hover:border-slate-200 rounded-2xl shadow-xs transition-all group"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className={"w-2.5 h-2.5 rounded-full shrink-0 " + colorDef.dot} />
                    <span className="text-xs font-bold text-slate-800 truncate">#{t.name}</span>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => startEdit(t)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-purple-600 hover:bg-purple-50 transition-colors"
                      title="重命名或修改颜色"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(t)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                      title="删除此标签"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* 底部新增持久标签区 */}
        <form onSubmit={handleCreateTag} className="p-4 bg-slate-50/80 border-t border-slate-100 space-y-3">
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={newName}
              onChange={e => setNewName(e.target.value)}
              placeholder="新增持久标签名称..."
              maxLength={20}
              className="flex-1 bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-purple-400 shadow-xs"
            />
            <button
              type="submit"
              disabled={isSubmitting || !newName.trim()}
              className="px-3.5 py-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-40 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1 shrink-0 active:scale-95"
            >
              <Plus className="w-3.5 h-3.5" /> 添加
            </button>
          </div>

          {/* 颜色选取 */}
          <div className="flex items-center justify-between px-1">
            <span className="text-[11px] font-bold text-slate-400">标签色彩:</span>
            <div className="flex items-center gap-1.5">
              {COLOR_PALETTE.map(c => (
                <button
                  type="button"
                  key={c.key}
                  onClick={() => setNewColor(c.key)}
                  className={"w-4 h-4 rounded-full " + c.dot + " transition-transform " + (newColor === c.key ? "ring-2 ring-purple-600 ring-offset-1 scale-125" : "opacity-60 hover:opacity-100")}
                  title={c.label}
                />
              ))}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
