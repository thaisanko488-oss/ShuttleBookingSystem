import React, { useState } from 'react';
import { X, ShieldAlert, PhoneCall, FileText } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export const Footer: React.FC = () => {
  const [modalContent, setModalContent] = useState<'privacy' | 'support' | 'terms' | null>(null);
  const { t } = useLanguage();

  return (
    <>
      <footer className="w-full py-6 px-4 sm:px-8 flex flex-col md:flex-row justify-between items-center opacity-85 border-t border-slate-200 mt-12 bg-white/40 backdrop-blur-md">
        <p className="text-xs sm:text-sm text-slate-700 font-medium">
          {t('footerCopyright')}
        </p>
        <div className="flex gap-6 mt-4 md:mt-0">
          <button
            onClick={() => setModalContent('privacy')}
            className="text-xs sm:text-sm text-slate-500 hover:text-[#0f2c59] transition-colors font-medium hover:underline cursor-pointer"
          >
            Privacy Policy
          </button>
          <button
            onClick={() => setModalContent('support')}
            className="text-xs sm:text-sm text-slate-500 hover:text-[#0f2c59] transition-colors font-medium hover:underline cursor-pointer"
          >
            Contact Support
          </button>
          <button
            onClick={() => setModalContent('terms')}
            className="text-xs sm:text-sm text-slate-500 hover:text-[#0f2c59] transition-colors font-medium hover:underline cursor-pointer"
          >
            Terms of Service
          </button>
        </div>
      </footer>

      {/* Info Modals */}
      {modalContent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="glass-panel bg-white/95 p-6 sm:p-8 rounded-2xl max-w-lg w-full shadow-2xl relative border border-slate-200">
            <button
              onClick={() => setModalContent(null)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            {modalContent === 'privacy' && (
              <div className="space-y-4">
                <div className="flex items-center gap-3 text-[#0f2c59]">
                  <ShieldAlert className="w-7 h-7" />
                  <h3 className="font-bold text-xl text-[#0f2c59]">Privacy Policy / นโยบายความเป็นส่วนตัว</h3>
                </div>
                <p className="text-sm text-slate-700 leading-relaxed">
                  Thai Sanko Co., Ltd. collects employee IDs and shuttle reservation information strictly for the internal administration of corporate shuttle buses, passenger count optimization, and transportation safety.
                </p>
                <ul className="text-xs text-slate-600 space-y-1.5 list-disc pl-5">
                  <li>Data is retained securely within Firebase Cloud Database.</li>
                  <li>Employee information is protected under corporate HR data protection rules.</li>
                  <li>No personal reservation details are shared with external third parties.</li>
                </ul>
              </div>
            )}

            {modalContent === 'support' && (
              <div className="space-y-4">
                <div className="flex items-center gap-3 text-[#0f2c59]">
                  <PhoneCall className="w-7 h-7" />
                  <h3 className="font-bold text-xl text-[#0f2c59]">Contact Support / ติดต่อฝ่ายสนับสนุน</h3>
                </div>
                <p className="text-sm text-slate-700">
                  If you encounter any issues with shuttle reservations or employee ID validation, please reach out to:
                </p>
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2 text-sm text-slate-800">
                  <p className="font-bold">ฝ่ายไอที และแผนกดูแลรถรับส่งพนักงาน (IT & Transport Dept)</p>
                  <p>📞 <strong>Phone Hotline:</strong> 035-746-488 / 02-XXX-XXXX</p>
                  <p>📧 <strong>Email:</strong> support@thaisanko.co.th</p>
                  <p>🏢 <strong>Office:</strong> Admin Building - Floor 2 (Thai Sanko Co., Ltd.)</p>
                </div>
              </div>
            )}

            {modalContent === 'terms' && (
              <div className="space-y-4">
                <div className="flex items-center gap-3 text-[#0f2c59]">
                  <FileText className="w-7 h-7" />
                  <h3 className="font-bold text-xl text-[#0f2c59]">Terms of Service / เงื่อนไขการใช้งาน</h3>
                </div>
                <p className="text-sm text-slate-700 leading-relaxed">
                  By reserving a seat on the Thai Sanko shuttle bus system, employees agree to the following terms:
                </p>
                <ol className="text-xs text-slate-600 space-y-2 list-decimal pl-5">
                  <li>Reservations should be submitted at least 1 hour prior to departure time.</li>
                  <li>Please present your physical Employee ID Card or Digital QR Shuttle Pass to the bus driver prior to boarding.</li>
                  <li>If you need to cancel your trip, please inform the supervisor or transport department promptly.</li>
                </ol>
              </div>
            )}

            <div className="mt-6 text-right">
              <button
                onClick={() => setModalContent(null)}
                className="btn-sanko text-white font-bold px-6 py-2 rounded-xl text-sm cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

