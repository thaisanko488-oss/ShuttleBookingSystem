import React, { useState, useMemo } from 'react';
import { Booking, Employee, BusRoute, AdminUser, AdminTab, SystemNotice } from '../types';
import {
  BarChart3, BadgeCheck, Bus, Settings, Download, Search, Plus, Trash2, Edit3,
  LogOut, Filter, User, Users, CheckCircle2, AlertTriangle, ShieldCheck, MoreVertical,
  X, Printer, Bell, Check, Phone, FileSpreadsheet, FileText, ListFilter
} from 'lucide-react';
import Swal from 'sweetalert2';
import { useLanguage } from '../context/LanguageContext';

interface AdminDashboardViewProps {
  currentAdmin: AdminUser | null;
  bookings: Booking[];
  employees: Employee[];
  busRoutes: BusRoute[];
  admins: AdminUser[];
  systemNotice: SystemNotice;
  onLogout: () => void;
  onCancelBooking: (bookingId: string) => Promise<void>;
  onSaveEmployee: (employee: Employee) => Promise<void>;
  onDeleteEmployee: (id: string) => Promise<void>;
  onSaveBusRoute: (route: BusRoute) => Promise<void>;
  onDeleteBusRoute: (id: string) => Promise<void>;
  onSaveAdmin: (admin: AdminUser) => Promise<void>;
  onUpdateNotice: (notice: SystemNotice) => Promise<void>;
  onViewTicket?: (booking: Booking) => void;
}

export const AdminDashboardView: React.FC<AdminDashboardViewProps> = ({
  currentAdmin,
  bookings,
  employees,
  busRoutes,
  admins,
  systemNotice,
  onLogout,
  onCancelBooking,
  onSaveEmployee,
  onDeleteEmployee,
  onSaveBusRoute,
  onDeleteBusRoute,
  onSaveAdmin,
  onUpdateNotice,
  onViewTicket
}) => {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<AdminTab>('summary');

  // Summary Filters
  const [summaryDate, setSummaryDate] = useState(() => {
    return new Date().toISOString().split('T')[0];
  });
  const [summaryRouteFilter, setSummaryRouteFilter] = useState('all');
  const [summarySearch, setSummarySearch] = useState('');

  // Employee Search & Modals
  const [employeeSearch, setEmployeeSearch] = useState('');
  const [employeeModalOpen, setEmployeeModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [empForm, setEmpForm] = useState({ id: '', name: '', department: 'Production', primaryRoute: 'Route A: Main Gate - Production', phone: '', status: 'Active' as 'Active' | 'Inactive' });

  // Bus Route Modals
  const [routeModalOpen, setRouteModalOpen] = useState(false);
  const [editingRoute, setEditingRoute] = useState<BusRoute | null>(null);
  const [routeForm, setRouteForm] = useState({
    code: 'Route I',
    name: 'Route I: Express Direct',
    fromLocation: 'Main Gate',
    toLocation: 'Assembly 3',
    driverName: 'Somsak Driver',
    licensePlate: '30-9999 Bangkok',
    capacity: 45,
    active: true,
    dayTime1: '17:20',
    dayTime2: '20:10',
    nightTime1: '08:10'
  });

  // Admin Modal
  const [adminModalOpen, setAdminModalOpen] = useState(false);
  const [newAdminForm, setNewAdminForm] = useState({ username: '', name: '', role: 'Manager' as 'Superadmin' | 'Manager' | 'Coordinator' });

  // Filtered Bookings for Summary Tab
  const filteredBookings = useMemo(() => {
    return bookings.filter(b => {
      const matchDate = !summaryDate || b.date === summaryDate;
      const matchRoute = summaryRouteFilter === 'all' || b.routeId === summaryRouteFilter;
      const matchSearch = !summarySearch ||
        b.employeeName.toLowerCase().includes(summarySearch.toLowerCase()) ||
        b.employeeId.includes(summarySearch) ||
        b.ticketNo.toLowerCase().includes(summarySearch.toLowerCase());
      return matchDate && matchRoute && matchSearch;
    });
  }, [bookings, summaryDate, summaryRouteFilter, summarySearch]);

  // Route Headcount Summaries
  const routeSummaries = useMemo(() => {
    return busRoutes.map(route => {
      const routeBookings = bookings.filter(b => b.routeId === route.id && b.date === summaryDate && b.status === 'Confirmed');
      const bookedCount = routeBookings.length;
      const percent = Math.min(100, Math.round((bookedCount / route.capacity) * 100));
      return {
        ...route,
        bookedCount,
        percent,
        isFull: bookedCount >= route.capacity
      };
    });
  }, [busRoutes, bookings, summaryDate]);

  // Filtered Employees
  const filteredEmployees = useMemo(() => {
    return employees.filter(e =>
      e.name.toLowerCase().includes(employeeSearch.toLowerCase()) ||
      e.id.includes(employeeSearch) ||
      e.department.toLowerCase().includes(employeeSearch.toLowerCase())
    );
  }, [employees, employeeSearch]);

  // Matrix time slots
  const matrixTimeSlots = ['17:20', '20:10', '08:10'];

  // Matrix route list including busRoutes + 'ไม่ขึ้นรถ'
  const matrixRoutes = useMemo(() => {
    const list = busRoutes.map(r => ({ id: r.id, name: r.name, code: r.code }));
    if (!list.some(r => r.name.includes('ไม่ขึ้นรถ'))) {
      list.push({ id: 'no-bus', name: 'ไม่ขึ้นรถ', code: 'NO_BUS' });
    }
    return list;
  }, [busRoutes]);

  const getMatrixCount = (routeId: string, routeName: string, timeSlot: string) => {
    return bookings.filter(b => {
      if (b.date !== summaryDate || b.status !== 'Confirmed') return false;
      const matchTime = b.departureTime === timeSlot || b.departureTime.includes(timeSlot);
      if (!matchTime) return false;

      if (routeId === 'no-bus' || routeName.includes('ไม่ขึ้นรถ')) {
        return b.routeId === 'no-bus' || b.routeName.includes('ไม่ขึ้นรถ');
      }
      return b.routeId === routeId || b.routeName === routeName;
    }).length;
  };

  const getMatrixRowTotal = (routeId: string, routeName: string) => {
    return matrixTimeSlots.reduce((sum, time) => sum + getMatrixCount(routeId, routeName, time), 0);
  };

  const getMatrixColTotal = (timeSlot: string) => {
    return matrixRoutes.reduce((sum, r) => sum + getMatrixCount(r.id, r.name, timeSlot), 0);
  };

  const matrixGrandTotal = useMemo(() => {
    return matrixTimeSlots.reduce((sum, time) => sum + getMatrixColTotal(time), 0);
  }, [matrixTimeSlots, summaryDate, bookings, matrixRoutes]);

  const formatDisplayDate = (dateStr: string) => {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return dateStr;
  };

  const handleExportExcel = () => {
    const activeDateBookings = bookings.filter(b => b.date === summaryDate && b.status === 'Confirmed');
    if (activeDateBookings.length === 0) {
      Swal.fire({ icon: 'info', title: 'ไม่มีข้อมูล', text: 'ไม่พบข้อมูลการจองในวันที่เลือกเพื่อส่งออก' });
      return;
    }

    let csv = "\uFEFF";
    csv += `รายงานสรุปการจองรถประจำวันที่: ${formatDisplayDate(summaryDate)}\n\n`;
    csv += "ลำดับ,รหัสพนักงาน,ชื่อ-นามสกุล,แผนก,สายรถที่ต้องการขึ้น,รอบเวลา\n";
    
    activeDateBookings.forEach((b, idx) => {
      csv += `${idx + 1},"${b.employeeId}","${b.employeeName}","${b.department || 'Production'}","${b.routeName}","${b.departureTime}"\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Shuttle_Summary_Report_${summaryDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportPDF = () => {
    window.print();
  };

  // Cancel Booking
  const handleCancelBooking = (bookingId: string) => {
    Swal.fire({
      title: t('cancelBookingTitle'),
      text: 'This seat will be released back to the general capacity.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ba1a1a',
      confirmButtonText: t('yesBookIt')
    }).then(async (res) => {
      if (res.isConfirmed) {
        await onCancelBooking(bookingId);
        Swal.fire('Cancelled!', 'Booking has been marked as cancelled in Firebase.', 'success');
      }
    });
  };

  // Save / Add Employee
  const handleSaveEmployeeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!empForm.id.trim() || !empForm.name.trim()) return;

    if (editingEmployee) {
      await onSaveEmployee({ ...editingEmployee, ...empForm });
      Swal.fire('Updated!', 'Employee record has been saved to Firebase.', 'success');
    } else {
      if (employees.some(emp => emp.id === empForm.id.trim())) {
        Swal.fire('Error', 'Employee ID already exists.', 'error');
        return;
      }
      const newEmp: Employee = { ...empForm, totalBookings: 0 };
      await onSaveEmployee(newEmp);
      Swal.fire('Added!', 'New employee added successfully to Firebase.', 'success');
    }
    setEmployeeModalOpen(false);
    setEditingEmployee(null);
  };

  // Delete Employee
  const handleDeleteEmployee = (id: string) => {
    Swal.fire({
      title: 'Delete Employee?',
      text: `Are you sure you want to remove employee ID ${id}?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ba1a1a'
    }).then(async res => {
      if (res.isConfirmed) {
        await onDeleteEmployee(id);
        Swal.fire('Deleted', 'Employee removed from Firebase.', 'success');
      }
    });
  };

  // Save / Add Bus Route
  const handleSaveBusRouteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingRoute) {
      const updatedRoute: BusRoute = {
        ...editingRoute,
        code: routeForm.code,
        name: routeForm.name,
        fromLocation: routeForm.fromLocation,
        toLocation: routeForm.toLocation,
        driverName: routeForm.driverName,
        licensePlate: routeForm.licensePlate,
        capacity: Number(routeForm.capacity),
        active: routeForm.active,
        departureTimes: {
          Day: [routeForm.dayTime1, routeForm.dayTime2].filter(Boolean),
          Night: [routeForm.nightTime1].filter(Boolean)
        }
      };
      await onSaveBusRoute(updatedRoute);
      Swal.fire('Updated!', 'Route details saved to Firebase.', 'success');
    } else {
      const newRoute: BusRoute = {
        id: `route-${Date.now()}`,
        code: routeForm.code,
        name: routeForm.name,
        fromLocation: routeForm.fromLocation,
        toLocation: routeForm.toLocation,
        driverName: routeForm.driverName,
        licensePlate: routeForm.licensePlate,
        capacity: Number(routeForm.capacity),
        active: routeForm.active,
        departureTimes: {
          Day: [routeForm.dayTime1, routeForm.dayTime2].filter(Boolean),
          Night: [routeForm.nightTime1].filter(Boolean)
        }
      };
      await onSaveBusRoute(newRoute);
      Swal.fire('Added!', 'New bus route saved to Firebase.', 'success');
    }
    setRouteModalOpen(false);
    setEditingRoute(null);
  };

  // Toggle Route Active
  const handleToggleRouteActive = async (route: BusRoute) => {
    await onSaveBusRoute({ ...route, active: !route.active });
  };

  // Add Admin
  const handleAddAdminSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAdminForm.username.trim() || !newAdminForm.name.trim()) return;

    const newAdmin: AdminUser = {
      id: `adm-${Date.now()}`,
      username: newAdminForm.username.trim(),
      name: newAdminForm.name.trim(),
      role: newAdminForm.role,
      lastLogin: 'Never'
    };
    await onSaveAdmin(newAdmin);
    setAdminModalOpen(false);
    setNewAdminForm({ username: '', name: '', role: 'Manager' });
    Swal.fire('Added!', 'New admin account granted.', 'success');
  };

  return (
    <section className="animate-in fade-in duration-300">
      <div className="flex flex-col lg:flex-row gap-6 min-h-[calc(100vh-220px)]">
        {/* Side Navigation Panel */}
        <aside className="lg:w-72 glass-panel p-5 rounded-[2rem] border border-slate-200 shadow-xl flex flex-col gap-2 shrink-0">
          <div className="p-3 mb-2 border-b border-slate-200 flex items-center justify-between">
            <div>
              <h3 className="font-extrabold text-xl text-[#0f2c59]">{t('adminNavTitle')}</h3>
              <p className="text-xs text-slate-500 font-medium">{t('adminNavSubtitle')}</p>
            </div>
            <div className="w-8 h-8 rounded-full bg-[#0f2c59] text-white flex items-center justify-center font-bold text-xs">
              {currentAdmin?.username?.[0] || 'A'}
            </div>
          </div>

          <button
            onClick={() => setActiveTab('summary')}
            className={`flex items-center gap-3 p-3.5 rounded-xl font-bold text-sm text-left transition-all cursor-pointer ${
              activeTab === 'summary'
                ? 'bg-white text-[#0f2c59] shadow-2xs nav-item-active'
                : 'text-slate-700 hover:bg-white/50'
            }`}
          >
            <BarChart3 className="w-5 h-5 text-[#0f2c59]" />
            {t('tabSummary')}
          </button>

          <button
            onClick={() => setActiveTab('employee')}
            className={`flex items-center gap-3 p-3.5 rounded-xl font-bold text-sm text-left transition-all cursor-pointer ${
              activeTab === 'employee'
                ? 'bg-white text-[#0f2c59] shadow-2xs nav-item-active'
                : 'text-slate-700 hover:bg-white/50'
            }`}
          >
            <BadgeCheck className="w-5 h-5 text-[#0f2c59]" />
            {t('tabEmployee')}
          </button>

          <button
            onClick={() => setActiveTab('bus')}
            className={`flex items-center gap-3 p-3.5 rounded-xl font-bold text-sm text-left transition-all cursor-pointer ${
              activeTab === 'bus'
                ? 'bg-white text-[#0f2c59] shadow-2xs nav-item-active'
                : 'text-slate-700 hover:bg-white/50'
            }`}
          >
            <Bus className="w-5 h-5 text-[#0f2c59]" />
            {t('tabBusLines')}
          </button>

          <button
            onClick={() => setActiveTab('settings')}
            className={`flex items-center gap-3 p-3.5 rounded-xl font-bold text-sm text-left transition-all cursor-pointer ${
              activeTab === 'settings'
                ? 'bg-white text-[#0f2c59] shadow-2xs nav-item-active'
                : 'text-slate-700 hover:bg-white/50'
            }`}
          >
            <Settings className="w-5 h-5 text-[#0f2c59]" />
            {t('tabSettings')}
          </button>

          <div className="mt-auto pt-4 border-t border-white/30">
            <div className="mb-3 px-2">
              <p className="text-xs font-bold text-slate-800 truncate">{currentAdmin?.name || 'Administrator'}</p>
              <p className="text-[11px] text-slate-500">Role: {currentAdmin?.role || 'Superadmin'}</p>
            </div>
            <button
              onClick={onLogout}
              className="w-full flex items-center justify-center gap-2 p-3 text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 rounded-xl font-bold text-xs transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              {t('signOutBtn')}
            </button>
          </div>
        </aside>

        {/* Content Area */}
        <div className="flex-1 glass-panel p-6 sm:p-8 rounded-[2rem] border border-white/60 shadow-xl overflow-hidden flex flex-col">
          {/* TAB 1: SUMMARY REPORT */}
          {activeTab === 'summary' && (
            <div className="flex flex-col h-full space-y-6 overflow-y-auto custom-scrollbar print-area pr-1">
              {/* Top Filter Bar */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white/80 p-4 rounded-2xl border border-[#e5e5df] shadow-xs no-print">
                <div className="flex flex-wrap items-center gap-3">
                  <label className="text-sm font-extrabold text-slate-800">เลือกวันที่:</label>
                  <input
                    type="date"
                    value={summaryDate}
                    onChange={(e) => setSummaryDate(e.target.value)}
                    className="bg-white border border-slate-300 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-[#5cb85c]"
                  />
                  <button
                    onClick={() => {}}
                    className="bg-[#5cb85c] hover:bg-[#4cae4c] text-white px-4 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer transition-colors"
                  >
                    <Search className="w-3.5 h-3.5" /> ค้นหา
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleExportExcel}
                    className="bg-[#1b5e20] hover:bg-[#144718] text-white px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer transition-colors"
                  >
                    <FileSpreadsheet className="w-4 h-4" /> Export Excel
                  </button>
                  <button
                    onClick={handleExportPDF}
                    className="bg-[#d9534f] hover:bg-[#c9302c] text-white px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer transition-colors"
                  >
                    <FileText className="w-4 h-4" /> Export PDF
                  </button>
                </div>
              </div>

              {/* Date Indicator Badge */}
              <div className="flex items-center gap-2 pt-1">
                <span className="text-sm font-extrabold text-slate-800">ข้อมูลของวันที่:</span>
                <span className="bg-[#d4edda] text-[#155724] border border-[#c3e6cb] px-4 py-1 rounded-full font-extrabold text-sm shadow-2xs">
                  {formatDisplayDate(summaryDate)}
                </span>
              </div>

              {/* Main Matrix Table */}
              <div className="border border-slate-300 rounded-2xl overflow-hidden bg-white shadow-xs">
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse text-left">
                    <thead>
                      <tr>
                        <th rowSpan={2} className="p-3 bg-[#e9ecef] border-b border-r border-slate-300 font-extrabold text-slate-800 text-sm text-center align-middle w-1/4">
                          ชื่อสายรถ
                        </th>
                        <th colSpan={matrixTimeSlots.length} className="p-2.5 bg-[#e9ecef] border-b border-r border-slate-300 font-extrabold text-slate-800 text-sm text-center">
                          จำนวนพนักงานที่ขึ้นรถในแต่ละรอบ (คน)
                        </th>
                        <th rowSpan={2} className="p-3 bg-[#e9ecef] border-b border-slate-300 font-extrabold text-slate-800 text-sm text-center align-middle w-1/5">
                          รวมทั้งหมด (คน)
                        </th>
                      </tr>
                      <tr>
                        {matrixTimeSlots.map(time => (
                          <th key={time} className="p-2 bg-[#e9ecef] border-b border-r border-slate-300 font-extrabold text-slate-800 text-xs text-center">
                            เวลา {time}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 text-sm">
                      {matrixRoutes.map((rt) => {
                        const rowTotal = getMatrixRowTotal(rt.id, rt.name);
                        const isNoBus = rt.id === 'no-bus' || rt.name.includes('ไม่ขึ้นรถ');
                        return (
                          <tr key={rt.id} className="hover:bg-slate-50/80 transition-colors">
                            <td className={`p-3 pl-6 border-r border-slate-200 font-bold ${isNoBus ? 'text-red-600 font-extrabold' : 'text-slate-800'}`}>
                              {rt.name}
                            </td>
                            {matrixTimeSlots.map(time => {
                              const count = getMatrixCount(rt.id, rt.name, time);
                              return (
                                <td key={time} className={`p-3 border-r border-slate-200 text-center font-bold ${isNoBus && count > 0 ? 'text-red-600 font-extrabold' : 'text-slate-800'}`}>
                                  {count > 0 ? count : ''}
                                </td>
                              );
                            })}
                            <td className={`p-3 text-center font-bold ${isNoBus && rowTotal > 0 ? 'text-red-600 font-extrabold' : 'text-slate-800'}`}>
                              {rowTotal > 0 ? rowTotal : ''}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                    <tfoot>
                      <tr className="bg-[#f8f9fa] border-t-2 border-slate-300 font-extrabold text-slate-800 text-sm">
                        <td className="p-3 text-center border-r border-slate-300 font-extrabold">
                          ยอดรวมสะสม (คน)
                        </td>
                        {matrixTimeSlots.map(time => {
                          const colTotal = getMatrixColTotal(time);
                          return (
                            <td key={time} className="p-3 text-center border-r border-slate-300 font-extrabold text-slate-800">
                              {colTotal}
                            </td>
                          );
                        })}
                        <td className="p-3 text-center font-extrabold text-[#155724] bg-[#d4edda] border-l border-slate-300 text-base">
                          {matrixGrandTotal}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>

              {/* Employee Booking List Table */}
              <div className="space-y-3 pt-2">
                <h4 className="text-sm sm:text-base font-extrabold text-slate-800 flex items-center gap-2">
                  <ListFilter className="w-5 h-5 text-slate-700" /> ข้อมูลรายชื่อพนักงานที่ทำการจอง
                </h4>

                <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-xs">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-[#f8f9fa] border-b border-slate-200 text-slate-700 font-bold">
                          <th className="p-3 text-center w-12">ที่</th>
                          <th className="p-3">รหัสพนักงาน</th>
                          <th className="p-3">ชื่อ-นามสกุล</th>
                          <th className="p-3">แผนก</th>
                          <th className="p-3">สายรถที่ต้องการขึ้น</th>
                          <th className="p-3 text-center">รอบเวลา</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {bookings.filter(b => b.date === summaryDate && b.status === 'Confirmed').length === 0 ? (
                          <tr>
                            <td colSpan={6} className="p-8 text-center text-slate-400 italic">
                              ไม่มีรายการจองรถในวันที่เลือก
                            </td>
                          </tr>
                        ) : (
                          bookings.filter(b => b.date === summaryDate && b.status === 'Confirmed').map((b, idx) => {
                            const isNoBus = b.routeName.includes('ไม่ขึ้นรถ');
                            return (
                              <tr key={b.id} className="hover:bg-slate-50 transition-colors">
                                <td className="p-3 text-center text-slate-500 font-semibold">{idx + 1}</td>
                                <td className="p-3 font-extrabold text-red-600 font-mono">{b.employeeId}</td>
                                <td className="p-3 font-bold text-slate-800">{b.employeeName}</td>
                                <td className="p-3 font-medium text-slate-600">{b.department || 'Production'}</td>
                                <td className={`p-3 font-bold ${isNoBus ? 'text-red-600' : 'text-slate-800'}`}>
                                  {b.routeName}
                                </td>
                                <td className="p-3 text-center">
                                  <span className={`px-3 py-1 rounded-full text-[11px] font-extrabold inline-block shadow-2xs ${
                                    b.departureTime === '17:20'
                                      ? 'bg-red-50 text-red-700 border border-red-200'
                                      : b.departureTime === '20:10'
                                      ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                      : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  }`}>
                                    {b.departureTime}
                                  </span>
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: EMPLOYEE MANAGEMENT */}
          {activeTab === 'employee' && (
            <div className="flex flex-col h-full space-y-6">
              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 border-b border-slate-200 pb-4">
                <div>
                  <h3 className="text-2xl font-extrabold text-[#0f2c59]">{t('tabEmployee')}</h3>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">Manage staff records and shuttle route preferences</p>
                </div>
                <div className="flex gap-3">
                  <div className="relative">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder={t('searchEmployeePlaceholder')}
                      value={employeeSearch}
                      onChange={(e) => setEmployeeSearch(e.target.value)}
                      className="bg-white/80 border border-slate-200 rounded-xl pl-9 pr-4 py-2 text-xs font-medium text-slate-800 outline-none focus:ring-2 focus:ring-[#0f2c59]"
                    />
                  </div>
                  <button
                    onClick={() => {
                      setEditingEmployee(null);
                      setEmpForm({ id: `10${Math.floor(100 + Math.random() * 900)}`, name: '', department: 'Production', primaryRoute: 'Route A: Main Gate - Production', phone: '', status: 'Active' });
                      setEmployeeModalOpen(true);
                    }}
                    className="btn-sanko text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md cursor-pointer"
                  >
                    <Plus className="w-4 h-4" /> {t('addEmployeeBtn')}
                  </button>
                </div>
              </div>

              {/* Employee Directory Table */}
              <div className="flex-1 overflow-auto custom-scrollbar border border-slate-200 rounded-2xl bg-white/60 shadow-inner">
                <table className="w-full text-left border-collapse">
                  <thead className="sticky top-0 bg-[#0f2c59] text-white z-10">
                    <tr>
                      <th className="p-3 text-xs font-bold">{t('empIdHeader')}</th>
                      <th className="p-3 text-xs font-bold">{t('fullNameHeader')}</th>
                      <th className="p-3 text-xs font-bold">{t('primaryRouteHeader')}</th>
                      <th className="p-3 text-xs font-bold">{t('statusHeader')}</th>
                      <th className="p-3 text-xs font-bold text-right">{t('actionsHeader')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200/60 text-xs">
                    {filteredEmployees.map(emp => (
                      <tr key={emp.id} className="hover:bg-white/80 transition-colors">
                        <td className="p-3 font-mono font-bold text-[#0f2c59]">{emp.id}</td>
                        <td className="p-3 font-bold text-slate-800">{emp.name}</td>
                        <td className="p-3 text-slate-600">{emp.primaryRoute}</td>
                        <td className="p-3">
                          <span className={`px-2 py-0.5 text-[10px] rounded-full font-bold ${
                            emp.status === 'Active' ? 'bg-[#0f2c59]/10 text-[#0f2c59] border border-[#0f2c59]/30' : 'bg-slate-200 text-slate-600'
                          }`}>
                            {emp.status}
                          </span>
                        </td>
                        <td className="p-3 text-right space-x-1">
                          <button
                            onClick={() => {
                              setEditingEmployee(emp);
                              setEmpForm({ id: emp.id, name: emp.name, department: emp.department, primaryRoute: emp.primaryRoute, phone: emp.phone || '', status: emp.status });
                              setEmployeeModalOpen(true);
                            }}
                            className="p-1.5 text-[#0f2c59] hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                            title="Edit Employee"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteEmployee(emp.id)}
                            className="p-1.5 text-red-600 hover:bg-red-100 rounded-lg transition-colors cursor-pointer"
                            title="Delete Employee"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 3: BUS LINE MANAGEMENT */}
          {activeTab === 'bus' && (
            <div className="flex flex-col h-full space-y-6">
              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 border-b border-slate-200 pb-4">
                <div>
                  <h3 className="text-2xl font-extrabold text-[#0f2c59]">{t('tabBusLines')}</h3>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">Configure corporate shuttle routes, capacities, drivers, and times</p>
                </div>
                <button
                  onClick={() => {
                    setEditingRoute(null);
                    setRouteForm({
                      code: `Route ${String.fromCharCode(65 + busRoutes.length)}`,
                      name: `Route ${String.fromCharCode(65 + busRoutes.length)}: New Connection`,
                      fromLocation: 'Factory Gate',
                      toLocation: 'Canteen',
                      driverName: 'Sankow Driver',
                      licensePlate: '30-1000 Bangkok',
                      capacity: 45,
                      active: true,
                      dayTime1: '17:20',
                      dayTime2: '20:10',
                      nightTime1: '08:10'
                    });
                    setRouteModalOpen(true);
                  }}
                  className="btn-sanko text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md cursor-pointer"
                >
                  <Plus className="w-4 h-4" /> {t('addRouteBtn')}
                </button>
              </div>

              {/* Bus Route Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 overflow-auto custom-scrollbar p-1">
                {busRoutes.map(route => (
                  <div key={route.id} className="bg-white/70 border border-slate-200 p-5 rounded-2xl shadow-2xs flex flex-col justify-between space-y-4 hover:shadow-md transition-all">
                    <div className="flex justify-between items-start">
                      <div className="p-2.5 bg-[#0f2c59]/10 text-[#0f2c59] rounded-full">
                        <Bus className="w-6 h-6" />
                      </div>
                      <button
                        onClick={() => handleToggleRouteActive(route)}
                        className={`px-2.5 py-1 text-[10px] rounded-full uppercase font-bold tracking-wider transition-colors cursor-pointer ${
                          route.active
                            ? 'bg-[#0f2c59] text-white'
                            : 'bg-slate-300 text-slate-600'
                        }`}
                      >
                        {route.active ? t('statusActive') : t('statusInactive')}
                      </button>
                    </div>

                    <div>
                      <h4 className="font-extrabold text-lg text-slate-800">{route.code}</h4>
                      <p className="text-xs text-[#0f2c59] font-medium">{route.fromLocation} → {route.toLocation}</p>
                    </div>

                    <div className="text-xs space-y-1.5 pt-2 border-t border-slate-200">
                      <p className="text-slate-800"><strong>{t('driverNameHeader')}:</strong> {route.driverName} ({route.licensePlate})</p>
                      <p className="text-slate-800">
                        <strong>{t('dayShift')} {t('departureTimeLabel')}:</strong> {route.departureTimes.Day.join(', ')}
                      </p>
                    </div>

                    <div className="flex gap-2 pt-2 border-t border-slate-200">
                      <button
                        onClick={() => {
                          setEditingRoute(route);
                          setRouteForm({
                            code: route.code,
                            name: route.name,
                            fromLocation: route.fromLocation,
                            toLocation: route.toLocation,
                            driverName: route.driverName,
                            licensePlate: route.licensePlate,
                            capacity: route.capacity,
                            active: route.active,
                            dayTime1: route.departureTimes.Day[0] || '17:20',
                            dayTime2: route.departureTimes.Day[1] || '20:10',
                            nightTime1: route.departureTimes.Night[0] || '08:10'
                          });
                          setRouteModalOpen(true);
                        }}
                        className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-[#0f2c59] font-bold text-xs rounded-xl transition-colors cursor-pointer"
                      >
                        Edit Details
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: ADMIN SETTINGS */}
          {activeTab === 'settings' && (
            <div className="flex flex-col h-full space-y-6">
              <div className="flex justify-between items-center border-b border-slate-200 pb-4">
                <div>
                  <h3 className="text-2xl font-extrabold text-[#0f2c59]">{t('tabSettings')}</h3>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">Manage system permissions and public announcement banner</p>
                </div>
                <button
                  onClick={() => setAdminModalOpen(true)}
                  className="btn-sanko text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md cursor-pointer"
                >
                  <Plus className="w-4 h-4" /> {t('addAdminBtn')}
                </button>
              </div>

              {/* Public Broadcast Notice Settings */}
              <div className="bg-white/80 p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-[#0f2c59] font-bold text-sm">
                    <Bell className="w-5 h-5 text-amber-600" />
                    <span>{t('announcementLabel')}</span>
                  </div>
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-800">
                    <input
                      type="checkbox"
                      checked={systemNotice.enabled}
                      onChange={(e) => onUpdateNotice({ ...systemNotice, enabled: e.target.checked })}
                      className="text-[#0f2c59] focus:ring-[#0f2c59] rounded cursor-pointer"
                    />
                    Enable Notice
                  </label>
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={systemNotice.message}
                    onChange={(e) => onUpdateNotice({ ...systemNotice, message: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs font-medium text-slate-800 outline-none focus:ring-2 focus:ring-[#0f2c59]"
                  />
                </div>
              </div>

              {/* System Administrators List */}
              <div className="bg-white/80 rounded-2xl overflow-hidden border border-slate-200 shadow-2xs">
                <div className="p-4 bg-[#0f2c59] text-white font-bold text-sm flex justify-between items-center">
                  <span>Authorized Administrators</span>
                  <span className="text-xs bg-white/20 px-2.5 py-1 rounded-full">{admins.length} Superusers</span>
                </div>
                <div className="divide-y divide-slate-200">
                  {admins.map(adm => (
                    <div key={adm.id} className="p-4 flex items-center justify-between hover:bg-slate-50/50 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-[#0f2c59]/10 text-[#0f2c59] rounded-full flex items-center justify-center font-bold text-sm">
                          {adm.username[0].toUpperCase()}
                        </div>
                        <div>
                          <p className="font-bold text-sm text-slate-800">{adm.username} ({adm.name})</p>
                          <p className="text-xs text-slate-500">Role: {adm.role} • Last Login: {adm.lastLogin}</p>
                        </div>
                      </div>
                      <span className="text-xs font-bold text-[#0f2c59] bg-[#0f2c59]/10 px-2.5 py-1 rounded-lg border border-[#0f2c59]/20">
                        {t('statusActive')}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* MODAL 1: ADD/EDIT EMPLOYEE */}
      {employeeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white p-6 rounded-3xl max-w-md w-full shadow-2xl space-y-4 border border-slate-100">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="font-bold text-lg text-slate-900">
                {editingEmployee ? 'Edit Employee' : t('addEmployeeBtn')}
              </h3>
              <button onClick={() => setEmployeeModalOpen(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSaveEmployeeSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">{t('empIdHeader')}</label>
                <input
                  type="text"
                  required
                  disabled={!!editingEmployee}
                  value={empForm.id}
                  onChange={(e) => setEmpForm({ ...empForm, id: e.target.value })}
                  className="w-full bg-slate-50 border p-2.5 rounded-xl text-xs font-bold"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">{t('fullNameHeader')}</label>
                <input
                  type="text"
                  required
                  value={empForm.name}
                  onChange={(e) => setEmpForm({ ...empForm, name: e.target.value })}
                  className="w-full bg-slate-50 border p-2.5 rounded-xl text-xs font-semibold"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">{t('primaryRouteHeader')}</label>
                <select
                  value={empForm.primaryRoute}
                  onChange={(e) => setEmpForm({ ...empForm, primaryRoute: e.target.value })}
                  className="w-full bg-slate-50 border p-2.5 rounded-xl text-xs font-semibold"
                >
                  {busRoutes.map(r => (
                    <option key={r.id} value={r.name}>{r.name}</option>
                  ))}
                </select>
              </div>
              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setEmployeeModalOpen(false)}
                  className="flex-1 border py-2.5 rounded-xl text-xs font-bold text-slate-600 cursor-pointer"
                >
                  {t('cancel')}
                </button>
                <button
                  type="submit"
                  className="flex-1 btn-sanko text-white py-2.5 rounded-xl text-xs font-bold cursor-pointer"
                >
                  {t('saveRecordBtn')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: ADD/EDIT BUS ROUTE */}
      {routeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white p-6 rounded-3xl max-w-md w-full shadow-2xl space-y-4 border border-slate-100 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="font-bold text-lg text-slate-900">
                {editingRoute ? 'Edit Bus Route' : t('addRouteBtn')}
              </h3>
              <button onClick={() => setRouteModalOpen(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSaveBusRouteSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Route Code</label>
                <input
                  type="text"
                  required
                  value={routeForm.code}
                  onChange={(e) => setRouteForm({ ...routeForm, code: e.target.value })}
                  className="w-full bg-slate-50 border p-2.5 rounded-xl font-bold"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Full Route Name</label>
                <input
                  type="text"
                  required
                  value={routeForm.name}
                  onChange={(e) => setRouteForm({ ...routeForm, name: e.target.value })}
                  className="w-full bg-slate-50 border p-2.5 rounded-xl font-semibold"
                />
              </div>
              {/* Removed Origin, Destination, Driver Name, License Plate, and Capacity inputs as requested */}
              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setRouteModalOpen(false)}
                  className="flex-1 border py-2.5 rounded-xl font-bold text-slate-600 cursor-pointer"
                >
                  {t('cancel')}
                </button>
                <button
                  type="submit"
                  className="flex-1 btn-sanko text-white py-2.5 rounded-xl font-bold cursor-pointer"
                >
                  {t('saveRecordBtn')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: NEW ADMIN */}
      {adminModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white p-6 rounded-3xl max-w-sm w-full shadow-2xl space-y-4 border border-slate-100">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="font-bold text-lg text-slate-900">{t('addAdminBtn')}</h3>
              <button onClick={() => setAdminModalOpen(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleAddAdminSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">{t('usernameLabel')}</label>
                <input
                  type="text"
                  required
                  value={newAdminForm.username}
                  onChange={(e) => setNewAdminForm({ ...newAdminForm, username: e.target.value })}
                  placeholder="e.g. thaisanko_admin"
                  className="w-full bg-slate-50 border p-2.5 rounded-xl font-semibold"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">{t('fullNameHeader')}</label>
                <input
                  type="text"
                  required
                  value={newAdminForm.name}
                  onChange={(e) => setNewAdminForm({ ...newAdminForm, name: e.target.value })}
                  placeholder="e.g. Somchai Admin"
                  className="w-full bg-slate-50 border p-2.5 rounded-xl font-semibold"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Role</label>
                <select
                  value={newAdminForm.role}
                  onChange={(e) => setNewAdminForm({ ...newAdminForm, role: e.target.value as any })}
                  className="w-full bg-slate-50 border p-2.5 rounded-xl font-semibold"
                >
                  <option value="Manager">Transport Manager</option>
                  <option value="Superadmin">Superadmin</option>
                  <option value="Coordinator">Shift Coordinator</option>
                </select>
              </div>
              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setAdminModalOpen(false)}
                  className="flex-1 border py-2.5 rounded-xl font-bold text-slate-600 cursor-pointer"
                >
                  {t('cancel')}
                </button>
                <button
                  type="submit"
                  className="flex-1 btn-sanko text-white py-2.5 rounded-xl font-bold cursor-pointer"
                >
                  {t('saveRecordBtn')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
};
