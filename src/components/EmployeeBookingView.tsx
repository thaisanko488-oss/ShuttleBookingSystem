import React, { useState, useMemo } from 'react';
import { Employee, BusRoute, Booking, WorkShift } from '../types';
import { Bus, Send, Calendar, Clock, User, HelpCircle, CheckCircle2 } from 'lucide-react';
import Swal from 'sweetalert2';
import { useLanguage } from '../context/LanguageContext';
import { formatDateDDMMYYYY } from '../utils/dateUtils';

interface EmployeeBookingViewProps {
  employees: Employee[];
  busRoutes: BusRoute[];
  bookings: Booking[];
  onAddBooking: (booking: Booking) => void;
  onOpenUserManual: () => void;
  onViewTicket?: (booking: Booking) => void;
}

export const EmployeeBookingView: React.FC<EmployeeBookingViewProps> = ({
  employees,
  busRoutes,
  bookings,
  onAddBooking,
  onOpenUserManual
}) => {
  const { t } = useLanguage();
  const [employeeId, setEmployeeId] = useState('');
  const [bookingDate, setBookingDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });
  const [selectedRouteId, setSelectedRouteId] = useState('route-a');
  const [shift, setShift] = useState<WorkShift>('Day');
  const [departureTime, setDepartureTime] = useState('17:20');

  // Matched employee lookup
  const matchedEmployee = useMemo(() => {
    return employees.find(e => e.id.trim() === employeeId.trim());
  }, [employees, employeeId]);

  // Selected bus route object
  const selectedBusRoute = useMemo(() => {
    return busRoutes.find(r => r.id === selectedRouteId) || busRoutes[0];
  }, [busRoutes, selectedRouteId]);

  // Dynamic departure times depending on shift
  const availableDepartureTimes = useMemo(() => {
    const routeTimes = selectedBusRoute?.departureTimes?.[shift];
    if (routeTimes && routeTimes.length > 0) {
      const cleanTimes = routeTimes
        .filter(t => t && t.trim() && !t.includes('AM') && !t.includes('PM'))
        .sort((a, b) => a.localeCompare(b));
      if (cleanTimes.length > 0) return cleanTimes;
    }
    return shift === 'Day' ? ['17:20', '20:10'] : ['08:10'];
  }, [selectedBusRoute, shift]);

  // Ensure selected departure time is valid for shift
  React.useEffect(() => {
    if (!availableDepartureTimes.includes(departureTime)) {
      setDepartureTime(availableDepartureTimes[0] || '17:20');
    }
  }, [shift, selectedRouteId, availableDepartureTimes]);

  // Calculate remaining seats for selected route & date
  const bookedCountForRoute = useMemo(() => {
    return bookings.filter(
      b => b.routeId === selectedRouteId && b.date === bookingDate && b.status === 'Confirmed'
    ).length;
  }, [bookings, selectedRouteId, bookingDate]);

  const remainingSeats = (selectedBusRoute?.capacity || 45) - bookedCountForRoute;

  const handleSubmitBooking = (e: React.FormEvent) => {
    e.preventDefault();

    if (!employeeId.trim()) {
      Swal.fire({
        icon: 'error',
        title: t('missingEmpIdTitle'),
        text: t('missingEmpIdText'),
        confirmButtonColor: '#0e5d32'
      });
      return;
    }

    // Check if employee already has an active booking on this selected date (1 booking per person per day rule)
    const existingBooking = bookings.find(
      b => b.employeeId.trim().toLowerCase() === employeeId.trim().toLowerCase() &&
           b.date === bookingDate &&
           b.status === 'Confirmed'
    );

    if (existingBooking) {
      Swal.fire({
        icon: 'warning',
        title: 'จองซ้ำไม่ได้ (จำกัด 1 ครั้งต่อวัน)',
        html: `
          <div class="text-left space-y-2 text-sm text-slate-700">
            <p className="font-bold text-slate-900">
              พนักงานรหัส <span class="text-red-600 font-extrabold">${employeeId.trim()}</span> ได้ทำการจองรถรับส่งสำหรับวันที่ <span class="font-bold">${formatDateDDMMYYYY(bookingDate)}</span> ไว้แล้ว
            </p>
            <div class="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1 text-xs text-slate-600">
              <p>• <strong>สายรถที่จอง:</strong> ${existingBooking.routeName}</p>
              <p>• <strong>รอบเวลา:</strong> ${existingBooking.shift === 'Day' ? t('dayShift') : t('nightShift')} - ${existingBooking.departureTime}</p>
              <p>• <strong>เลขตั๋ว:</strong> ${existingBooking.ticketNo}</p>
            </div>
            <p class="text-xs text-amber-700 font-semibold pt-1">⚠️ เงื่อนไข: พนักงาน 1 คน สามารถจองรถรับส่งได้ 1 ครั้งต่อวันเท่านั้น หากต้องการเปลี่ยนสายรถ โปรดติดต่อแอดมินเพื่อยกเลิกการจองเดิมก่อน</p>
          </div>
        `,
        confirmButtonColor: '#0e5d32',
        confirmButtonText: 'รับทราบ'
      });
      return;
    }

    const empName = matchedEmployee ? matchedEmployee.name : `Employee (${employeeId})`;
    const dept = matchedEmployee ? matchedEmployee.department : 'General Staff';

    const shiftText = shift === 'Day' ? t('dayShift') : t('nightShift');

    Swal.fire({
      title: t('confirmBookingTitle'),
      html: `
        <div class="text-left space-y-2 text-sm text-slate-700">
          <p><strong>${t('passenger')}</strong> ${empName} (ID: ${employeeId})</p>
          <p><strong>${t('route')}</strong> ${selectedBusRoute.name}</p>
          <p><strong>${t('date')}</strong> ${formatDateDDMMYYYY(bookingDate)}</p>
          <p><strong>${t('shiftAndTime')}</strong> ${shiftText} - ${departureTime}</p>
        </div>
      `,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#0e5d32',
      cancelButtonColor: '#64748b',
      confirmButtonText: t('yesBookIt'),
      cancelButtonText: t('cancel')
    }).then((result) => {
      if (result.isConfirmed) {
        // Generate new booking record
        const randomSeat = Math.floor(Math.random() * (selectedBusRoute.capacity || 40)) + 1;
        const ticketNum = `TS-${bookingDate.replace(/-/g, '')}-${Math.floor(100 + Math.random() * 900)}`;

        const newBooking: Booking = {
          id: `bk-${Date.now()}`,
          ticketNo: ticketNum,
          employeeId: employeeId.trim(),
          employeeName: empName,
          department: dept,
          date: bookingDate,
          routeId: selectedBusRoute.id,
          routeName: selectedBusRoute.name,
          shift: shift,
          departureTime: departureTime,
          seatNumber: randomSeat,
          status: 'Confirmed',
          createdAt: new Date().toISOString()
        };

        onAddBooking(newBooking);

        Swal.fire({
          title: t('bookingSuccessTitle'),
          text: t('bookingSuccessText'),
          icon: 'success',
          confirmButtonColor: '#0e5d32',
          confirmButtonText: 'ตกลง'
        });
      }
    });
  };

  return (
    <section className="max-w-2xl mx-auto space-y-8 animate-in fade-in duration-300">
      {/* Main Booking Card */}
      <div className="glass-panel p-6 sm:p-10 rounded-[2rem] border border-slate-200 shadow-2xl relative">
        {/* Top Header */}
        <div className="flex justify-between items-start mb-6">
          <div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#0e5d32] flex items-center gap-2.5">
              <Bus className="w-8 h-8 text-[#0e5d32]" />
              {t('bookingTitle')}
            </h2>
            <p className="text-sm text-slate-600 mt-1 font-medium">
              {t('bookingSubtitle')}
            </p>
          </div>

          <button
            onClick={onOpenUserManual}
            className="flex items-center gap-1.5 text-xs font-bold text-[#0e5d32] bg-white/80 hover:bg-white px-3 py-2 rounded-xl border border-slate-200 shadow-2xs transition-all hover:scale-105 cursor-pointer shrink-0"
            title={t('howToBookLink')}
          >
            <HelpCircle className="w-4 h-4 text-[#0e5d32]" />
            <span>{t('userManual')}</span>
          </button>
        </div>

        <form onSubmit={handleSubmitBooking} className="space-y-6">
          {/* Employee ID & Date Selection */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1.5">
              <label className="block text-sm font-semibold text-slate-800">
                {t('employeeIdLabel')}
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  placeholder={t('employeeIdPlaceholder')}
                  value={employeeId}
                  onChange={(e) => setEmployeeId(e.target.value)}
                  className="w-full bg-white/90 border-2 border-transparent rounded-xl p-3.5 pl-10 focus:ring-2 focus:ring-[#59B135] focus:bg-white focus:border-[#0e5d32] transition-all outline-none font-medium text-slate-800"
                />
                <User className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              </div>
              <p className="text-xs font-bold px-2 h-5 transition-all">
                {matchedEmployee ? (
                  <span className="text-[#0e5d32] flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> {t('empFound')} {matchedEmployee.name}
                  </span>
                ) : employeeId.length > 3 ? (
                  <span className="text-amber-700">{t('empNotFound')}</span>
                ) : (
                  <span className="text-slate-400">{t('employeeIdPlaceholder')}</span>
                )}
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="block text-sm font-semibold text-slate-800">
                {t('travelDateLabel')}
              </label>
              <div className="relative">
                <input
                  type="date"
                  required
                  value={bookingDate}
                  onChange={(e) => setBookingDate(e.target.value)}
                  className="w-full bg-white/90 border-2 border-transparent rounded-xl p-3.5 pl-10 focus:ring-2 focus:ring-[#59B135] focus:bg-white focus:border-[#0e5d32] transition-all outline-none font-medium text-slate-800"
                />
                <Calendar className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
              <p className="text-xs font-bold text-[#0e5d32] px-2 h-5 flex items-center gap-1">
                <span>📅 วันที่เลือก: <strong className="text-slate-900 font-extrabold bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">{formatDateDDMMYYYY(bookingDate)}</strong> (dd/mm/yyyy)</span>
              </p>
            </div>
          </div>

          {/* Bus Line Route Selection */}
          <div className="space-y-1.5">
            <label className="block text-sm font-semibold text-slate-800">
              {t('selectBusRouteLabel')}
            </label>
            <select
              value={selectedRouteId}
              onChange={(e) => setSelectedRouteId(e.target.value)}
              required
              className="w-full bg-white/90 border-2 border-transparent rounded-xl p-3.5 focus:ring-2 focus:ring-[#59B135] focus:bg-white focus:border-[#0e5d32] transition-all outline-none font-medium text-slate-800"
            >
              {busRoutes.filter(r => r.active).map(route => (
                <option key={route.id} value={route.id}>
                  {route.name}
                </option>
              ))}
            </select>
          </div>

          {/* Work Shift & Departure Time */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-slate-800">
                {t('selectShiftLabel')}
              </label>
              <div className="flex gap-3">
                <label
                  className={`flex-1 flex items-center justify-center gap-2 p-3.5 rounded-xl cursor-pointer transition-all border ${
                    shift === 'Day'
                      ? 'bg-white border-[#0e5d32] shadow-xs font-bold text-[#0e5d32]'
                      : 'bg-white/60 border-transparent text-slate-600 hover:bg-white/90'
                  }`}
                >
                  <input
                    type="radio"
                    name="shift"
                    value="Day"
                    checked={shift === 'Day'}
                    onChange={() => setShift('Day')}
                    className="text-[#0e5d32] focus:ring-[#59B135]"
                  />
                  <span>{t('dayShift')}</span>
                </label>

                <label
                  className={`flex-1 flex items-center justify-center gap-2 p-3.5 rounded-xl cursor-pointer transition-all border ${
                    shift === 'Night'
                      ? 'bg-white border-[#0e5d32] shadow-xs font-bold text-[#0e5d32]'
                      : 'bg-white/60 border-transparent text-slate-600 hover:bg-white/90'
                  }`}
                >
                  <input
                    type="radio"
                    name="shift"
                    value="Night"
                    checked={shift === 'Night'}
                    onChange={() => setShift('Night')}
                    className="text-[#0e5d32] focus:ring-[#59B135]"
                  />
                  <span>{t('nightShift')}</span>
                </label>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-sm font-semibold text-slate-800">
                {t('departureTimeLabel')}
              </label>
              <div className="relative">
                <select
                  value={departureTime}
                  onChange={(e) => setDepartureTime(e.target.value)}
                  required
                  className="w-full bg-white/90 border-2 border-transparent rounded-xl p-3.5 pl-10 focus:ring-2 focus:ring-[#59B135] focus:bg-white focus:border-[#0e5d32] transition-all outline-none font-medium text-slate-800"
                >
                  {availableDepartureTimes.map(time => (
                    <option key={time} value={time}>
                      {time}
                    </option>
                  ))}
                </select>
                <Clock className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Confirm Booking Button */}
          <button
            type="submit"
            className="w-full btn-sanko text-white font-extrabold py-4 rounded-xl text-lg flex items-center justify-center gap-2.5 shadow-xl hover:shadow-[#0e5d32]/30 mt-4 cursor-pointer"
          >
            <Send className="w-5 h-5" />
            {t('confirmBookingBtn')}
          </button>
        </form>
      </div>
    </section>
  );
};


