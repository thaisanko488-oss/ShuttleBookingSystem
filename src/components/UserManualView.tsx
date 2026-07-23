import React from 'react';
import { NavView } from '../types';
import { ArrowLeft, HelpCircle, PhoneCall, CheckCircle, Clock, Bus, UserCheck, Calendar, ShieldAlert } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

interface UserManualViewProps {
  onBackToBooking: () => void;
}

export const UserManualView: React.FC<UserManualViewProps> = ({ onBackToBooking }) => {
  const { t } = useLanguage();

  return (
    <section className="max-w-5xl mx-auto animate-in fade-in duration-300">
      {/* Header Banner */}
      <div className="text-center mb-8">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-[#0f2c59] tracking-tight">
          {t('manualTitle')}
        </h1>
        <p className="text-sm sm:text-base text-slate-500 mt-2 font-medium">
          {t('manualSubtitle')}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: How to Book Steps (7 Cols) */}
        <div className="lg:col-span-7 glass-panel p-6 sm:p-8 rounded-[2rem] border border-slate-200 shadow-xl space-y-6">
          <div className="flex items-center gap-3 border-b border-slate-200 pb-4">
            <div className="p-2.5 bg-[#0f2c59]/10 text-[#0f2c59] rounded-xl">
              <Bus className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-[#0f2c59]">
                {t('manualTitle')}
              </h2>
              <p className="text-xs text-slate-500">{t('manualSubtitle')}</p>
            </div>
          </div>

          <div className="space-y-4">
            {/* Step 1 */}
            <div className="flex items-start gap-4 p-4 rounded-2xl bg-white/80 hover:bg-white transition-all border border-slate-200 shadow-2xs">
              <div className="w-10 h-10 rounded-2xl bg-slate-100 text-[#0f2c59] font-black text-lg flex items-center justify-center shrink-0 border border-slate-200">
                1
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <UserCheck className="w-4 h-4 text-[#0f2c59]" />
                  <h3 className="font-bold text-slate-800 text-base">{t('step1Title')}</h3>
                </div>
                <p className="text-xs sm:text-sm text-slate-600 mt-1 leading-relaxed">
                  {t('step1Desc')}
                </p>
              </div>
            </div>

            {/* Step 2 */}
            <div className="flex items-start gap-4 p-4 rounded-2xl bg-white/80 hover:bg-white transition-all border border-slate-200 shadow-2xs">
              <div className="w-10 h-10 rounded-2xl bg-slate-100 text-[#0f2c59] font-black text-lg flex items-center justify-center shrink-0 border border-slate-200">
                2
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-[#0f2c59]" />
                  <h3 className="font-bold text-slate-800 text-base">{t('step2Title')}</h3>
                </div>
                <p className="text-xs sm:text-sm text-slate-600 mt-1 leading-relaxed">
                  {t('step2Desc')}
                </p>
              </div>
            </div>

            {/* Step 3 */}
            <div className="flex items-start gap-4 p-4 rounded-2xl bg-white/80 hover:bg-white transition-all border border-slate-200 shadow-2xs">
              <div className="w-10 h-10 rounded-2xl bg-slate-100 text-[#0f2c59] font-black text-lg flex items-center justify-center shrink-0 border border-slate-200">
                3
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-[#0f2c59]" />
                  <h3 className="font-bold text-slate-800 text-base">{t('step3Title')}</h3>
                </div>
                <p className="text-xs sm:text-sm text-slate-600 mt-1 leading-relaxed">
                  {t('step3Desc')}
                </p>
              </div>
            </div>

            {/* Step 4 */}
            <div className="flex items-start gap-4 p-4 rounded-2xl bg-white/80 hover:bg-white transition-all border border-slate-200 shadow-2xs">
              <div className="w-10 h-10 rounded-2xl bg-slate-100 text-[#0f2c59] font-black text-lg flex items-center justify-center shrink-0 border border-slate-200">
                4
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-[#0f2c59]" />
                  <h3 className="font-bold text-slate-800 text-base">{t('step4Title')}</h3>
                </div>
                <p className="text-xs sm:text-sm text-slate-600 mt-1 leading-relaxed">
                  {t('step4Desc')}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: FAQs, Image & Contact Card (5 Cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* FAQs Box */}
          <div className="glass-panel p-6 rounded-[2rem] border border-slate-200 shadow-xl space-y-4">
            <div className="flex items-center gap-2.5 text-[#0f2c59]">
              <ShieldAlert className="w-5 h-5 text-[#0f2c59]" />
              <h3 className="font-bold text-lg">{t('faqTitle')}</h3>
            </div>
            <div className="space-y-3 text-xs sm:text-sm text-slate-600">
              <div className="p-3 bg-white/80 rounded-xl border border-slate-200">
                <p className="font-bold text-slate-800 mb-1">❓ {t('faq1Q')}</p>
                <p className="text-xs text-slate-600">{t('faq1A')}</p>
              </div>
              <div className="p-3 bg-white/80 rounded-xl border border-slate-200">
                <p className="font-bold text-slate-800 mb-1">❓ {t('faq2Q')}</p>
                <p className="text-xs text-slate-600">{t('faq2A')}</p>
              </div>
            </div>

            {/* Visual Bus Banner */}
            <div className="rounded-2xl overflow-hidden border border-slate-200 shadow-2xs mt-4 relative bg-slate-100">
              <img
                src="https://images.unsplash.com/photo-1570125909232-eb263c188f7e?q=80&w=800&auto=format&fit=crop"
                alt="Thai Sanko Corporate Shuttle Bus"
                className="w-full h-40 object-cover hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-transparent to-transparent flex items-end p-3">
                <span className="text-white text-xs font-semibold drop-shadow-2xs">
                  🚌 Thai Sanko Corporate Bus Fleet
                </span>
              </div>
            </div>
          </div>

          {/* Navigation Action Button */}
          <button
            onClick={onBackToBooking}
            className="w-full btn-sanko text-white font-bold py-3.5 px-6 rounded-2xl text-base flex items-center justify-center gap-2 shadow-lg hover:shadow-[#0f2c59]/20 transition-all cursor-pointer"
          >
            <ArrowLeft className="w-5 h-5" />
            {t('backToBooking')}
          </button>

          {/* Need Help Card */}
          <div className="bg-[#0f2c59] text-white p-6 rounded-[2rem] shadow-xl space-y-3 border border-[#1b365d]">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/10 rounded-xl text-white">
                <HelpCircle className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-lg text-white">Support Hotline</h3>
            </div>
            <p className="text-xs sm:text-sm text-slate-200 leading-relaxed">
              Thai Sanko Transport & IT Support Department
            </p>
            <div className="pt-2">
              <a
                href="tel:035746488"
                className="inline-flex items-center gap-2 text-white font-bold text-base bg-white/10 hover:bg-white/20 px-4 py-2 rounded-xl border border-white/20 transition-all"
              >
                <PhoneCall className="w-4 h-4 text-red-400" />
                035-746-488
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

