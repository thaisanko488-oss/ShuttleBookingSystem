import React, { useState, useEffect } from 'react';
import { BusRoute } from '../types';
import { X, Clock, Plus, Trash2, CheckCircle2, AlertCircle, Sun, Moon, Sparkles, Layers } from 'lucide-react';
import Swal from 'sweetalert2';

interface DepartureTimeModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetRoute: BusRoute | null; // null if managing factory-wide (all routes)
  allRoutes: BusRoute[];
  onSaveTimes: (params: {
    targetRouteId?: string;
    dayTimes: string[];
    nightTimes: string[];
    applyToAll: boolean;
  }) => Promise<void>;
}

const COMMON_DAY_PRESETS = ['17:20', '18:00', '18:30', '19:30', '20:10', '21:00', '21:30'];
const COMMON_NIGHT_PRESETS = ['05:30', '06:30', '07:30', '08:10', '08:30', '09:00'];

export const DepartureTimeModal: React.FC<DepartureTimeModalProps> = ({
  isOpen,
  onClose,
  targetRoute,
  allRoutes,
  onSaveTimes
}) => {
  const [dayTimes, setDayTimes] = useState<string[]>(['17:20', '20:10']);
  const [nightTimes, setNightTimes] = useState<string[]>(['08:10']);
  const [newDayInput, setNewDayInput] = useState('17:20');
  const [newNightInput, setNewNightInput] = useState('08:10');
  const [applyToAll, setApplyToAll] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'both' | 'day' | 'night'>('both');

  useEffect(() => {
    if (isOpen) {
      if (targetRoute) {
        const d = targetRoute.departureTimes?.Day || [];
        const n = targetRoute.departureTimes?.Night || [];
        setDayTimes(d.length > 0 ? [...d] : ['17:20', '20:10']);
        setNightTimes(n.length > 0 ? [...n] : ['08:10']);
        setApplyToAll(false);
      } else {
        // Collect most frequent / default times from all routes
        const daySet = new Set<string>();
        const nightSet = new Set<string>();
        allRoutes.forEach(r => {
          (r.departureTimes?.Day || []).forEach(t => t && daySet.add(t));
          (r.departureTimes?.Night || []).forEach(t => t && nightSet.add(t));
        });
        setDayTimes(daySet.size > 0 ? Array.from(daySet).sort() : ['17:20', '20:10']);
        setNightTimes(nightSet.size > 0 ? Array.from(nightSet).sort() : ['08:10']);
        setApplyToAll(true);
      }
      setNewDayInput('');
      setNewNightInput('');
      setIsSaving(false);
    }
  }, [isOpen, targetRoute, allRoutes]);

  if (!isOpen) return null;

  // Validate time format (HH:mm)
  const isValidTime = (time: string): boolean => {
    return /^([01]\d|2[0-3]):([0-5]\d)$/.test(time.trim());
  };

  // Add time for Day Shift
  const handleAddDayTime = (timeToAdd?: string) => {
    const time = (timeToAdd || newDayInput).trim();
    if (!time) return;
    if (!isValidTime(time)) {
      Swal.fire({
        icon: 'warning',
        title: 'รูปแบบเวลาไม่ถูกต้อง',
        text: 'กรุณาระบุเวลาในรูปแบบ HH:mm (เช่น 17:20 หรือ 20:10)',
        timer: 2500
      });
      return;
    }
    if (dayTimes.includes(time)) {
      Swal.fire({
        toast: true,
        position: 'top-end',
        icon: 'info',
        title: `รอบเวลา ${time} มีอยู่ในรายการแล้ว`,
        showConfirmButton: false,
        timer: 1500
      });
      return;
    }
    setDayTimes(prev => [...prev, time].sort((a, b) => a.localeCompare(b)));
    if (!timeToAdd) setNewDayInput('');
  };

  // Remove time for Day Shift
  const handleRemoveDayTime = (timeToRemove: string) => {
    setDayTimes(prev => prev.filter(t => t !== timeToRemove));
  };

  // Add time for Night Shift
  const handleAddNightTime = (timeToAdd?: string) => {
    const time = (timeToAdd || newNightInput).trim();
    if (!time) return;
    if (!isValidTime(time)) {
      Swal.fire({
        icon: 'warning',
        title: 'รูปแบบเวลาไม่ถูกต้อง',
        text: 'กรุณาระบุเวลาในรูปแบบ HH:mm (เช่น 08:10 หรือ 06:30)',
        timer: 2500
      });
      return;
    }
    if (nightTimes.includes(time)) {
      Swal.fire({
        toast: true,
        position: 'top-end',
        icon: 'info',
        title: `รอบเวลา ${time} มีอยู่ในรายการแล้ว`,
        showConfirmButton: false,
        timer: 1500
      });
      return;
    }
    setNightTimes(prev => [...prev, time].sort((a, b) => a.localeCompare(b)));
    if (!timeToAdd) setNewNightInput('');
  };

  // Remove time for Night Shift
  const handleRemoveNightTime = (timeToRemove: string) => {
    setNightTimes(prev => prev.filter(t => t !== timeToRemove));
  };

  // Handle Save
  const handleSave = async () => {
    if (dayTimes.length === 0 && nightTimes.length === 0) {
      Swal.fire({
        icon: 'error',
        title: 'กรุณาระบุรอบเวลา',
        text: 'ต้องมีรอบเวลาเดินทางอย่างน้อย 1 รอบเวลาในระบบ'
      });
      return;
    }

    try {
      setIsSaving(true);
      await onSaveTimes({
        targetRouteId: targetRoute?.id,
        dayTimes,
        nightTimes,
        applyToAll
      });
      onClose();
    } catch (err) {
      console.error(err);
      Swal.fire('Error', 'ไม่สามารถบันทึกรอบเวลาได้ โปรดลองอีกครั้ง', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="p-5 sm:p-6 bg-gradient-to-r from-[#0f2c59] to-[#1e4976] text-white flex justify-between items-start shrink-0">
          <div>
            <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-white/15 text-emerald-300 text-xs font-bold mb-1.5 backdrop-blur-xs">
              <Clock className="w-3.5 h-3.5" />
              <span>การจัดการรอบเวลาเดินทาง (Departure Time Schedules)</span>
            </div>
            <h3 className="text-xl sm:text-2xl font-extrabold tracking-tight">
              {targetRoute ? (
                <>รอบเวลาของสาย: <span className="text-emerald-300">{targetRoute.code} - {targetRoute.name}</span></>
              ) : (
                'ตั้งค่ารอบเวลารถรับส่งสำหรับทุกสายรถ'
              )}
            </h3>
            <p className="text-xs text-slate-200 mt-1">
              {targetRoute
                ? `กำหนดรอบเวลาออกเดินทางเฉพาะสายนี้ หรือเลือกอัปเดตไปยังทุกสายรถพร้อมกัน`
                : `กำหนดรอบเวลาออกเดินทางมาตรฐานสำหรับสายรถรับส่งทั้งหมดในระบบ (${allRoutes.length} สาย)`
              }
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-white/70 hover:text-white p-1 rounded-full hover:bg-white/10 transition-colors cursor-pointer"
            title="ปิดหน้าต่าง"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 overflow-y-auto custom-scrollbar space-y-6 flex-1 bg-slate-50/50">
          {/* Quick Tab Switcher for mobile or preference */}
          <div className="flex sm:hidden p-1 bg-slate-200 rounded-2xl text-xs font-bold">
            <button
              onClick={() => setActiveTab('both')}
              className={`flex-1 py-1.5 rounded-xl transition-all cursor-pointer ${
                activeTab === 'both' ? 'bg-white text-slate-800 shadow-xs' : 'text-slate-600'
              }`}
            >
              ทั้งหมด
            </button>
            <button
              onClick={() => setActiveTab('day')}
              className={`flex-1 py-1.5 rounded-xl transition-all cursor-pointer ${
                activeTab === 'day' ? 'bg-amber-500 text-white shadow-xs' : 'text-slate-600'
              }`}
            >
              ☀️ กะเช้า ({dayTimes.length})
            </button>
            <button
              onClick={() => setActiveTab('night')}
              className={`flex-1 py-1.5 rounded-xl transition-all cursor-pointer ${
                activeTab === 'night' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600'
              }`}
            >
              🌙 กะดึก ({nightTimes.length})
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* 1. DAY SHIFT BOX */}
            {(activeTab === 'both' || activeTab === 'day') && (
              <div className="bg-white rounded-2xl p-4 sm:p-5 border border-amber-200 shadow-xs flex flex-col justify-between space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between border-b border-amber-100 pb-2.5">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
                        <Sun className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="font-extrabold text-sm text-slate-900">กะเช้า / กลางวัน (Day Shift)</h4>
                        <span className="text-[10px] text-slate-500 font-medium">รอบรถช่วงเย็น/เลิกงาน</span>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded-full text-[11px] font-extrabold bg-amber-50 text-amber-800 border border-amber-200">
                      {dayTimes.length} รอบ
                    </span>
                  </div>

                  {/* Active Times Chips */}
                  <div>
                    <label className="text-[11px] font-extrabold text-slate-600 uppercase tracking-wider block mb-1.5">
                      รอบเวลาที่เปิดให้บริการ:
                    </label>
                    {dayTimes.length > 0 ? (
                      <div className="flex flex-wrap gap-2 min-h-10 items-center p-2.5 bg-amber-50/50 rounded-xl border border-amber-100">
                        {dayTimes.map(time => (
                          <div
                            key={time}
                            className="group flex items-center gap-1.5 bg-white text-slate-800 font-mono font-extrabold text-xs px-3 py-1.5 rounded-xl border border-amber-200 shadow-2xs hover:border-amber-400 transition-all"
                          >
                            <Clock className="w-3.5 h-3.5 text-amber-600" />
                            <span>{time}</span>
                            <button
                              type="button"
                              onClick={() => handleRemoveDayTime(time)}
                              className="text-slate-400 hover:text-red-600 p-0.5 rounded-full hover:bg-red-50 transition-colors cursor-pointer"
                              title={`ลบรอบเวลา ${time}`}
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-3 bg-amber-50/50 rounded-xl border border-dashed border-amber-200 text-center text-xs text-amber-800 font-medium">
                        ยังไม่มีรอบเวลากะเช้า (คลิกเพิ่มเวลาด้านล่าง)
                      </div>
                    )}
                  </div>

                  {/* Quick Preset Buttons */}
                  <div>
                    <span className="text-[11px] font-semibold text-slate-500 block mb-1">
                      เลือกเวลารวดเร็ว (Presets):
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {COMMON_DAY_PRESETS.map(preset => {
                        const isAdded = dayTimes.includes(preset);
                        return (
                          <button
                            key={preset}
                            type="button"
                            onClick={() => handleAddDayTime(preset)}
                            className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                              isAdded
                                ? 'bg-amber-100 text-amber-800 border border-amber-300 opacity-60'
                                : 'bg-slate-100 hover:bg-amber-100 hover:text-amber-900 text-slate-700 border border-slate-200'
                            }`}
                            title={isAdded ? 'เวลานี้มีอยู่แล้ว' : `คลิกเพื่อเพิ่มรอบเวลา ${preset}`}
                          >
                            +{preset}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Add Custom Time Form */}
                <div className="pt-3 border-t border-slate-100 space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-700 block">
                    ระบุรอบเวลาใหม่ (HH:mm):
                  </label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <input
                        type="time"
                        value={newDayInput}
                        onChange={(e) => setNewDayInput(e.target.value)}
                        placeholder="17:20"
                        className="w-full bg-slate-50 border border-slate-300 rounded-xl py-2 px-3 pl-8 text-xs font-mono font-bold text-slate-800 outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white"
                      />
                      <Clock className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                    <button
                      type="button"
                      onClick={() => handleAddDayTime()}
                      className="bg-amber-500 hover:bg-amber-600 text-white px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1 shadow-2xs hover:shadow-xs transition-all cursor-pointer shrink-0"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>เพิ่มรอบ</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* 2. NIGHT SHIFT BOX */}
            {(activeTab === 'both' || activeTab === 'night') && (
              <div className="bg-white rounded-2xl p-4 sm:p-5 border border-indigo-200 shadow-xs flex flex-col justify-between space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between border-b border-indigo-100 pb-2.5">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center">
                        <Moon className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="font-extrabold text-sm text-slate-900">กะดึก / กลางคืน (Night Shift)</h4>
                        <span className="text-[10px] text-slate-500 font-medium">รอบรถช่วงเช้า/ออกกะดึก</span>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded-full text-[11px] font-extrabold bg-indigo-50 text-indigo-800 border border-indigo-200">
                      {nightTimes.length} รอบ
                    </span>
                  </div>

                  {/* Active Times Chips */}
                  <div>
                    <label className="text-[11px] font-extrabold text-slate-600 uppercase tracking-wider block mb-1.5">
                      รอบเวลาที่เปิดให้บริการ:
                    </label>
                    {nightTimes.length > 0 ? (
                      <div className="flex flex-wrap gap-2 min-h-10 items-center p-2.5 bg-indigo-50/50 rounded-xl border border-indigo-100">
                        {nightTimes.map(time => (
                          <div
                            key={time}
                            className="group flex items-center gap-1.5 bg-white text-slate-800 font-mono font-extrabold text-xs px-3 py-1.5 rounded-xl border border-indigo-200 shadow-2xs hover:border-indigo-400 transition-all"
                          >
                            <Clock className="w-3.5 h-3.5 text-indigo-600" />
                            <span>{time}</span>
                            <button
                              type="button"
                              onClick={() => handleRemoveNightTime(time)}
                              className="text-slate-400 hover:text-red-600 p-0.5 rounded-full hover:bg-red-50 transition-colors cursor-pointer"
                              title={`ลบรอบเวลา ${time}`}
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-3 bg-indigo-50/50 rounded-xl border border-dashed border-indigo-200 text-center text-xs text-indigo-800 font-medium">
                        ยังไม่มีรอบเวลากะดึก (คลิกเพิ่มเวลาด้านล่าง)
                      </div>
                    )}
                  </div>

                  {/* Quick Preset Buttons */}
                  <div>
                    <span className="text-[11px] font-semibold text-slate-500 block mb-1">
                      เลือกเวลารวดเร็ว (Presets):
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {COMMON_NIGHT_PRESETS.map(preset => {
                        const isAdded = nightTimes.includes(preset);
                        return (
                          <button
                            key={preset}
                            type="button"
                            onClick={() => handleAddNightTime(preset)}
                            className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                              isAdded
                                ? 'bg-indigo-100 text-indigo-800 border border-indigo-300 opacity-60'
                                : 'bg-slate-100 hover:bg-indigo-100 hover:text-indigo-900 text-slate-700 border border-slate-200'
                            }`}
                            title={isAdded ? 'เวลานี้มีอยู่แล้ว' : `คลิกเพื่อเพิ่มรอบเวลา ${preset}`}
                          >
                            +{preset}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Add Custom Time Form */}
                <div className="pt-3 border-t border-slate-100 space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-700 block">
                    ระบุรอบเวลาใหม่ (HH:mm):
                  </label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <input
                        type="time"
                        value={newNightInput}
                        onChange={(e) => setNewNightInput(e.target.value)}
                        placeholder="08:10"
                        className="w-full bg-slate-50 border border-slate-300 rounded-xl py-2 px-3 pl-8 text-xs font-mono font-bold text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                      />
                      <Clock className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                    <button
                      type="button"
                      onClick={() => handleAddNightTime()}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1 shadow-2xs hover:shadow-xs transition-all cursor-pointer shrink-0"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>เพิ่มรอบ</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Batch update option */}
          <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-2xl p-4 flex items-start gap-3">
            <input
              type="checkbox"
              id="applyToAllRoutesCheckbox"
              checked={applyToAll}
              onChange={(e) => setApplyToAll(e.target.checked)}
              className="mt-1 w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300 cursor-pointer"
            />
            <label htmlFor="applyToAllRoutesCheckbox" className="cursor-pointer select-none">
              <span className="font-extrabold text-xs text-emerald-950 block">
                คัดลอกและอัปเดตรอบเวลานี้ไปยังทุกสายรถรับส่ง ({allRoutes.length} สาย)
              </span>
              <span className="text-[11px] text-emerald-800 block mt-0.5">
                สะดวกมากเมื่อโรงงานมีการปรับเวลาเดินรถมาตรฐานร่วมกัน เช่น ปรับรอบปกติ เลิกงาน หรือรอบโอทีพิเศษ
              </span>
            </label>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 sm:p-5 bg-white border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="text-xs text-slate-500 font-medium">
            รอบเวลารวม: <strong className="text-slate-800">{dayTimes.length} รอบกะเช้า</strong> และ <strong className="text-slate-800">{nightTimes.length} รอบกะดึก</strong>
          </div>
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="px-4 py-2.5 border border-slate-300 rounded-xl font-bold text-xs text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              ยกเลิก
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving || (dayTimes.length === 0 && nightTimes.length === 0)}
              className="btn-sanko text-white px-6 py-2.5 rounded-xl font-extrabold text-xs flex items-center gap-2 shadow-md cursor-pointer hover:shadow-lg transition-all disabled:opacity-50"
            >
              {isSaving ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>กำลังบันทึก...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>บันทึกรอบเวลาเดินรถ</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
