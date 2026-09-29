'use client'

import React, { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { logout, updateProfile, changePassword, deleteAccount } from '@/app/actions';
import { toast, confirmDialog } from '@/components/Feedback';
import { Camera, Edit2, Check, X, Key, LogOut, AlertTriangle, User as UserIcon } from 'lucide-react';

export default function AccountSettingsClient({ user }: { user: any }) {
  const router = useRouter();
  
  const [isEditingName, setIsEditingName] = useState(false);
  const [name, setName] = useState(user?.name || '');
  const [avatar, setAvatar] = useState(user?.avatar || '');
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [showPwdModal, setShowPwdModal] = useState(false);
  const [pwdForm, setPwdForm] = useState({ old: '', new: '', confirm: '' });
  const [isSavingPwd, setIsSavingPwd] = useState(false);

  if (!user) {
    return (
      <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 text-center">
        <p className="text-slate-500 text-sm mb-4">登录后即可管理个人账号信息</p>
        <button onClick={() => router.push('/login')} className="bg-blue-600 text-white font-bold py-2 px-6 rounded-xl">去登录</button>
      </div>
    );
  }

  async function handleLogout() {
    const ok = await confirmDialog('确定要退出登录吗？');
    if (!ok) return;
    await logout();
    router.push('/');
    router.refresh();
  }

  async function handleDeleteAccount() {
    const ok = await confirmDialog('警告：注销账号将永久删除您的所有数据，确定要注销吗？');
    if (!ok) return;
    try {
      await deleteAccount();
      router.push('/login');
      router.refresh();
    } catch (e: any) {
      toast.error(e.message || '注销失败');
    }
  }

  async function saveProfile(newName: string, newAvatar: string) {
    setIsSavingProfile(true);
    try {
      await updateProfile(newName, newAvatar);
      toast.success('资料已更新');
      setIsEditingName(false);
      router.refresh();
    } catch (e) {
      toast.error('更新失败');
    } finally {
      setIsSavingProfile(false);
    }
  }

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      toast.error('头像图片不能超过 2MB');
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      setAvatar(base64);
      saveProfile(name, base64);
    };
    reader.readAsDataURL(file);
  };

  const handleSaveName = () => {
    if (!name.trim()) {
      toast.error('昵称不能为空');
      return;
    }
    saveProfile(name, avatar);
  };

  const handleSubmitPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pwdForm.old || !pwdForm.new || !pwdForm.confirm) {
      toast.error('请填写完整密码信息');
      return;
    }
    if (pwdForm.new !== pwdForm.confirm) {
      toast.error('两次输入的新密码不一致');
      return;
    }
    setIsSavingPwd(true);
    try {
      const res = await changePassword(pwdForm.old, pwdForm.new);
      if (res.ok) {
        toast.success('密码修改成功，请重新登录');
        setShowPwdModal(false);
        setPwdForm({ old: '', new: '', confirm: '' });
        await logout();
        router.push('/login');
        router.refresh();
      } else {
        toast.error(res.error || '密码修改失败');
      }
    } catch (e: any) {
      toast.error(e.message || '系统错误');
    } finally {
      setIsSavingPwd(false);
    }
  };

  return (
    <>
      <div className="bg-white rounded-[32px] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 overflow-hidden">
      
      {/* Top Section: Profile Info (Horizontal Layout) */}
      <div className="p-6 sm:p-8 flex items-center gap-6">
        
        {/* Avatar */}
        <div 
          className="relative group w-20 h-20 sm:w-24 sm:h-24 rounded-[28px] bg-slate-100 flex items-center justify-center shrink-0 shadow-sm border border-slate-200/60 overflow-hidden cursor-pointer transition-all hover:shadow-md"
          onClick={() => fileInputRef.current?.click()}
        >
          {avatar ? (
            <img src={avatar} alt="Avatar" className="w-full h-full object-cover" />
          ) : (
            <UserIcon className="w-10 h-10 text-slate-400" />
          )}
          <div className="absolute inset-0 bg-slate-900/20 flex items-center justify-center group-hover:bg-slate-900/50 transition-all duration-200">
            <Camera className="w-6 h-6 text-white" />
          </div>
          <input type="file" accept="image/*" ref={fileInputRef} onChange={handleAvatarChange} className="hidden" />
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="text-sm font-bold text-slate-400 mb-1 tracking-wide">@{user.username}</div>
          
          <div className="flex items-center gap-2">
            {isEditingName ? (
              <div className="flex items-center gap-2 w-full max-w-[200px] animate-in fade-in">
                <input 
                  type="text" 
                  value={name} 
                  onChange={e => setName(e.target.value)} 
                  autoFocus
                  className="w-full text-xl font-black text-slate-800 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300 transition-all"
                />
                <button onClick={handleSaveName} disabled={isSavingProfile} className="p-2 bg-blue-100 text-blue-600 rounded-xl hover:bg-blue-200 transition-colors shrink-0">
                  <Check className="w-4 h-4" />
                </button>
                <button onClick={() => { setIsEditingName(false); setName(user.name); }} className="p-2 bg-slate-100 text-slate-500 rounded-xl hover:bg-slate-200 transition-colors shrink-0">
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2 group animate-in fade-in">
                <h2 className="text-2xl font-black text-slate-800 truncate">{name}</h2>
                <button 
                  onClick={() => setIsEditingName(true)}
                  className="p-1.5 text-slate-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-all shadow-sm border border-slate-100 bg-white"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Actions */}
      <div className="px-6 sm:px-8 py-5 border-t border-slate-50 bg-slate-50/50 flex gap-4">
        <button 
          onClick={() => setShowPwdModal(true)} 
          className="flex-1 py-2.5 bg-white text-slate-700 font-bold text-[13px] rounded-[14px] border border-slate-200 hover:bg-slate-50 transition-all shadow-sm active:scale-95 flex items-center justify-center gap-1.5"
        >
          <Key className="w-4 h-4 text-slate-400" />
          修改密码
        </button>
        <button 
          onClick={handleLogout} 
          className="flex-1 py-2.5 bg-white text-slate-700 font-bold text-[13px] rounded-[14px] border border-slate-200 hover:bg-slate-50 transition-all shadow-sm active:scale-95 flex items-center justify-center gap-1.5"
        >
          <LogOut className="w-4 h-4 text-slate-400" />
          退出登录
        </button>
      </div>

      {/* Password Modal */}
      {showPwdModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-[24px] shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center p-5 border-b border-slate-100">
              <h3 className="font-bold text-slate-800 flex items-center gap-2">
                <Key className="w-4 h-4 text-blue-500" />
                修改密码
              </h3>
              <button onClick={() => setShowPwdModal(false)} className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <form onSubmit={handleSubmitPassword} className="p-5 flex flex-col gap-4">
              <div>
                <label className="text-[12px] font-bold text-slate-500 mb-1.5 block">原密码</label>
                <input 
                  type="password" 
                  value={pwdForm.old}
                  onChange={e => setPwdForm({...pwdForm, old: e.target.value})}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-[14px] font-medium text-slate-800 focus:outline-none focus:border-blue-300 focus:ring-4 focus:ring-blue-50 transition-all"
                  required
                />
              </div>
              <div>
                <label className="text-[12px] font-bold text-slate-500 mb-1.5 block">新密码</label>
                <input 
                  type="password" 
                  value={pwdForm.new}
                  onChange={e => setPwdForm({...pwdForm, new: e.target.value})}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-[14px] font-medium text-slate-800 focus:outline-none focus:border-blue-300 focus:ring-4 focus:ring-blue-50 transition-all"
                  required
                />
              </div>
              <div>
                <label className="text-[12px] font-bold text-slate-500 mb-1.5 block">确认新密码</label>
                <input 
                  type="password" 
                  value={pwdForm.confirm}
                  onChange={e => setPwdForm({...pwdForm, confirm: e.target.value})}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-[14px] font-medium text-slate-800 focus:outline-none focus:border-blue-300 focus:ring-4 focus:ring-blue-50 transition-all"
                  required
                />
              </div>
              
              <div className="mt-2">
                <button type="submit" disabled={isSavingPwd} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl transition-colors active:scale-95 disabled:opacity-70 flex justify-center items-center gap-2">
                  {isSavingPwd ? '提交中...' : '确认修改'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      </div>

      <div className="mt-8 text-center">
        <button 
          onClick={handleDeleteAccount} 
          className="text-[12px] font-medium text-slate-400 hover:text-slate-600 transition-colors underline underline-offset-4 decoration-slate-200 hover:decoration-slate-400"
        >
          注销账号
        </button>
      </div>
    </>
  );
}



