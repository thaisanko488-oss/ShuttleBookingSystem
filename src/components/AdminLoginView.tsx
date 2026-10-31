import React, { useState } from 'react';
import { AdminUser } from '../types';
import { ShieldCheck, Lock, User, ArrowRight, Eye, EyeOff } from 'lucide-react';
import Swal from 'sweetalert2';
import { useLanguage } from '../context/LanguageContext';

interface AdminLoginViewProps {
  admins: AdminUser[];
  onLoginSuccess: (user: AdminUser) => void;
}

export const AdminLoginView: React.FC<AdminLoginViewProps> = ({ admins, onLoginSuccess }) => {
  const { t } = useLanguage();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();

    const userTrim = username.trim();
    const userLower = userTrim.toLowerCase();

    // Check credentials against admin users or fallback presets
    const foundAdmin = admins.find(a => a.username.trim().toLowerCase() === userLower);

    let isValid = false;
    if (foundAdmin) {
      if (foundAdmin.password) {
        isValid = foundAdmin.password === password;
      } else {
        isValid =
          (userLower === 'admin' && password === '035746488') ||
          (userLower === 'chanon' && password === '0870006622') ||
          password === 'admin123';
      }
    } else {
      isValid =
        (username === 'Admin' && password === '035746488') ||
        (username === 'chanon' && password === '0870006622');
    }

    if (isValid) {
      const activeAdmin: AdminUser = foundAdmin || {
        id: 'adm-1',
        username: username,
        name: username === 'Admin' ? 'System Administrator' : username,
        role: username === 'Admin' ? 'Superadmin' : 'Manager',
        password: password,
        lastLogin: 'Just now'
      };

      Swal.fire({
        toast: true,
        position: 'top-end',
        icon: 'success',
        title: 'Access Granted',
        text: `Welcome back, ${activeAdmin.name}`,
        showConfirmButton: false,
        timer: 2000
      });

      onLoginSuccess(activeAdmin);
    } else {
      Swal.fire({
        icon: 'error',
        title: t('loginErrorTitle'),
        text: t('loginErrorText'),
        confirmButtonColor: '#ba1a1a'
      });
    }
  };

  return (
    <section className="max-w-md mx-auto animate-in fade-in duration-300">
      <div className="glass-panel p-8 sm:p-10 rounded-[2rem] border border-slate-200 shadow-2xl text-center relative">
        <div className="w-20 h-20 bg-[#0f2c59]/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-[#0f2c59]/20 shadow-inner">
          <ShieldCheck className="w-10 h-10 text-[#0f2c59]" />
        </div>

        <h2 className="text-2xl sm:text-3xl font-extrabold text-[#0f2c59]">{t('adminPortalTitle')}</h2>
        <p className="text-sm text-slate-500 mt-1 mb-6 font-medium">{t('adminPortalSubtitle')}</p>

        <form onSubmit={handleLogin} className="space-y-4 text-left">
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-[#0f2c59] uppercase tracking-wider">
              {t('usernameLabel')}
            </label>
            <div className="relative">
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="ระบุชื่อผู้ใช้งาน"
                className="w-full bg-white/90 border-2 border-slate-200 rounded-xl p-3.5 pl-10 focus:ring-2 focus:ring-[#0f2c59] focus:bg-white focus:border-transparent outline-none transition-all font-semibold text-slate-800"
              />
              <User className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-[#0f2c59] uppercase tracking-wider">
              {t('passwordLabel')}
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="ระบุรหัสผ่าน"
                className="w-full bg-white/90 border-2 border-slate-200 rounded-xl p-3.5 pl-10 pr-11 focus:ring-2 focus:ring-[#0f2c59] focus:bg-white focus:border-transparent outline-none transition-all font-semibold text-slate-800"
              />
              <Lock className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors p-1"
                title={showPassword ? 'ซ่อนรหัสผ่าน' : 'แสดงรหัสผ่าน'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="w-full btn-sanko text-white font-extrabold py-3.5 rounded-xl text-base flex items-center justify-center gap-2 mt-4 cursor-pointer shadow-lg"
          >
            <span>{t('signInBtn')}</span>
            <ArrowRight className="w-5 h-5" />
          </button>
        </form>
      </div>
    </section>
  );
};


