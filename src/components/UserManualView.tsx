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

          {/* Admin Roles & Permission Matrix Card */}
          <div className="mt-8 pt-6 border-t border-slate-200 space-y-4">
            <div className="flex items-center gap-2.5 text-[#0f2c59]">
              <div className="p-2 bg-[#0f2c59]/10 rounded-xl text-[#0f2c59]">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-extrabold text-lg text-[#0f2c59]">คู่มือระดับสิทธิ์และการใช้งาน Admin (Admin Roles Guide)</h3>
                <p className="text-xs text-slate-500 font-medium">คำอธิบายขอบเขตอำนาจหน้าที่ของแต่ละระดับสิทธิ์ผู้ดูแลระบบ</p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 text-xs">
              {/* Role 1: Superadmin */}
              <div className="p-4 bg-amber-50/80 border border-amber-200 rounded-2xl space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                    <h4 className="font-extrabold text-slate-900 text-sm">1. Superadmin (ผู้ดูแลระบบสูงสุด)</h4>
                  </div>
                  <span className="px-2.5 py-0.5 bg-amber-100 text-amber-900 border border-amber-300 font-extrabold rounded-full text-[10px]">
                    Full Access (สิทธิ์สูงสุด)
                  </span>
                </div>
                <p className="text-slate-700 leading-relaxed font-medium">
                  • <strong>เหมาะสำหรับ:</strong> ฝ่าย IT / ผู้จัดการฝ่ายบุคคล / ผู้บริหารสูงสุดของระบบ
                </p>
                <div className="bg-white/80 p-2.5 rounded-xl border border-amber-200/60 space-y-1 text-slate-600">
                  <p>✔ <strong>การจัดการผู้ดูแล:</strong> สามารถเพิ่ม แก้ไข และลบบัญชีผู้ดูแลระบบ (Admin) คนอื่นๆ ได้</p>
                  <p>✔ <strong>การตั้งค่าระบบ:</strong> แก้ไขข้อความป้ายประกาศแจ้งเตือนหน้าแรก (System Notice)</p>
                  <p>✔ <strong>สิทธิ์ทุกอย่าง:</strong> จัดการสายรถ, พนักงาน, การจอง และออกรายงานสรุปได้ครบถ้วน</p>
                </div>
              </div>

              {/* Role 2: Transport Manager */}
              <div className="p-4 bg-emerald-50/80 border border-emerald-200 rounded-2xl space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-600"></span>
                    <h4 className="font-extrabold text-slate-900 text-sm">2. Transport Manager (ผู้จัดการสายรถรับส่ง)</h4>
                  </div>
                  <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-900 border border-emerald-300 font-extrabold rounded-full text-[10px]">
                    Operation Admin
                  </span>
                </div>
                <p className="text-slate-700 leading-relaxed font-medium">
                  • <strong>เหมาะสำหรับ:</strong> เจ้าหน้าที่บริหารรถรับส่ง / ฝ่ายจัดซื้อ-ขนส่ง / Admin ประจำโรงงาน
                </p>
                <div className="bg-white/80 p-2.5 rounded-xl border border-emerald-200/60 space-y-1 text-slate-600">
                  <p>✔ <strong>สายรถรับส่ง:</strong> เพิ่ม, แก้ไขข้อมูล (คนขับ/ทะเบียน/รอบเวลา/ต้นทาง-ปลายทาง), เปิด/ปิด และลบสายรถ</p>
                  <p>✔ <strong>การจองพนักงาน:</strong> ตรวจสอบรายชื่อผู้จองรถ และยกเลิกรายการจองของพนักงานได้ทันที</p>
                  <p>✔ <strong>ข้อมูลพนักงาน:</strong> เพิ่ม/ลบ/อัปเดตข้อมูลพนักงานในระบบ</p>
                  <p>✔ <strong>รายงาน:</strong> พิมพ์รายงานใบนัดขึ้นรถ (Passenger Manifest) และ Export รายงานการจอง</p>
                </div>
              </div>

              {/* Role 3: Shift Coordinator */}
              <div className="p-4 bg-blue-50/80 border border-blue-200 rounded-2xl space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-600"></span>
                    <h4 className="font-extrabold text-slate-900 text-sm">3. Shift Coordinator (ผู้ประสานงานประจำกะ)</h4>
                  </div>
                  <span className="px-2.5 py-0.5 bg-blue-100 text-blue-900 border border-blue-300 font-extrabold rounded-full text-[10px]">
                    Shift Supervisor
                  </span>
                </div>
                <p className="text-slate-700 leading-relaxed font-medium">
                  • <strong>เหมาะสำหรับ:</strong> หัวหน้ากะ / Supervisor / ผู้ตรวจเช็กรถประจำหน้างาน
                </p>
                <div className="bg-white/80 p-2.5 rounded-xl border border-blue-200/60 space-y-1 text-slate-600">
                  <p>✔ <strong>เช็คชื่อพนักงาน:</strong> ตรวจสอบยอดพนักงานจองรถประจำกะกลางวัน / กะกลางคืน</p>
                  <p>✔ <strong>ยกเลิกการจองฉุกเฉิน:</strong> ช่วยกดลบหรือยกเลิกการจองให้พนักงานกรณีแจ้งลากิจ/เปลี่ยนกะด่วน</p>
                  <p>✔ <strong>พิมพ์ตั๋วและใบเช็คชื่อ:</strong> ออกพิมพ์เอกสารตรวจสอบสำหรับคนขับรถ</p>
                </div>
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
              <h3 className="font-bold text-lg text-white">Contact Support / ติดต่อฝ่ายสนับสนุน</h3>
            </div>
            <p className="text-sm font-semibold text-amber-300">
              ฝ่ายไอที และแผนกบุคคล
            </p>
            <div className="space-y-1.5 text-xs text-slate-200">
              <p>📞 <strong>Phone Hotline:</strong> 035-746-488 Ext. 208</p>
              <p>📧 <strong>Email:</strong> <a href="mailto:supawadee@thaisanko.co.th" className="text-cyan-300 hover:underline">supawadee@thaisanko.co.th</a></p>
              <p>🏢 <strong>Office:</strong> 488 หมู่ 4 ซอย E1/3 ตำบล อุทัย อำเภออุทัย จังหวัดพระนครศรีอยุธยา 13210</p>
            </div>
            <div className="pt-2">
              <a
                href="tel:035746488"
                className="inline-flex items-center gap-2 text-white font-bold text-sm bg-white/10 hover:bg-white/20 px-4 py-2 rounded-xl border border-white/20 transition-all"
              >
                <PhoneCall className="w-4 h-4 text-emerald-400" />
                035-746-488 Ext. 208
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

