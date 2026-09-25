const fs = require('fs');
const path = require('path');

const clientPath = path.join(__dirname, 'src/components/HabitSettingsClient.tsx');
const clientContent = `"use client";

import React, { useState } from 'react';
import { updateHabit, deleteHabit } from '@/app/actions';
import { Settings, Trash2, Edit2, Check, X } from 'lucide-react';

export default function HabitSettingsClient({ initialHabits }: { initialHabits: any[] }) {
  const [habits, setHabits] = useState(initialHabits);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ title: '', icon: '' });
  const [isSaving, setIsSaving] = useState(false);

  const handleEdit = (habit: any) => {
    setEditingId(habit.id);
    setEditForm({ title: habit.title, icon: habit.icon || '✨' });
  };

  const handleSave = async (id: string) => {
    setIsSaving(true);
    try {
      await updateHabit(id, editForm);
      setHabits(habits.map(h => h.id === id ? { ...h, ...editForm } : h));
      setEditingId(null);
      alert('习惯已更新！');
    } catch (e) {
      console.error(e);
      alert('更新失败，请重试');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('确定要删除这个习惯吗？（相关的打卡记录也会被删除）')) return;
    
    try {
      await deleteHabit(id);
      setHabits(habits.filter(h => h.id !== id));
      alert('习惯已删除');
    } catch (e) {
      console.error(e);
      alert('删除失败，请重试');
    }
  };

  if (habits.length === 0) {
    return <div className="text-sm text-slate-500 p-4 bg-white rounded-xl border border-slate-100">暂无习惯，请点击右下角按钮添加。</div>;
  }

  return (
    <div className="space-y-3">
      {habits.map(habit => {
        const isEditing = editingId === habit.id;
        
        return (
          <div key={habit.id} className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex items-center justify-between group">
            {isEditing ? (
              <div className="flex-1 flex gap-2 items-center">
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
                <button 
                  onClick={() => handleSave(habit.id)}
                  disabled={isSaving}
                  className="p-2 bg-emerald-100 text-emerald-700 rounded-lg hover:bg-emerald-200 disabled:opacity-50"
                >
                  <Check className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => setEditingId(null)}
                  className="p-2 bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-slate-50 rounded-full flex items-center justify-center text-xl">
                    {habit.icon || '✨'}
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800 text-sm">{habit.title}</h3>
                    <p className="text-xs text-slate-500">累计连胜 {habit.streak} 天</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => handleEdit(habit)}
                    className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => handleDelete(habit.id)}
                    className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </>
            )}
          </div>
        );
      })}
    </div>
  );
}`;
fs.writeFileSync(clientPath, clientContent);
console.log('HabitSettingsClient created successfully');
