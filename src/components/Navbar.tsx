import React, { useState } from 'react';
import { NavView } from '../types';
import { Bus, UserCheck, ShieldCheck, Menu, X, BookOpen, Globe } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

interface NavbarProps {
  currentView: NavView;
  setCurrentView: (view: NavView) => void;
  isAdminLoggedIn: boolean;
  onLogoutAdmin: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentView,
  setCurrentView,
  isAdminLoggedIn,
  onLogoutAdmin
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { language, toggleLanguage, t } = useLanguage();

  const logoUrl = "https://lh3.googleusercontent.com/aida-public/AB6AXuAWvd45WhNQDMhp5LmY0iVdIG7EcRAlgLP19o1NCcqEw4aDoOXHfAPo57tSoVRVXdHOcFzyCqx5IQL0SlRYTCuOA5I7MpNfSqS_kau931o8nQQEeZRnhOxDjFVYciredLS8hxQClbYqbAy5xAXZymLmkbclNJS7Jur9oOwdiujlBGb456xD7Ktf04eIZgLpzm5_XHES8TqjbYrxvR3vkG8Upw1rSI8T0o-WcvLmQj0NutNa-kx1W0sC2hSE0kDfVnfjSw";

  return (
    <nav className="fixed top-0 left-0 w-full z-50 flex justify-between items-center px-4 sm:px-8 py-3.5 glass-panel border-b border-white/30 shadow-md shadow-emerald-950/5">
      {/* Brand Logo & Name */}
      <div 
        className="flex items-center gap-3 cursor-pointer group"
        onClick={() => setCurrentView('employee-booking')}
      >
        <div className="relative flex items-center justify-center p-1.5 bg-[#0f2c59]/10 rounded-xl group-hover:bg-[#0f2c59]/20 transition-all">
          <img 
            src={logoUrl} 
            alt="SANKO Logo" 
            className="h-9 sm:h-10 w-auto object-contain"
            onError={(e) => {
              (e.target as HTMLElement).style.display = 'none';
              const parent = (e.target as HTMLElement).parentElement;
              if (parent) {
                parent.innerHTML = '<span class="text-[#0f2c59] font-black text-xl tracking-tighter flex items-center gap-1"><svg class="w-6 h-6 text-[#c8102e]" fill="currentColor" viewBox="0 0 24 24"><path d="M4 16c0 .88.39 1.67 1 2.22V20c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h8v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1.78c.61-.55 1-1.34 1-2.22V6c0-3.5-3.58-4-8-4s-8 .5-8 4v10zm3.5-9c.83 0 1.5.67 1.5 1.5S8.33 10 7.5 10 6 9.33 6 8.5 6.67 7 7.5 7zm9 0c.83 0 1.5.67 1.5 1.5s-.67 1.5-1.5 1.5-1.5-.67-1.5-1.5.67-1.5 1.5-1.5zm-11 7v-3.5h13V15H5.5z"/></svg>SANKO</span>';
              }
            }}
          />
        </div>
        <div className="flex flex-col">
          <span className="font-bold text-lg sm:text-xl text-[#0f2c59] tracking-tight leading-tight group-hover:text-[#c8102e] transition-colors">
            {t('appName')}
          </span>
          <span className="text-[11px] sm:text-xs text-slate-500 uppercase tracking-widest font-semibold">
            {t('companyName')}
          </span>
        </div>
      </div>

      {/* Desktop Navigation Links & Controls */}
      <div className="hidden lg:flex items-center gap-5 xl:gap-7">
        <button
          onClick={() => setCurrentView('employee-booking')}
          className={`font-semibold text-sm transition-all duration-200 py-1 border-b-2 flex items-center gap-1.5 cursor-pointer ${
            currentView === 'employee-booking'
              ? 'text-[#0f2c59] border-[#0f2c59] font-extrabold'
              : 'text-slate-600 border-transparent hover:text-[#0f2c59]'
          }`}
        >
          <UserCheck className="w-4 h-4" />
          {t('employeeBooking')}
        </button>

        <button
          onClick={() => setCurrentView('user-manual')}
          className={`font-semibold text-sm transition-all duration-200 py-1 border-b-2 flex items-center gap-1.5 cursor-pointer ${
            currentView === 'user-manual'
              ? 'text-[#0f2c59] border-[#0f2c59] font-extrabold'
              : 'text-slate-600 border-transparent hover:text-[#0f2c59]'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          {t('userManual')}
        </button>

        {isAdminLoggedIn ? (
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setCurrentView('admin-dashboard')}
              className={`font-semibold text-sm transition-all duration-200 py-1 border-b-2 flex items-center gap-1.5 cursor-pointer ${
                currentView === 'admin-dashboard'
                  ? 'text-[#0f2c59] border-[#0f2c59] font-extrabold'
                  : 'text-slate-600 border-transparent hover:text-[#0f2c59]'
              }`}
            >
              <ShieldCheck className="w-4 h-4" />
              {t('adminDashboard')}
            </button>
            <button
              onClick={onLogoutAdmin}
              className="text-xs font-bold text-red-600 hover:text-red-800 bg-red-50 hover:bg-red-100 px-2.5 py-1 rounded-md border border-red-200 transition-colors cursor-pointer"
            >
              {t('signOut')}
            </button>
          </div>
        ) : (
          <button
            onClick={() => setCurrentView('admin-login')}
            className={`font-semibold text-sm transition-all duration-200 py-1 border-b-2 flex items-center gap-1.5 cursor-pointer ${
              currentView === 'admin-login'
                ? 'text-[#0f2c59] border-[#0f2c59] font-extrabold'
                : 'text-slate-600 border-transparent hover:text-[#0f2c59]'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            {t('adminLogin')}
          </button>
        )}

        {/* Live Status Badge */}
        <div className="flex items-center gap-2 bg-slate-100 px-3 py-1.5 rounded-full border border-slate-200 shadow-2xs">
          <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse shadow-2xs shadow-emerald-500/50"></span>
          <span className="text-xs font-semibold text-slate-700">{t('liveData')}</span>
        </div>

        {/* Language Switch Button */}
        <button
          onClick={toggleLanguage}
          title="Switch Language / เปลี่ยนภาษา"
          className="flex items-center gap-1.5 bg-[#0f2c59] text-white hover:bg-[#1b365d] px-3 py-1.5 rounded-xl font-bold text-xs transition-all shadow-xs border border-[#0f2c59]/20 cursor-pointer"
        >
          <Globe className="w-3.5 h-3.5" />
          <span className="tracking-wide">
            {language === 'th' ? '🇹🇭 TH | EN' : '🇬🇧 EN | TH'}
          </span>
        </button>
      </div>

      {/* Mobile Right Controls */}
      <div className="flex lg:hidden items-center gap-2">
        {/* Mobile Language Button */}
        <button
          onClick={toggleLanguage}
          className="flex items-center gap-1 bg-[#0f2c59] text-white px-2.5 py-1 rounded-lg font-bold text-xs shadow-xs cursor-pointer"
        >
          <Globe className="w-3 h-3" />
          <span>{language.toUpperCase()}</span>
        </button>

        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 text-[#0f2c59] hover:bg-black/5 rounded-lg transition-colors cursor-pointer"
          aria-label="Toggle menu"
        >
          {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="absolute top-full left-0 w-full bg-white/95 backdrop-blur-xl border-b border-slate-200 p-4 shadow-xl flex flex-col gap-3 lg:hidden animate-in slide-in-from-top-2 duration-200">
          <button
            onClick={() => {
              setCurrentView('employee-booking');
              setMobileMenuOpen(false);
            }}
            className={`flex items-center gap-3 p-3 rounded-xl font-semibold text-sm text-left transition-colors cursor-pointer ${
              currentView === 'employee-booking'
                ? 'bg-[#0f2c59]/10 text-[#0f2c59] font-extrabold'
                : 'text-slate-700 hover:bg-slate-100'
            }`}
          >
            <UserCheck className="w-5 h-5 text-[#0f2c59]" />
            {t('employeeBooking')}
          </button>

          <button
            onClick={() => {
              setCurrentView('user-manual');
              setMobileMenuOpen(false);
            }}
            className={`flex items-center gap-3 p-3 rounded-xl font-semibold text-sm text-left transition-colors cursor-pointer ${
              currentView === 'user-manual'
                ? 'bg-[#0f2c59]/10 text-[#0f2c59] font-extrabold'
                : 'text-slate-700 hover:bg-slate-100'
            }`}
          >
            <BookOpen className="w-5 h-5 text-[#0f2c59]" />
            {t('userManual')}
          </button>

          {isAdminLoggedIn ? (
            <>
              <button
                onClick={() => {
                  setCurrentView('admin-dashboard');
                  setMobileMenuOpen(false);
                }}
                className={`flex items-center gap-3 p-3 rounded-xl font-semibold text-sm text-left transition-colors cursor-pointer ${
                  currentView === 'admin-dashboard'
                    ? 'bg-[#0f2c59]/10 text-[#0f2c59] font-extrabold'
                    : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                <ShieldCheck className="w-5 h-5 text-[#0f2c59]" />
                {t('adminDashboard')}
              </button>
              <button
                onClick={() => {
                  onLogoutAdmin();
                  setMobileMenuOpen(false);
                }}
                className="flex items-center gap-3 p-3 rounded-xl font-semibold text-sm text-left text-red-600 bg-red-50 hover:bg-red-100 transition-colors cursor-pointer"
              >
                {t('signOut')}
              </button>
            </>
          ) : (
            <button
              onClick={() => {
                setCurrentView('admin-login');
                setMobileMenuOpen(false);
              }}
              className={`flex items-center gap-3 p-3 rounded-xl font-semibold text-sm text-left transition-colors cursor-pointer ${
                currentView === 'admin-login'
                  ? 'bg-[#0f2c59]/10 text-[#0f2c59] font-extrabold'
                  : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              <ShieldCheck className="w-5 h-5 text-[#0f2c59]" />
              {t('adminLogin')}
            </button>
          )}

          <div className="pt-2 border-t border-slate-200 flex justify-between items-center">
            <span className="text-xs font-semibold text-slate-600">Language / ภาษา</span>
            <button
              onClick={toggleLanguage}
              className="flex items-center gap-2 bg-[#0f2c59] text-white px-3 py-1.5 rounded-lg font-bold text-xs cursor-pointer"
            >
              <Globe className="w-3.5 h-3.5" />
              <span>{language === 'th' ? '🇹🇭 ภาษาไทย' : '🇬🇧 English'}</span>
            </button>
          </div>
        </div>
      )}
    </nav>
  );
};

