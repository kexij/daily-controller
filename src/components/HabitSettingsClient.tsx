"use client";

import React, { useState, useEffect } from 'react';
import { updateHabit, deleteHabit, createHabit } from '@/app/actions';
import { Trash2, Edit2, Check, X, Plus } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { toast, confirmDialog } from '@/components/Feedback';

const PRESET_ICONS = ['✨', '📖', '🏃', '💧', '🍎', '💤', '🧘', '✍️', '🎸', '💻', '🏋️', '🍳'];

export default function HabitSettingsClient({ initialHabits }: { initialHabits: any[] }) {
  const router = useRouter();
  const [habits, setHabits] = useState(initialHabits);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ title: '', icon: '' });
  const [isSaving, setIsSaving] = useState(false);

  const [isAdding, setIsAdding] = useState(false);
  const [addForm, setAddForm] = useState({ title: '', icon: '✨' });

  // 同步服务端数据到本地状态
  useEffect(() => {
    setHabits(initialHabits);
  }, [initialHabits]);

  const handleEdit = (habit: any) => {
    setEditingId(habit.id);
    setEditForm({ title: habit.title, icon: habit.icon || '✨' });
    setIsAdding(false);
  };

  const handleSave = async (id: string) => {
    setIsSaving(true);
    try {
      await updateHabit(id, editForm);
      setEditingId(null);
      router.refresh();
      toast.success('习惯已更新');
    } catch (e) {
      console.error(e);
      toast.error('更新失败，请重试');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!(await confirmDialog('确定要删除这个习惯吗？（相关的打卡记录也会被删除）'))) return;
    try {
      await deleteHabit(id);
      router.refresh();
      toast.success('习惯已删除');
    } catch (e) {
      console.error(e);
      toast.error('删除失败，请重试');
    }
  };

  const handleAdd = async () => {
    if (!addForm.title.trim()) {
      toast.error('请输入习惯名称');
      return;
    }
    setIsSaving(true);
    try {
      const res = await createHabit(addForm);
      if (res && res.ok === false) {
        toast.error(res.error);
        return;
      }
      setAddForm({ title: '', icon: '✨' });
      setIsAdding(false);
      router.refresh();
      toast.success('习惯已添加');
    } catch (e) {
      console.error(e);
      toast.error('添加失败，请重试');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* 习惯列表 */}
      <div className="space-y-3">
        {habits.length === 0 && !isAdding && (
          <div className="text-sm text-slate-500 p-4 bg-white rounded-xl border border-slate-100 text-center">
            暂无习惯，请点击下方按钮添加。
          </div>
        )}
        
        {habits.map(habit => {
          const isEditing = editingId === habit.id;
          
          return (
            <div key={habit.id} className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm transition-all group">
              {isEditing ? (
                <div className="flex flex-col gap-3">
                  <div className="flex gap-2 items-center">
                    <input 
                      value={editForm.icon} 
                      onChange={e => setEditForm({...editForm, icon: e.target.value})}
                      className="w-12 h-10 text-center bg-slate-50 border border-slate-200 rounded-lg text-lg focus:outline-none focus:ring-2 focus:ring-emerald-400"
                      maxLength={2}
                    />
                    <input 
                      value={editForm.title} 
                      onChange={e => setEditForm({...editForm, title: e.target.value})}
                      className="flex-1 h-10 px-3 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold focus:outline-none focus:ring-2 focus:ring-emerald-400"
                    />
                    <button onClick={() => handleSave(habit.id)} disabled={isSaving} className="p-2 bg-emerald-100 text-emerald-700 rounded-lg hover:bg-emerald-200 disabled:opacity-50">
                      <Check className="w-4 h-4" />
                    </button>
                    <button onClick={() => setEditingId(null)} className="p-2 bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="flex gap-2 flex-wrap bg-slate-50 p-2 rounded-lg border border-slate-100">
                    {PRESET_ICONS.map(icon => (
                      <button 
                        key={icon} 
                        onClick={() => setEditForm({ ...editForm, icon })}
                        className="w-8 h-8 flex items-center justify-center text-lg hover:bg-white rounded hover:shadow-sm transition-all"
                      >
                        {icon}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-slate-50 rounded-full flex items-center justify-center text-xl shadow-inner border border-slate-100">
                      {habit.icon || '✨'}
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-800 text-sm">{habit.title}</h3>
                      <p className="text-xs text-slate-500">累计连胜 {habit.streak} 天</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => handleEdit(habit)} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDelete(habit.id)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* 添加习惯的表单 / 按钮 */}
      {isAdding ? (
        <div className="bg-white p-4 rounded-xl border border-blue-200 shadow-sm flex flex-col gap-3 animate-in fade-in">
          <div className="flex items-center gap-2">
            <input 
              value={addForm.icon} 
              onChange={e => setAddForm({...addForm, icon: e.target.value})}
              className="w-12 h-10 text-center bg-slate-50 border border-slate-200 rounded-lg text-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
              maxLength={2}
              placeholder="✨"
            />
            <input 
              value={addForm.title} 
              onChange={e => setAddForm({...addForm, title: e.target.value})}
              className="flex-1 h-10 px-3 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold focus:outline-none focus:ring-2 focus:ring-blue-400"
              placeholder="习惯名称..."
              autoFocus
            />
            <button onClick={handleAdd} disabled={isSaving} className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
              <Check className="w-4 h-4" />
            </button>
            <button onClick={() => setIsAdding(false)} className="p-2 bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="flex gap-2 flex-wrap bg-slate-50 p-2 rounded-lg border border-slate-100">
            {PRESET_ICONS.map(icon => (
              <button 
                key={icon} 
                onClick={() => setAddForm({ ...addForm, icon })}
                className="w-8 h-8 flex items-center justify-center text-lg hover:bg-white rounded hover:shadow-sm transition-all"
              >
                {icon}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <button 
          onClick={() => { setIsAdding(true); setEditingId(null); }}
          className="w-full py-4 border-2 border-dashed border-slate-200 rounded-xl text-slate-500 font-bold flex items-center justify-center gap-2 hover:bg-slate-50 hover:border-blue-300 hover:text-blue-600 transition-colors"
        >
          <Plus className="w-5 h-5" /> 新建习惯
        </button>
      )}
    </div>
  );
}
