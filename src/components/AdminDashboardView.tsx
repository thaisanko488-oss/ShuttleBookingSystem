import React, { useState, useMemo } from 'react';
import { Booking, Employee, BusRoute, AdminUser, AdminTab, SystemNotice, NewsArticle } from '../types';
import {
  BarChart3, BadgeCheck, Bus, Settings, Download, Search, Plus, Trash2, Edit3,
  LogOut, Filter, User, Users, CheckCircle2, AlertTriangle, ShieldCheck, MoreVertical,
  X, Printer, Bell, Check, Phone, FileSpreadsheet, FileText, ListFilter,
  CalendarCheck, Calendar, Clock, Ticket, Megaphone, Pin, Paperclip, Eye, EyeOff, ExternalLink, Image as ImageIcon,
  KeyRound, Shield, Copy, CheckCheck, RefreshCw
} from 'lucide-react';
import Swal from 'sweetalert2';
import { useLanguage } from '../context/LanguageContext';
import { formatDateDDMMYYYY } from '../utils/dateUtils';
import { NewsEditorModal } from './NewsEditorModal';
import { PdfViewerModal } from './PdfViewerModal';
import { DepartureTimeModal } from './DepartureTimeModal';
import { loadAttachmentUrl } from '../services/firebaseService';

interface AdminDashboardViewProps {
  currentAdmin: AdminUser | null;
  bookings: Booking[];
  employees: Employee[];
  busRoutes: BusRoute[];
  admins: AdminUser[];
  systemNotice: SystemNotice;
  news: NewsArticle[];
  onLogout: () => void;
  onCancelBooking: (bookingId: string) => Promise<void>;
  onSaveEmployee: (employee: Employee) => Promise<void>;
  onDeleteEmployee: (id: string) => Promise<void>;
  onSaveBusRoute: (route: BusRoute) => Promise<void>;
  onDeleteBusRoute: (id: string) => Promise<void>;
  onSaveAdmin: (admin: AdminUser) => Promise<void>;
  onDeleteAdmin: (id: string) => Promise<void>;
  onUpdateNotice: (notice: SystemNotice) => Promise<void>;
  onSaveNews: (article: NewsArticle) => Promise<void>;
  onDeleteNews: (id: string) => Promise<void>;
  onViewTicket?: (booking: Booking) => void;
}

export const AdminDashboardView: React.FC<AdminDashboardViewProps> = ({
  currentAdmin,
  bookings,
  employees,
  busRoutes,
  admins,
  systemNotice,
  news,
  onLogout,
  onCancelBooking,
  onSaveEmployee,
  onDeleteEmployee,
  onSaveBusRoute,
  onDeleteBusRoute,
  onSaveAdmin,
  onDeleteAdmin,
  onUpdateNotice,
  onSaveNews,
  onDeleteNews,
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

  // Daily Booking Report Filters
  const [dailyReportDate, setDailyReportDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [dailyReportTimeFilter, setDailyReportTimeFilter] = useState('all');
  const [dailyReportRouteFilter, setDailyReportRouteFilter] = useState('all');
  const [dailyReportDeptFilter, setDailyReportDeptFilter] = useState('all');
  const [dailyReportStatusFilter, setDailyReportStatusFilter] = useState('all');
  const [dailyReportSearch, setDailyReportSearch] = useState('');

  // Employee Search, Filters & Modals
  const [employeeSearch, setEmployeeSearch] = useState('');
  const [employeeDeptFilter, setEmployeeDeptFilter] = useState('all');
  const [employeeStatusFilter, setEmployeeStatusFilter] = useState('all');
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
    departureTimes: {
      Day: ['17:20', '20:10'],
      Night: ['08:10']
    }
  });
  const [routeModalNewDayTime, setRouteModalNewDayTime] = useState('');
  const [routeModalNewNightTime, setRouteModalNewNightTime] = useState('');

  // Specialized Departure Time Management Modal
  const [timeModalOpen, setTimeModalOpen] = useState(false);
  const [selectedRouteForTimes, setSelectedRouteForTimes] = useState<BusRoute | null>(null);

  // Admin Modal & Credential State
  const [adminModalOpen, setAdminModalOpen] = useState(false);
  const [editingAdmin, setEditingAdmin] = useState<AdminUser | null>(null);
  const [newAdminForm, setNewAdminForm] = useState({
    username: '',
    name: '',
    password: '',
    role: 'Manager' as 'Superadmin' | 'Manager' | 'Coordinator'
  });
  const [showModalPassword, setShowModalPassword] = useState(false);
  const [revealedPasswords, setRevealedPasswords] = useState<Record<string, boolean>>({});
  const [copiedAdminId, setCopiedAdminId] = useState<string | null>(null);

  // Helper to generate a random secure password
  const generateRandomPassword = () => {
    const chars = 'abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789!@#$%';
    let pass = '';
    for (let i = 0; i < 8; i++) {
      pass += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setNewAdminForm(prev => ({ ...prev, password: pass }));
    setShowModalPassword(true);
  };

  // Helper to toggle masked password in the table
  const togglePasswordReveal = (id: string) => {
    setRevealedPasswords(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  // Helper to copy password to clipboard
  const handleCopyPassword = (adminId: string, pwd: string) => {
    navigator.clipboard.writeText(pwd);
    setCopiedAdminId(adminId);
    setTimeout(() => setCopiedAdminId(null), 2000);
    Swal.fire({
      toast: true,
      position: 'top-end',
      icon: 'success',
      title: 'คัดลอกรหัสผ่านแล้ว',
      showConfirmButton: false,
      timer: 1500
    });
  };

  // News & Announcements State
  const [newsSearch, setNewsSearch] = useState('');
  const [newsCategoryFilter, setNewsCategoryFilter] = useState('all');
  const [newsStatusFilter, setNewsStatusFilter] = useState('all');
  const [newsModalOpen, setNewsModalOpen] = useState(false);
  const [editingNews, setEditingNews] = useState<NewsArticle | null>(null);
  const [adminPreviewPdf, setAdminPreviewPdf] = useState<{ name: string; url: string } | null>(null);

  const adminFilteredNews = useMemo(() => {
    return news.filter(n => {
      const matchesCat = newsCategoryFilter === 'all' || n.category === newsCategoryFilter;
      const matchesStatus = newsStatusFilter === 'all' || n.status === newsStatusFilter;
      const q = newsSearch.toLowerCase().trim();
      const matchesSearch = !q || n.title.toLowerCase().includes(q) || n.content.toLowerCase().includes(q) || n.author.toLowerCase().includes(q);
      return matchesCat && matchesStatus && matchesSearch;
    });
  }, [news, newsCategoryFilter, newsStatusFilter, newsSearch]);

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

  // Filtered Bookings for Daily Report Tab
  const filteredDailyBookings = useMemo(() => {
    return bookings.filter(b => {
      const matchDate = !dailyReportDate || b.date === dailyReportDate;
      const matchTime = dailyReportTimeFilter === 'all' || b.departureTime === dailyReportTimeFilter;
      const matchRoute = dailyReportRouteFilter === 'all' || b.routeId === dailyReportRouteFilter;
      const matchDept = dailyReportDeptFilter === 'all' || b.department === dailyReportDeptFilter;
      const matchStatus = dailyReportStatusFilter === 'all' || b.status === dailyReportStatusFilter;
      const matchSearch = !dailyReportSearch ||
        b.employeeName.toLowerCase().includes(dailyReportSearch.toLowerCase()) ||
        b.employeeId.includes(dailyReportSearch) ||
        b.ticketNo.toLowerCase().includes(dailyReportSearch.toLowerCase()) ||
        b.routeName.toLowerCase().includes(dailyReportSearch.toLowerCase());
      return matchDate && matchTime && matchRoute && matchDept && matchStatus && matchSearch;
    });
  }, [bookings, dailyReportDate, dailyReportTimeFilter, dailyReportRouteFilter, dailyReportDeptFilter, dailyReportStatusFilter, dailyReportSearch]);

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

  // Unique departments for filter
  const uniqueDepartments = useMemo(() => {
    const depts = new Set<string>();
    employees.forEach(e => {
      if (e.department) depts.add(e.department);
    });
    return Array.from(depts);
  }, [employees]);

  // Filtered Employees
  const filteredEmployees = useMemo(() => {
    return employees.filter(e => {
      const matchSearch = !employeeSearch ||
        e.name.toLowerCase().includes(employeeSearch.toLowerCase()) ||
        e.id.includes(employeeSearch) ||
        (e.department && e.department.toLowerCase().includes(employeeSearch.toLowerCase())) ||
        (e.primaryRoute && e.primaryRoute.toLowerCase().includes(employeeSearch.toLowerCase()));
      const matchDept = employeeDeptFilter === 'all' || e.department === employeeDeptFilter;
      const matchStatus = employeeStatusFilter === 'all' || e.status === employeeStatusFilter;
      return matchSearch && matchDept && matchStatus;
    });
  }, [employees, employeeSearch, employeeDeptFilter, employeeStatusFilter]);

  // Matrix time slots dynamically extracted from busRoutes & existing bookings
  const matrixTimeSlots = useMemo(() => {
    const times = new Set<string>();
    busRoutes.forEach(r => {
      (r.departureTimes?.Day || []).forEach(t => {
        if (t && t.trim() && !t.includes('AM') && !t.includes('PM')) times.add(t.trim());
      });
      (r.departureTimes?.Night || []).forEach(t => {
        if (t && t.trim() && !t.includes('AM') && !t.includes('PM')) times.add(t.trim());
      });
    });
    bookings.forEach(b => {
      if (b.departureTime && b.departureTime.trim()) times.add(b.departureTime.trim());
    });
    if (times.size === 0) {
      times.add('08:10');
      times.add('17:20');
      times.add('20:10');
    }
    return Array.from(times).sort((a, b) => a.localeCompare(b));
  }, [busRoutes, bookings]);

  // Color styling for dynamic departure time badges
  const getTimeBadgeStyle = (time: string) => {
    if (time === '17:20' || time.startsWith('17:') || time.startsWith('16:')) {
      return 'bg-amber-50 text-amber-800 border border-amber-200';
    }
    if (time === '20:10' || time.startsWith('19:') || time.startsWith('20:') || time.startsWith('21:')) {
      return 'bg-blue-50 text-blue-800 border border-blue-200';
    }
    if (time === '08:10' || time.startsWith('07:') || time.startsWith('08:') || time.startsWith('05:') || time.startsWith('06:')) {
      return 'bg-indigo-50 text-indigo-800 border border-indigo-200';
    }
    return 'bg-emerald-50 text-emerald-800 border border-emerald-200';
  };

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
    return formatDateDDMMYYYY(dateStr);
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

  // Export Employee Directory Report
  const handleExportEmployeeExcel = () => {
    if (employees.length === 0) {
      Swal.fire({ icon: 'info', title: 'ไม่มีข้อมูล', text: 'ไม่พบข้อมูลพนักงานในระบบเพื่อส่งออก' });
      return;
    }

    const todayStr = formatDateDDMMYYYY(new Date().toISOString().split('T')[0]);
    let csv = "\uFEFF";
    csv += `รายงานรายชื่อพนักงาน (Employee Directory Report) - บริษัท ไทย ซันโก้ จำกัด\n`;
    csv += `วันที่ส่งออกรายงาน: ${todayStr}\n`;
    csv += `จำนวนพนักงานทั้งหมด: ${employees.length} คน (เปิดใช้งาน: ${employees.filter(e => e.status === 'Active').length} คน, ปิดใช้งาน: ${employees.filter(e => e.status === 'Inactive').length} คน)\n\n`;
    csv += "ลำดับ,รหัสพนักงาน,ชื่อ-นามสกุล,แผนก,สายรถหลักประจำตัว,เบอร์โทรศัพท์,สถานะ\n";

    filteredEmployees.forEach((emp, idx) => {
      csv += `${idx + 1},"${emp.id}","${emp.name}","${emp.department || '-'}","${emp.primaryRoute || '-'}","${emp.phone || '-'}","${emp.status === 'Active' ? 'เปิดใช้งาน' : 'ปิดใช้งาน'}"\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Employee_List_Report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportEmployeePDF = () => {
    window.print();
  };

  // Export Daily Employee Booking Report
  const handleExportDailyReportExcel = () => {
    if (filteredDailyBookings.length === 0) {
      Swal.fire({ icon: 'info', title: 'ไม่มีข้อมูล', text: 'ไม่พบรายการจองพนักงานตามเงื่อนไขที่เลือกเพื่อส่งออก' });
      return;
    }

    const todayStr = formatDateDDMMYYYY(new Date().toISOString().split('T')[0]);
    const selectedDateStr = formatDateDDMMYYYY(dailyReportDate);
    let csv = "\uFEFF";
    csv += `รายงานรายชื่อพนักงานที่ทำการจองรถประจำวัน (Daily Employee Shuttle Booking Report) - บริษัท ไทย ซันโก้ จำกัด\n`;
    csv += `ประจำวันที่: ${selectedDateStr} | วันที่ส่งออกรายงาน: ${todayStr}\n`;
    csv += `จำนวนผู้จองทั้งหมด: ${filteredDailyBookings.length} รายการ\n\n`;
    csv += "ลำดับ,วันที่จอง,รหัสตั๋ว,รหัสพนักงาน,ชื่อ-นามสกุล,แผนก,สายรถที่จอง,รอบเวลา,กะการทำงาน,สถานะ\n";

    filteredDailyBookings.forEach((b, idx) => {
      const isCancelled = b.status === 'Cancelled';
      csv += `${idx + 1},"${formatDateDDMMYYYY(b.date)}","${b.ticketNo}","${b.employeeId}","${b.employeeName}","${b.department || '-'}","${b.routeName}","${b.departureTime}","${b.shift === 'Day' ? 'กะวัน' : 'กะดึก'}","${isCancelled ? 'ยกเลิกแล้ว' : 'ยืนยันแล้ว'}"\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Daily_Booking_Report_${dailyReportDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportDailyReportPDF = () => {
    window.print();
  };

  // Cancel Booking
  const handleCancelBooking = (bookingId: string) => {
    Swal.fire({
      title: 'ยกเลิกการจองรถ?',
      text: 'คุณต้องการยกเลิกการจองของพนักงานรายนี้ใช่หรือไม่? ที่นั่งจะถูกคืนเข้าสู่ระบบ',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ba1a1a',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'ยืนยันยกเลิก',
      cancelButtonText: 'ยกเลิก'
    }).then(async (res) => {
      if (res.isConfirmed) {
        await onCancelBooking(bookingId);
        Swal.fire('เรียบร้อย!', 'ยกเลิกการจองในระบบเรียบร้อยแล้ว', 'success');
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
    const dayTimes = (routeForm.departureTimes?.Day || []).filter(Boolean);
    const nightTimes = (routeForm.departureTimes?.Night || []).filter(Boolean);

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
          Day: dayTimes.length > 0 ? dayTimes : ['17:20', '20:10'],
          Night: nightTimes.length > 0 ? nightTimes : ['08:10']
        }
      };
      await onSaveBusRoute(updatedRoute);
      Swal.fire({
        toast: true,
        position: 'top-end',
        icon: 'success',
        title: 'บันทึกข้อมูลสายรถสำเร็จ!',
        showConfirmButton: false,
        timer: 2000
      });
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
          Day: dayTimes.length > 0 ? dayTimes : ['17:20', '20:10'],
          Night: nightTimes.length > 0 ? nightTimes : ['08:10']
        }
      };
      await onSaveBusRoute(newRoute);
      Swal.fire({
        toast: true,
        position: 'top-end',
        icon: 'success',
        title: 'เพิ่มสายรถใหม่เรียบร้อยแล้ว!',
        showConfirmButton: false,
        timer: 2000
      });
    }
    setRouteModalOpen(false);
    setEditingRoute(null);
  };

  // Departure Time Modal Handlers
  const handleOpenTimeModalForRoute = (route: BusRoute) => {
    setSelectedRouteForTimes(route);
    setTimeModalOpen(true);
  };

  const handleOpenGlobalTimeModal = () => {
    setSelectedRouteForTimes(null);
    setTimeModalOpen(true);
  };

  const handleSaveTimes = async ({
    targetRouteId,
    dayTimes,
    nightTimes,
    applyToAll
  }: {
    targetRouteId?: string;
    dayTimes: string[];
    nightTimes: string[];
    applyToAll: boolean;
  }) => {
    if (applyToAll || !targetRouteId) {
      // Batch apply to all routes
      for (const r of busRoutes) {
        await onSaveBusRoute({
          ...r,
          departureTimes: {
            Day: [...dayTimes],
            Night: [...nightTimes]
          }
        });
      }
      Swal.fire({
        icon: 'success',
        title: 'บันทึกสำเร็จ!',
        text: `อัปเดตรอบเวลาเดินทางให้แก่ทุกสายรถ (${busRoutes.length} สาย) เรียบร้อยแล้ว`,
        timer: 2500,
        showConfirmButton: false
      });
    } else {
      // Apply to single route
      const routeToUpdate = busRoutes.find(r => r.id === targetRouteId);
      if (routeToUpdate) {
        await onSaveBusRoute({
          ...routeToUpdate,
          departureTimes: {
            Day: [...dayTimes],
            Night: [...nightTimes]
          }
        });
        Swal.fire({
          icon: 'success',
          title: 'บันทึกสำเร็จ!',
          text: `อัปเดตรอบเวลาเดินทางของสาย "${routeToUpdate.code} - ${routeToUpdate.name}" เรียบร้อยแล้ว`,
          timer: 2500,
          showConfirmButton: false
        });
      }
    }
  };

  // Toggle Route Active
  const handleToggleRouteActive = async (route: BusRoute) => {
    await onSaveBusRoute({ ...route, active: !route.active });
  };

  // Delete Bus Route
  const handleDeleteBusRoute = (route: BusRoute) => {
    Swal.fire({
      title: 'ลบสายรถนี้?',
      text: `คุณต้องการลบสายรถ "${route.code} - ${route.name}" ใช่หรือไม่?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ba1a1a',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'ยืนยันลบ',
      cancelButtonText: 'ยกเลิก'
    }).then(async res => {
      if (res.isConfirmed) {
        await onDeleteBusRoute(route.id);
        Swal.fire('เรียบร้อย!', 'ลบสายรถออกจากระบบแล้ว', 'success');
      }
    });
  };

  // Save / Add Admin
  const handleSaveAdminSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanUsername = newAdminForm.username.trim();
    const cleanName = newAdminForm.name.trim();
    const cleanPassword = newAdminForm.password.trim();

    if (!cleanUsername || !cleanName) {
      Swal.fire('ข้อมูลไม่ครบถ้วน', 'กรุณาระบุชื่อผู้ใช้งานและชื่อ-นามสกุล', 'warning');
      return;
    }

    if (editingAdmin) {
      // Check username duplicate with other users
      const isDuplicate = admins.some(
        a => a.id !== editingAdmin.id && a.username.toLowerCase() === cleanUsername.toLowerCase()
      );
      if (isDuplicate) {
        Swal.fire('ชื่อผู้ใช้ซ้ำ', `ชื่อผู้ใช้ "${cleanUsername}" มีอยู่ในระบบแล้ว กรุณาใช้ชื่ออื่น`, 'error');
        return;
      }

      const updatedAdmin: AdminUser = {
        ...editingAdmin,
        username: cleanUsername,
        name: cleanName,
        role: newAdminForm.role,
        password: cleanPassword ? cleanPassword : (editingAdmin.password || 'admin123')
      };
      await onSaveAdmin(updatedAdmin);
      Swal.fire({
        icon: 'success',
        title: 'บันทึกสำเร็จ!',
        text: `อัปเดตข้อมูลและรหัสผ่านของผู้ดูแลระบบ "${cleanUsername}" เรียบร้อยแล้ว`,
        timer: 2000,
        showConfirmButton: false
      });
    } else {
      // Validate password for new user
      if (!cleanPassword || cleanPassword.length < 4) {
        Swal.fire('รหัสผ่านไม่ปลอดภัย', 'กรุณากำหนดรหัสผ่านอย่างน้อย 4 ตัวอักษรสำหรับผู้ใช้งานใหม่', 'warning');
        return;
      }

      // Check username duplicate
      const isDuplicate = admins.some(
        a => a.username.toLowerCase() === cleanUsername.toLowerCase()
      );
      if (isDuplicate) {
        Swal.fire('ชื่อผู้ใช้ซ้ำ', `ชื่อผู้ใช้ "${cleanUsername}" มีอยู่ในระบบแล้ว กรุณาใช้ชื่ออื่น`, 'error');
        return;
      }

      const newAdmin: AdminUser = {
        id: `adm-${Date.now()}`,
        username: cleanUsername,
        name: cleanName,
        role: newAdminForm.role,
        password: cleanPassword,
        lastLogin: 'Never',
        createdAt: new Date().toISOString()
      };
      await onSaveAdmin(newAdmin);
      Swal.fire({
        icon: 'success',
        title: 'เพิ่มผู้ดูแลระบบสำเร็จ!',
        text: `สร้างบัญชี "${cleanUsername}" เรียบร้อย สามารถใช้ Username และ Password นี้เข้าสู่ระบบได้ทันที`,
        timer: 2500,
        showConfirmButton: false
      });
    }
    setAdminModalOpen(false);
    setEditingAdmin(null);
    setNewAdminForm({ username: '', name: '', password: '', role: 'Manager' });
    setShowModalPassword(false);
  };

  // Delete Admin
  const handleDeleteAdmin = (adm: AdminUser) => {
    if (admins.length <= 1) {
      Swal.fire('เตือน', 'ไม่สามารถลบผู้ดูแลระบบคนสุดท้ายของระบบได้', 'warning');
      return;
    }
    if (currentAdmin?.id === adm.id) {
      Swal.fire('เตือน', 'คุณไม่สามารถลบบัญชีผู้ดูแลระบบที่คุณกำลังใช้งานอยู่ได้', 'warning');
      return;
    }

    Swal.fire({
      title: 'ลบบัญชีผู้ดูแลระบบ?',
      text: `คุณต้องการลบบัญชี "${adm.username} (${adm.name})" ใช่หรือไม่?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ba1a1a',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'ยืนยันลบ',
      cancelButtonText: 'ยกเลิก'
    }).then(async res => {
      if (res.isConfirmed) {
        await onDeleteAdmin(adm.id);
        Swal.fire('เรียบร้อย!', 'ลบบัญชีผู้ดูแลระบบเรียบร้อยแล้ว', 'success');
      }
    });
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
            onClick={() => setActiveTab('dailyReport')}
            className={`flex items-center gap-3 p-3.5 rounded-xl font-bold text-sm text-left transition-all cursor-pointer ${
              activeTab === 'dailyReport'
                ? 'bg-white text-[#0f2c59] shadow-2xs nav-item-active'
                : 'text-slate-700 hover:bg-white/50'
            }`}
          >
            <CalendarCheck className="w-5 h-5 text-[#0f2c59]" />
            {t('tabDailyReport')}
          </button>

          <button
            onClick={() => setActiveTab('news')}
            className={`flex items-center gap-3 p-3.5 rounded-xl font-bold text-sm text-left transition-all cursor-pointer ${
              activeTab === 'news'
                ? 'bg-white text-[#0f2c59] shadow-2xs nav-item-active'
                : 'text-slate-700 hover:bg-white/50'
            }`}
          >
            <Megaphone className="w-5 h-5 text-[#0f2c59]" />
            {t('tabNews')}
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
                          <th className="p-3 text-center">สถานะ</th>
                          <th className="p-3 text-center no-print">จัดการ</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {bookings.filter(b => b.date === summaryDate).length === 0 ? (
                          <tr>
                            <td colSpan={8} className="p-8 text-center text-slate-400 italic">
                              ไม่มีรายการจองรถในวันที่เลือก
                            </td>
                          </tr>
                        ) : (
                          bookings.filter(b => b.date === summaryDate).map((b, idx) => {
                            const isNoBus = b.routeName.includes('ไม่ขึ้นรถ');
                            const isCancelled = b.status === 'Cancelled';
                            return (
                              <tr key={b.id} className={`hover:bg-slate-50 transition-colors ${isCancelled ? 'bg-slate-50/80 opacity-60' : ''}`}>
                                <td className="p-3 text-center text-slate-500 font-semibold">{idx + 1}</td>
                                <td className="p-3 font-extrabold text-red-600 font-mono">{b.employeeId}</td>
                                <td className="p-3 font-bold text-slate-800">{b.employeeName}</td>
                                <td className="p-3 font-medium text-slate-600">{b.department || 'Production'}</td>
                                <td className={`p-3 font-bold ${isNoBus ? 'text-red-600' : 'text-slate-800'} ${isCancelled ? 'line-through text-slate-400' : ''}`}>
                                  {b.routeName}
                                </td>
                                <td className="p-3 text-center">
                                  <span className={`px-3 py-1 rounded-full text-[11px] font-extrabold inline-block shadow-2xs font-mono ${getTimeBadgeStyle(b.departureTime)}`}>
                                    {b.departureTime}
                                  </span>
                                </td>
                                <td className="p-3 text-center">
                                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold ${
                                    isCancelled ? 'bg-red-100 text-red-800 border border-red-200' : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                  }`}>
                                    {isCancelled ? 'ยกเลิกแล้ว' : 'ยืนยันแล้ว'}
                                  </span>
                                </td>
                                <td className="p-3 text-center no-print">
                                  {!isCancelled ? (
                                    <button
                                      onClick={() => handleCancelBooking(b.id)}
                                      className="px-2.5 py-1 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-lg text-xs font-bold transition-all hover:scale-105 cursor-pointer flex items-center gap-1 mx-auto"
                                      title="ยกเลิกการจองนี้"
                                    >
                                      <X className="w-3.5 h-3.5" />
                                      <span>ยกเลิก</span>
                                    </button>
                                  ) : (
                                    <span className="text-[10px] text-slate-400 italic">ยกเลิกแล้ว</span>
                                  )}
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

          {/* TAB: DAILY BOOKING REPORT */}
          {activeTab === 'dailyReport' && (
            <div className="flex flex-col h-full space-y-5 print-area overflow-y-auto custom-scrollbar pr-1">
              {/* Official Document Print Header */}
              <div className="hidden print:block mb-6 text-center border-b-2 border-slate-800 pb-4">
                <h1 className="text-2xl font-bold text-black">บริษัท ไทย ซันโก้ จำกัด (Thai Sanko Co., Ltd.)</h1>
                <h2 className="text-lg font-bold text-slate-800 mt-1">รายงานรายชื่อพนักงานที่ทำการจองรถประจำวัน</h2>
                <p className="text-xs text-slate-600 mt-1">
                  ประจำวันที่: {formatDateDDMMYYYY(dailyReportDate)} | 
                  วันที่ออกรายงาน: {formatDateDDMMYYYY(new Date().toISOString().split('T')[0])} | 
                  จำนวนรายการจองทั้งหมด: {filteredDailyBookings.length} รายการ
                </p>
              </div>

              {/* Action & Title Bar */}
              <div className="flex flex-col lg:flex-row justify-between lg:items-center gap-4 border-b border-slate-200 pb-4 no-print">
                <div>
                  <div className="flex items-center gap-2">
                    <CalendarCheck className="w-6 h-6 text-[#0f2c59]" />
                    <h3 className="text-2xl font-extrabold text-[#0f2c59]">รายงานรายชื่อพนักงานที่ทำการจองประจำวัน</h3>
                  </div>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">
                    ตรวจสอบ คัดกรอง และส่งออกรายชื่อพนักงานที่จองรถรับส่งประจำวัน แยกตามรอบเวลา แผนก และสายรถ
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={handleExportDailyReportExcel}
                    className="bg-[#1b5e20] hover:bg-[#144718] text-white px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer transition-colors"
                    title="ส่งออกรายงานรายชื่อพนักงานที่จองรถเป็นไฟล์ Excel/CSV"
                  >
                    <FileSpreadsheet className="w-4 h-4" /> Export Excel
                  </button>
                  <button
                    onClick={handleExportDailyReportPDF}
                    className="bg-[#d9534f] hover:bg-[#c9302c] text-white px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer transition-colors"
                    title="พิมพ์หรือส่งออกรายงานเป็นไฟล์ PDF"
                  >
                    <FileText className="w-4 h-4" /> Export PDF / พิมพ์
                  </button>
                </div>
              </div>

              {/* Summary Stats Cards for Selected Date */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 no-print">
                <div className="bg-white/80 border border-slate-200 p-3.5 rounded-2xl shadow-2xs flex items-center gap-3">
                  <div className="p-2.5 bg-[#0f2c59]/10 text-[#0f2c59] rounded-xl">
                    <Ticket className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-[11px] font-bold text-slate-500">ยอดจองทั้งหมด (วันเลือก)</p>
                    <p className="text-lg font-extrabold text-[#0f2c59]">
                      {filteredDailyBookings.length} <span className="text-xs font-medium text-slate-600">รายการ</span>
                    </p>
                  </div>
                </div>

                <div className="bg-white/80 border border-slate-200 p-3.5 rounded-2xl shadow-2xs flex items-center gap-3">
                  <div className="p-2.5 bg-emerald-100 text-emerald-800 rounded-xl">
                    <Bus className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-[11px] font-bold text-slate-500">ขึ้นรถรับส่ง</p>
                    <p className="text-lg font-extrabold text-emerald-800">
                      {filteredDailyBookings.filter(b => b.status === 'Confirmed' && !b.routeName.includes('ไม่ขึ้นรถ')).length} <span className="text-xs font-medium text-slate-600">คน</span>
                    </p>
                  </div>
                </div>

                <div className="bg-white/80 border border-slate-200 p-3.5 rounded-2xl shadow-2xs flex items-center gap-3">
                  <div className="p-2.5 bg-amber-100 text-amber-800 rounded-xl">
                    <AlertTriangle className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-[11px] font-bold text-slate-500">แจ้งไม่ขึ้นรถ</p>
                    <p className="text-lg font-extrabold text-amber-800">
                      {filteredDailyBookings.filter(b => b.status === 'Confirmed' && b.routeName.includes('ไม่ขึ้นรถ')).length} <span className="text-xs font-medium text-slate-600">คน</span>
                    </p>
                  </div>
                </div>

                <div className="bg-white/80 border border-slate-200 p-3.5 rounded-2xl shadow-2xs flex items-center gap-3">
                  <div className="p-2.5 bg-rose-100 text-rose-800 rounded-xl">
                    <X className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-[11px] font-bold text-slate-500">ยกเลิกรายการ</p>
                    <p className="text-lg font-extrabold text-rose-800">
                      {filteredDailyBookings.filter(b => b.status === 'Cancelled').length} <span className="text-xs font-medium text-slate-600">รายการ</span>
                    </p>
                  </div>
                </div>
              </div>

              {/* Filters Bar */}
              <div className="bg-white/80 p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-3 no-print">
                <div className="flex flex-wrap items-center gap-3">
                  {/* Date Selector */}
                  <div className="flex items-center gap-2">
                    <label className="text-xs font-bold text-slate-800 flex items-center gap-1">
                      <Calendar className="w-4 h-4 text-[#0f2c59]" /> เลือกวันที่:
                    </label>
                    <input
                      type="date"
                      value={dailyReportDate}
                      onChange={(e) => setDailyReportDate(e.target.value)}
                      className="bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-[#0f2c59]"
                    />
                  </div>

                  {/* Departure Time Filter */}
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
                    <Clock className="w-4 h-4 text-[#0f2c59]" />
                    <span>รอบเวลา:</span>
                    <select
                      value={dailyReportTimeFilter}
                      onChange={(e) => setDailyReportTimeFilter(e.target.value)}
                      className="bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-[#0f2c59]"
                    >
                      <option value="all">ทุกรอบเวลา (All Times)</option>
                      {matrixTimeSlots.map(time => (
                        <option key={time} value={time}>
                          รอบ {time} น.
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Bus Route Filter */}
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
                    <Bus className="w-4 h-4 text-[#0f2c59]" />
                    <span>สายรถ:</span>
                    <select
                      value={dailyReportRouteFilter}
                      onChange={(e) => setDailyReportRouteFilter(e.target.value)}
                      className="bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-[#0f2c59]"
                    >
                      <option value="all">ทุกสายรถ</option>
                      {busRoutes.map(rt => (
                        <option key={rt.id} value={rt.id}>{rt.name}</option>
                      ))}
                    </select>
                  </div>

                  {/* Department Filter */}
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
                    <span>แผนก:</span>
                    <select
                      value={dailyReportDeptFilter}
                      onChange={(e) => setDailyReportDeptFilter(e.target.value)}
                      className="bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-[#0f2c59]"
                    >
                      <option value="all">ทุกแผนก</option>
                      {uniqueDepartments.map(dept => (
                        <option key={dept} value={dept}>{dept}</option>
                      ))}
                    </select>
                  </div>

                  {/* Status Filter */}
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
                    <span>สถานะ:</span>
                    <select
                      value={dailyReportStatusFilter}
                      onChange={(e) => setDailyReportStatusFilter(e.target.value)}
                      className="bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-[#0f2c59]"
                    >
                      <option value="all">ทั้งหมด</option>
                      <option value="Confirmed">ยืนยันแล้ว</option>
                      <option value="Cancelled">ยกเลิกแล้ว</option>
                    </select>
                  </div>
                </div>

                {/* Search Bar */}
                <div className="relative w-full">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="ค้นหาตามรหัสพนักงาน, ชื่อ-นามสกุล, รหัสตั๋ว หรือสายรถ..."
                    value={dailyReportSearch}
                    onChange={(e) => setDailyReportSearch(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-4 py-1.5 text-xs font-medium text-slate-800 outline-none focus:ring-2 focus:ring-[#0f2c59]"
                  />
                </div>
              </div>

              {/* Data Table */}
              <div className="flex-1 overflow-auto custom-scrollbar border border-slate-200 rounded-2xl bg-white/80 shadow-xs">
                <table className="w-full text-left border-collapse text-xs">
                  <thead className="sticky top-0 bg-[#0f2c59] text-white z-10 font-bold">
                    <tr>
                      <th className="p-3 text-center w-12">ลำดับ</th>
                      <th className="p-3">วันที่จอง</th>
                      <th className="p-3">รหัสตั๋ว</th>
                      <th className="p-3">รหัสพนักงาน</th>
                      <th className="p-3">ชื่อ-นามสกุล</th>
                      <th className="p-3">แผนก</th>
                      <th className="p-3">สายรถที่ทำการจอง</th>
                      <th className="p-3 text-center">รอบเวลา</th>
                      <th className="p-3 text-center">สถานะ</th>
                      <th className="p-3 text-center no-print">จัดการ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200/80">
                    {filteredDailyBookings.length === 0 ? (
                      <tr>
                        <td colSpan={10} className="p-8 text-center text-slate-500 font-medium">
                          ไม่พบรายการจองพนักงานในวันที่และเงื่อนไขที่เลือก ({formatDateDDMMYYYY(dailyReportDate)})
                        </td>
                      </tr>
                    ) : (
                      filteredDailyBookings.map((b, idx) => {
                        const isNoBus = b.routeName.includes('ไม่ขึ้นรถ');
                        const isCancelled = b.status === 'Cancelled';
                        return (
                          <tr key={b.id} className={`hover:bg-slate-50 transition-colors ${isCancelled ? 'bg-slate-50/80 opacity-60' : ''}`}>
                            <td className="p-3 text-center text-slate-400 font-bold">{idx + 1}</td>
                            <td className="p-3 font-semibold text-slate-700">{formatDateDDMMYYYY(b.date)}</td>
                            <td className="p-3 font-mono font-bold text-slate-600">{b.ticketNo}</td>
                            <td className="p-3 font-mono font-bold text-[#0f2c59]">{b.employeeId}</td>
                            <td className="p-3 font-bold text-slate-800">{b.employeeName}</td>
                            <td className="p-3">
                              <span className="bg-slate-100 border border-slate-200 px-2 py-0.5 rounded text-[11px] font-semibold text-slate-700">
                                {b.department || 'Production'}
                              </span>
                            </td>
                            <td className={`p-3 font-bold ${isNoBus ? 'text-red-600' : 'text-slate-800'} ${isCancelled ? 'line-through text-slate-400' : ''}`}>
                              {b.routeName}
                            </td>
                            <td className="p-3 text-center">
                              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold inline-block shadow-2xs font-mono ${getTimeBadgeStyle(b.departureTime)}`}>
                                {b.departureTime}
                              </span>
                            </td>
                            <td className="p-3 text-center">
                              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold ${
                                isCancelled ? 'bg-red-100 text-red-800 border border-red-200' : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                              }`}>
                                {isCancelled ? 'ยกเลิกแล้ว' : 'ยืนยันแล้ว'}
                              </span>
                            </td>
                            <td className="p-3 text-center no-print">
                              {!isCancelled ? (
                                <button
                                  onClick={() => handleCancelBooking(b.id)}
                                  className="px-2.5 py-1 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-lg text-xs font-bold transition-all hover:scale-105 cursor-pointer flex items-center gap-1 mx-auto"
                                  title="ยกเลิกการจองนี้"
                                >
                                  <X className="w-3.5 h-3.5" />
                                  <span>ยกเลิก</span>
                                </button>
                              ) : (
                                <span className="text-[10px] text-slate-400 italic">ยกเลิกแล้ว</span>
                              )}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB: NEWS & ANNOUNCEMENTS MANAGEMENT */}
          {activeTab === 'news' && (
            <div className="flex flex-col h-full space-y-5">
              {/* Action & Title Bar */}
              <div className="flex flex-col lg:flex-row justify-between lg:items-center gap-4 border-b border-slate-200 pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <Megaphone className="w-6 h-6 text-[#0e5d32]" />
                    <h3 className="text-2xl font-extrabold text-[#0e5d32]">
                      จัดการข่าวสารและประกาศ / News Management
                    </h3>
                  </div>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">
                    สร้าง แก้ไข ปักหมุด และแนบเอกสาร PDF หรือรูปภาพ เพื่อประชาสัมพันธ์แก่พนักงาน
                  </p>
                </div>

                <div className="flex items-center gap-2.5">
                  <button
                    onClick={() => {
                      setEditingNews(null);
                      setNewsModalOpen(true);
                    }}
                    className="bg-[#0e5d32] hover:bg-[#0b4a28] text-white px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 shadow-md hover:shadow-lg transition-all cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>เพิ่มข่าวสาร / แนบเอกสารใหม่</span>
                  </button>
                </div>
              </div>

              {/* News Summary Stats Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="bg-white/80 border border-slate-200 p-3.5 rounded-2xl shadow-2xs flex items-center gap-3">
                  <div className="p-2.5 bg-[#0e5d32]/10 text-[#0e5d32] rounded-xl">
                    <Megaphone className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-[11px] font-bold text-slate-500">ข่าวสารทั้งหมด</p>
                    <p className="text-lg font-extrabold text-[#0e5d32]">
                      {news.length} <span className="text-xs font-medium text-slate-600">เรื่อง</span>
                    </p>
                  </div>
                </div>

                <div className="bg-white/80 border border-slate-200 p-3.5 rounded-2xl shadow-2xs flex items-center gap-3">
                  <div className="p-2.5 bg-emerald-100 text-emerald-800 rounded-xl">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-[11px] font-bold text-slate-500">เผยแพร่อยู่</p>
                    <p className="text-lg font-extrabold text-emerald-800">
                      {news.filter((n) => n.status === 'Published').length}{' '}
                      <span className="text-xs font-medium text-slate-600">เรื่อง</span>
                    </p>
                  </div>
                </div>

                <div className="bg-white/80 border border-slate-200 p-3.5 rounded-2xl shadow-2xs flex items-center gap-3">
                  <div className="p-2.5 bg-amber-100 text-amber-800 rounded-xl">
                    <Pin className="w-5 h-5 fill-amber-700" />
                  </div>
                  <div>
                    <p className="text-[11px] font-bold text-slate-500">ข่าวปักหมุด</p>
                    <p className="text-lg font-extrabold text-amber-800">
                      {news.filter((n) => n.pinned).length}{' '}
                      <span className="text-xs font-medium text-slate-600">เรื่อง</span>
                    </p>
                  </div>
                </div>

                <div className="bg-white/80 border border-slate-200 p-3.5 rounded-2xl shadow-2xs flex items-center gap-3">
                  <div className="p-2.5 bg-blue-100 text-blue-800 rounded-xl">
                    <Paperclip className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-[11px] font-bold text-slate-500">ไฟล์แนบทั้งหมด</p>
                    <p className="text-lg font-extrabold text-blue-800">
                      {news.reduce((acc, n) => acc + (n.attachments?.length || 0), 0)}{' '}
                      <span className="text-xs font-medium text-slate-600">ไฟล์</span>
                    </p>
                  </div>
                </div>
              </div>

              {/* Filters & Search */}
              <div className="bg-white/80 p-3.5 rounded-2xl border border-slate-200 shadow-2xs flex flex-col md:flex-row gap-3 items-center justify-between">
                <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
                  <div className="flex items-center gap-1.5 text-xs text-slate-600 font-bold">
                    <Filter className="w-3.5 h-3.5 text-[#0e5d32]" /> หมวดหมู่:
                  </div>
                  <select
                    value={newsCategoryFilter}
                    onChange={(e) => setNewsCategoryFilter(e.target.value)}
                    className="bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-semibold text-slate-800 outline-none"
                  >
                    <option value="all">ทุกหมวดหมู่ (All)</option>
                    <option value="Urgent">ประกาศด่วน</option>
                    <option value="Route">สายรถและเวลา</option>
                    <option value="General">ข่าวทั่วไป</option>
                    <option value="Holiday">วันหยุด</option>
                    <option value="Maintenance">ความปลอดภัย/ซ่อมบำรุง</option>
                  </select>

                  <div className="flex items-center gap-1.5 text-xs text-slate-600 font-bold ml-2">
                    สถานะ:
                  </div>
                  <select
                    value={newsStatusFilter}
                    onChange={(e) => setNewsStatusFilter(e.target.value)}
                    className="bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-semibold text-slate-800 outline-none"
                  >
                    <option value="all">ทุกสถานะ (All)</option>
                    <option value="Published">เผยแพร่แล้ว (Published)</option>
                    <option value="Draft">ฉบับร่าง (Draft)</option>
                  </select>
                </div>

                <div className="relative w-full md:w-64">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={newsSearch}
                    onChange={(e) => setNewsSearch(e.target.value)}
                    placeholder="ค้นหาชื่อหัวข้อ, เนื้อหา..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-8 pr-3 py-1.5 text-xs font-medium text-slate-800 outline-none focus:bg-white focus:ring-2 focus:ring-[#0e5d32]"
                  />
                </div>
              </div>

              {/* Announcements Table */}
              <div className="flex-1 overflow-x-auto overflow-y-auto border border-slate-200 rounded-2xl bg-white shadow-2xs custom-scrollbar">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-50 text-slate-600 font-bold uppercase tracking-wider text-[11px] sticky top-0 z-10 border-b border-slate-200">
                    <tr>
                      <th className="p-3 w-12 text-center">หมุด</th>
                      <th className="p-3 w-32">วันที่ประกาศ</th>
                      <th className="p-3 w-28">หมวดหมู่</th>
                      <th className="p-3">หัวข้อและเนื้อหาประกาศ</th>
                      <th className="p-3 w-36">เอกสารแนบ</th>
                      <th className="p-3 w-36">ผู้ประกาศ</th>
                      <th className="p-3 w-24 text-center">สถานะ</th>
                      <th className="p-3 w-24 text-center">จัดการ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {adminFilteredNews.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="p-8 text-center text-slate-400 font-medium">
                          ไม่พบข้อมูลข่าวสารหรือประกาศ
                        </td>
                      </tr>
                    ) : (
                      adminFilteredNews.map((n) => {
                        const imageAtts = n.attachments?.filter((a) => a.type === 'image') || [];
                        const pdfAtts = n.attachments?.filter((a) => a.type === 'pdf') || [];

                        return (
                          <tr key={n.id} className="hover:bg-slate-50/80 transition-colors">
                            <td className="p-3 text-center">
                              <button
                                onClick={async () => {
                                  await onSaveNews({ ...n, pinned: !n.pinned });
                                }}
                                title={n.pinned ? 'คลิกเพื่อยกเลิกการปักหมุด' : 'คลิกเพื่อปักหมุดข่าวนี้'}
                                className={`p-1 rounded-lg transition-colors cursor-pointer ${
                                  n.pinned
                                    ? 'text-amber-600 bg-amber-50 hover:bg-amber-100'
                                    : 'text-slate-300 hover:text-slate-500 hover:bg-slate-100'
                                }`}
                              >
                                <Pin className={`w-4 h-4 ${n.pinned ? 'fill-amber-600' : ''}`} />
                              </button>
                            </td>
                            <td className="p-3 text-slate-500 font-medium whitespace-nowrap">
                              {new Date(n.createdAt).toLocaleDateString('th-TH', {
                                day: '2-digit',
                                month: 'short',
                                year: 'numeric'
                              })}
                            </td>
                            <td className="p-3 whitespace-nowrap">
                              <span
                                className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                  n.category === 'Urgent'
                                    ? 'bg-red-100 text-red-800'
                                    : n.category === 'Route'
                                    ? 'bg-blue-100 text-blue-800'
                                    : n.category === 'Holiday'
                                    ? 'bg-purple-100 text-purple-800'
                                    : 'bg-emerald-100 text-emerald-800'
                                }`}
                              >
                                {n.category}
                              </span>
                            </td>
                            <td className="p-3">
                              <p className="font-bold text-slate-800 line-clamp-1">{n.title}</p>
                              <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5 font-normal">
                                {n.content}
                              </p>
                            </td>
                            <td className="p-3">
                              {n.attachments?.length > 0 ? (
                                <div className="flex flex-wrap items-center gap-1.5">
                                  {imageAtts.length > 0 && (
                                    <span className="inline-flex items-center gap-0.5 bg-blue-50 text-blue-700 text-[10px] font-bold px-1.5 py-0.5 rounded border border-blue-100">
                                      <ImageIcon className="w-3 h-3" /> {imageAtts.length}
                                    </span>
                                  )}
                                  {pdfAtts.length > 0 && (
                                    <button
                                      type="button"
                                      onClick={async () => {
                                        const first = pdfAtts[0];
                                        if (first) {
                                          let url = first.url;
                                          if (!url || first.hasChunks) {
                                            url = (await loadAttachmentUrl(first)) || url;
                                          }
                                          if (url) {
                                            setAdminPreviewPdf({ name: first.name, url });
                                          }
                                        }
                                      }}
                                      className="inline-flex items-center gap-0.5 bg-red-50 hover:bg-red-100 text-red-700 text-[10px] font-bold px-1.5 py-0.5 rounded border border-red-200 transition-colors cursor-pointer"
                                      title="คลิกเพื่อเปิดดูเอกสาร PDF"
                                    >
                                      <FileText className="w-3 h-3" /> {pdfAtts.length}
                                      <Eye className="w-2.5 h-2.5 ml-0.5" />
                                    </button>
                                  )}
                                </div>
                              ) : (
                                <span className="text-slate-400 text-[11px]">-</span>
                              )}
                            </td>
                            <td className="p-3 text-slate-600 text-xs truncate max-w-[140px]">
                              {n.author}
                            </td>
                            <td className="p-3 text-center whitespace-nowrap">
                              <span
                                className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                  n.status === 'Published'
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : 'bg-slate-100 text-slate-600'
                                }`}
                              >
                                {n.status === 'Published' ? 'เผยแพร่แล้ว' : 'ฉบับร่าง'}
                              </span>
                            </td>
                            <td className="p-3 text-center whitespace-nowrap">
                              <div className="flex items-center justify-center gap-1">
                                <button
                                  onClick={() => {
                                    setEditingNews(n);
                                    setNewsModalOpen(true);
                                  }}
                                  className="p-1 text-blue-600 hover:bg-blue-50 rounded-md transition-colors cursor-pointer"
                                  title="แก้ไขข่าวสาร"
                                >
                                  <Edit3 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => {
                                    Swal.fire({
                                      title: 'ลบข่าวสารนี้?',
                                      text: `คุณต้องการลบ "${n.title}" ใช่หรือไม่?`,
                                      icon: 'warning',
                                      showCancelButton: true,
                                      confirmButtonColor: '#ba1a1a',
                                      cancelButtonColor: '#64748b',
                                      confirmButtonText: 'ยืนยันลบ',
                                      cancelButtonText: 'ยกเลิก'
                                    }).then(async (res) => {
                                      if (res.isConfirmed) {
                                        await onDeleteNews(n.id);
                                        Swal.fire('สำเร็จ', 'ลบข่าวสารเรียบร้อยแล้ว', 'success');
                                      }
                                    });
                                  }}
                                  className="p-1 text-red-600 hover:bg-red-50 rounded-md transition-colors cursor-pointer"
                                  title="ลบข่าวสาร"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 2: EMPLOYEE MANAGEMENT & REPORTS */}
          {activeTab === 'employee' && (
            <div className="flex flex-col h-full space-y-5 print-area">
              {/* Print Only Official Document Header */}
              <div className="hidden print:block mb-6 text-center border-b-2 border-slate-800 pb-4">
                <h1 className="text-2xl font-bold text-black">บริษัท ไทย ซันโก้ จำกัด (Thai Sanko Co., Ltd.)</h1>
                <h2 className="text-lg font-bold text-slate-800 mt-1">รายงานรายชื่อพนักงาน (Employee Directory Report)</h2>
                <p className="text-xs text-slate-600 mt-1">
                  วันที่ออกรายงาน: {formatDateDDMMYYYY(new Date().toISOString().split('T')[0])} | 
                  จำนวนพนักงานทั้งหมด: {employees.length} คน (เปิดใช้งาน: {employees.filter(e => e.status === 'Active').length} คน)
                </p>
              </div>

              {/* Action & Title Bar */}
              <div className="flex flex-col lg:flex-row justify-between lg:items-center gap-4 border-b border-slate-200 pb-4 no-print">
                <div>
                  <div className="flex items-center gap-2">
                    <Users className="w-6 h-6 text-[#0f2c59]" />
                    <h3 className="text-2xl font-extrabold text-[#0f2c59]">รายงานรายชื่อพนักงาน / Employee Directory</h3>
                  </div>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">
                    รายงานข้อมูลพนักงาน แผนก สายรถหลักประจำตัว พร้อมฟังก์ชันส่งออกรายงาน (Excel / PDF)
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={handleExportEmployeeExcel}
                    className="bg-[#1b5e20] hover:bg-[#144718] text-white px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer transition-colors"
                    title="ส่งออกรายงานรายชื่อพนักงานเป็นไฟล์ Excel/CSV"
                  >
                    <FileSpreadsheet className="w-4 h-4" /> Export Excel
                  </button>
                  <button
                    onClick={handleExportEmployeePDF}
                    className="bg-[#d9534f] hover:bg-[#c9302c] text-white px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer transition-colors"
                    title="พิมพ์หรือส่งออกรายงานเป็นไฟล์ PDF"
                  >
                    <FileText className="w-4 h-4" /> Export PDF / พิมพ์
                  </button>
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

              {/* Employee Summary Stats Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 no-print">
                <div className="bg-white/80 border border-slate-200 p-3.5 rounded-2xl shadow-2xs flex items-center gap-3">
                  <div className="p-2.5 bg-[#0f2c59]/10 text-[#0f2c59] rounded-xl">
                    <Users className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-[11px] font-bold text-slate-500">พนักงานทั้งหมด</p>
                    <p className="text-lg font-extrabold text-[#0f2c59]">{employees.length} <span className="text-xs font-medium text-slate-600">คน</span></p>
                  </div>
                </div>

                <div className="bg-white/80 border border-slate-200 p-3.5 rounded-2xl shadow-2xs flex items-center gap-3">
                  <div className="p-2.5 bg-emerald-100 text-emerald-800 rounded-xl">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-[11px] font-bold text-slate-500">สถานะใช้งานอยู่</p>
                    <p className="text-lg font-extrabold text-emerald-800">{employees.filter(e => e.status === 'Active').length} <span className="text-xs font-medium text-slate-600">คน</span></p>
                  </div>
                </div>

                <div className="bg-white/80 border border-slate-200 p-3.5 rounded-2xl shadow-2xs flex items-center gap-3">
                  <div className="p-2.5 bg-slate-100 text-slate-600 rounded-xl">
                    <AlertTriangle className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-[11px] font-bold text-slate-500">สถานะปิดใช้งาน</p>
                    <p className="text-lg font-extrabold text-slate-700">{employees.filter(e => e.status === 'Inactive').length} <span className="text-xs font-medium text-slate-600">คน</span></p>
                  </div>
                </div>

                <div className="bg-white/80 border border-slate-200 p-3.5 rounded-2xl shadow-2xs flex items-center gap-3">
                  <div className="p-2.5 bg-indigo-100 text-indigo-800 rounded-xl">
                    <BadgeCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-[11px] font-bold text-slate-500">จำนวนแผนกงาน</p>
                    <p className="text-lg font-extrabold text-indigo-900">{uniqueDepartments.length} <span className="text-xs font-medium text-slate-600">แผนก</span></p>
                  </div>
                </div>
              </div>

              {/* Filters Bar */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-white/80 p-3.5 rounded-2xl border border-slate-200 shadow-2xs no-print">
                <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
                  <div className="relative flex-1 sm:w-64">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="ค้นหาชื่อ, รหัสพนักงาน, แผนก, หรือสายรถ..."
                      value={employeeSearch}
                      onChange={(e) => setEmployeeSearch(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-4 py-1.5 text-xs font-medium text-slate-800 outline-none focus:ring-2 focus:ring-[#0f2c59]"
                    />
                  </div>

                  {/* Department Filter */}
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
                    <span>แผนก:</span>
                    <select
                      value={employeeDeptFilter}
                      onChange={(e) => setEmployeeDeptFilter(e.target.value)}
                      className="bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-[#0f2c59]"
                    >
                      <option value="all">ทุกแผนก ({employees.length})</option>
                      {uniqueDepartments.map(dept => (
                        <option key={dept} value={dept}>{dept} ({employees.filter(e => e.department === dept).length})</option>
                      ))}
                    </select>
                  </div>

                  {/* Status Filter */}
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
                    <span>สถานะ:</span>
                    <select
                      value={employeeStatusFilter}
                      onChange={(e) => setEmployeeStatusFilter(e.target.value)}
                      className="bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-[#0f2c59]"
                    >
                      <option value="all">ทั้งหมด</option>
                      <option value="Active">ใช้งานอยู่ (Active)</option>
                      <option value="Inactive">ปิดใช้งาน (Inactive)</option>
                    </select>
                  </div>
                </div>

                <div className="text-xs text-slate-500 font-bold self-end sm:self-auto">
                  แสดง {filteredEmployees.length} จาก {employees.length} รายการ
                </div>
              </div>

              {/* Employee Directory Table */}
              <div className="flex-1 overflow-auto custom-scrollbar border border-slate-200 rounded-2xl bg-white/80 shadow-xs">
                <table className="w-full text-left border-collapse">
                  <thead className="sticky top-0 bg-[#0f2c59] text-white z-10 text-xs">
                    <tr>
                      <th className="p-3 font-bold w-12 text-center">ลำดับ</th>
                      <th className="p-3 font-bold">{t('empIdHeader')}</th>
                      <th className="p-3 font-bold">{t('fullNameHeader')}</th>
                      <th className="p-3 font-bold">แผนก (Department)</th>
                      <th className="p-3 font-bold">{t('primaryRouteHeader')}</th>
                      <th className="p-3 font-bold">{t('phoneHeader')}</th>
                      <th className="p-3 font-bold">{t('statusHeader')}</th>
                      <th className="p-3 font-bold text-right no-print">{t('actionsHeader')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200/80 text-xs">
                    {filteredEmployees.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="p-8 text-center text-slate-500 font-medium">
                          ไม่พบข้อมูลพนักงานที่ตรงตามเงื่อนไขการค้นหา
                        </td>
                      </tr>
                    ) : (
                      filteredEmployees.map((emp, idx) => (
                        <tr key={emp.id} className="hover:bg-slate-50 transition-colors">
                          <td className="p-3 text-center font-bold text-slate-400">{idx + 1}</td>
                          <td className="p-3 font-mono font-bold text-[#0f2c59]">{emp.id}</td>
                          <td className="p-3 font-bold text-slate-800">{emp.name}</td>
                          <td className="p-3 text-slate-700">
                            <span className="bg-slate-100 border border-slate-200 px-2.5 py-0.5 rounded-md font-semibold text-[11px]">
                              {emp.department || 'Production'}
                            </span>
                          </td>
                          <td className="p-3 text-slate-600 font-medium">{emp.primaryRoute || '-'}</td>
                          <td className="p-3 font-mono text-slate-700">{emp.phone || '-'}</td>
                          <td className="p-3">
                            <span className={`px-2.5 py-0.5 text-[10px] rounded-full font-bold ${
                              emp.status === 'Active' 
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' 
                                : 'bg-slate-200 text-slate-600'
                            }`}>
                              {emp.status === 'Active' ? 'ใช้งานอยู่' : 'ปิดใช้งาน'}
                            </span>
                          </td>
                          <td className="p-3 text-right space-x-1 no-print">
                            <button
                              onClick={() => {
                                setEditingEmployee(emp);
                                setEmpForm({ id: emp.id, name: emp.name, department: emp.department, primaryRoute: emp.primaryRoute, phone: emp.phone || '', status: emp.status });
                                setEmployeeModalOpen(true);
                              }}
                              className="p-1.5 text-[#0f2c59] hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                              title="แก้ไขข้อมูลพนักงาน"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteEmployee(emp.id)}
                              className="p-1.5 text-red-600 hover:bg-red-100 rounded-lg transition-colors cursor-pointer"
                              title="ลบพนักงาน"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
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
                  <p className="text-xs text-slate-500 font-medium mt-0.5">จัดการข้อมูลสายรถรับส่ง คนขับ ทะเบียน และรอบเวลาออกเดินทาง</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={handleOpenGlobalTimeModal}
                    className="bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-2xs hover:border-slate-400 transition-all cursor-pointer"
                    title="กำหนดหรือแก้ไขรอบเวลาเดินทางมาตรฐานให้ทุกสายรถพร้อมกัน"
                  >
                    <Clock className="w-4 h-4 text-[#0e5d32]" />
                    <span>จัดการรอบเวลาทุกสายรถ</span>
                  </button>
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
                        departureTimes: {
                          Day: ['17:20', '20:10'],
                          Night: ['08:10']
                        }
                      });
                      setRouteModalNewDayTime('');
                      setRouteModalNewNightTime('');
                      setRouteModalOpen(true);
                    }}
                    className="btn-sanko text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md cursor-pointer"
                  >
                    <Plus className="w-4 h-4" /> {t('addRouteBtn')}
                  </button>
                </div>
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
                      <h4 className="font-extrabold text-lg text-slate-800">{route.code} - {route.name}</h4>
                      <div className="mt-1.5">
                        <span className="text-xs font-extrabold text-[#0e5d32] bg-[#59B135]/20 border border-[#59B135]/40 px-3 py-1 rounded-lg inline-flex items-center gap-1.5 shadow-2xs">
                          <span>📍 {route.fromLocation}</span>
                          <span className="text-slate-400">→</span>
                          <span>🏁 {route.toLocation}</span>
                        </span>
                      </div>
                    </div>

                    <div className="text-xs space-y-2 pt-2 border-t border-slate-200">
                      <p className="text-slate-800 flex items-center justify-between">
                        <span><strong>{t('driverNameHeader')}:</strong> {route.driverName}</span>
                        <span className="text-slate-500 font-mono text-[11px] bg-slate-100 px-2 py-0.5 rounded-md">{route.licensePlate}</span>
                      </p>
                      
                      {/* Departure Times Badges for Day and Night */}
                      <div className="space-y-1.5 bg-slate-50/80 p-2.5 rounded-xl border border-slate-200/80">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-[11px] font-bold text-amber-800 flex items-center gap-1 shrink-0">
                            <span>☀️ กะเช้า:</span>
                          </span>
                          {(route.departureTimes?.Day || []).length > 0 ? (
                            route.departureTimes.Day.map(time => (
                              <span key={time} className="px-2 py-0.5 bg-amber-100 text-amber-900 border border-amber-300/80 rounded-md font-mono font-bold text-[11px]">
                                {time}
                              </span>
                            ))
                          ) : (
                            <span className="text-slate-400 text-[11px] italic">ไม่มีรอบเวลา</span>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-[11px] font-bold text-indigo-800 flex items-center gap-1 shrink-0">
                            <span>🌙 กะดึก:</span>
                          </span>
                          {(route.departureTimes?.Night || []).length > 0 ? (
                            route.departureTimes.Night.map(time => (
                              <span key={time} className="px-2 py-0.5 bg-indigo-100 text-indigo-900 border border-indigo-300/80 rounded-md font-mono font-bold text-[11px]">
                                {time}
                              </span>
                            ))
                          ) : (
                            <span className="text-slate-400 text-[11px] italic">ไม่มีรอบเวลา</span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-200">
                      <button
                        onClick={() => handleOpenTimeModalForRoute(route)}
                        className="flex-1 py-2 px-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold text-xs rounded-xl transition-all cursor-pointer border border-emerald-200 flex items-center justify-center gap-1.5 hover:shadow-2xs"
                        title="เพิ่มและแก้ไขรอบเวลาออกเดินทางของสายนี้"
                      >
                        <Clock className="w-3.5 h-3.5 text-emerald-700" />
                        <span>จัดการรอบเวลา</span>
                      </button>
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
                            departureTimes: {
                              Day: route.departureTimes?.Day ? [...route.departureTimes.Day] : ['17:20', '20:10'],
                              Night: route.departureTimes?.Night ? [...route.departureTimes.Night] : ['08:10']
                            }
                          });
                          setRouteModalNewDayTime('');
                          setRouteModalNewNightTime('');
                          setRouteModalOpen(true);
                        }}
                        className="py-2 px-3 bg-slate-100 hover:bg-slate-200 text-[#0f2c59] font-bold text-xs rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-1"
                        title="แก้ไขข้อมูลสายรถและคนขับ"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>แก้ไข</span>
                      </button>
                      <button
                        onClick={() => handleDeleteBusRoute(route)}
                        className="py-2 px-2.5 bg-red-50 hover:bg-red-100 text-red-700 font-bold text-xs rounded-xl transition-colors cursor-pointer border border-red-200 flex items-center gap-1"
                        title="ลบสายรถนี้"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: ADMIN SETTINGS & USER/PASSWORD MANAGEMENT */}
          {activeTab === 'settings' && (
            <div className="flex flex-col h-full space-y-6">
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
                <div>
                  <h3 className="text-2xl font-extrabold text-[#0f2c59] flex items-center gap-2">
                    <Settings className="w-6 h-6 text-[#0f2c59]" />
                    <span>ตั้งค่าระบบและผู้ใช้งาน (User & System Settings)</span>
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
                    จัดการบัญชีผู้ดูแลระบบ กำหนดชื่อผู้ใช้งาน (User) รหัสผ่าน (Password) และสิทธิ์การเข้าใช้งาน
                  </p>
                </div>
                <button
                  onClick={() => {
                    setEditingAdmin(null);
                    setNewAdminForm({ username: '', name: '', password: '', role: 'Manager' });
                    setShowModalPassword(false);
                    setAdminModalOpen(true);
                  }}
                  className="btn-sanko text-white px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 shadow-md cursor-pointer shrink-0 hover:scale-[1.02] active:scale-[0.98] transition-all"
                >
                  <Plus className="w-4 h-4" />
                  <span>เพิ่ม User และ Password</span>
                </button>
              </div>

              {/* Stat Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-white/80 p-4 rounded-2xl border border-slate-200 shadow-2xs flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold">
                    <Shield className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 font-semibold">Superadmin</p>
                    <p className="text-xl font-extrabold text-slate-800">
                      {admins.filter(a => a.role === 'Superadmin').length} บัญชี
                    </p>
                  </div>
                </div>

                <div className="bg-white/80 p-4 rounded-2xl border border-slate-200 shadow-2xs flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
                    <Users className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 font-semibold">Transport Manager</p>
                    <p className="text-xl font-extrabold text-slate-800">
                      {admins.filter(a => a.role === 'Manager').length} บัญชี
                    </p>
                  </div>
                </div>

                <div className="bg-white/80 p-4 rounded-2xl border border-slate-200 shadow-2xs flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                    <Clock className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 font-semibold">Shift Coordinator</p>
                    <p className="text-xl font-extrabold text-slate-800">
                      {admins.filter(a => a.role === 'Coordinator').length} บัญชี
                    </p>
                  </div>
                </div>
              </div>

              {/* System Administrators List */}
              <div className="bg-white/90 rounded-2xl overflow-hidden border border-slate-200 shadow-sm">
                <div className="p-4 bg-gradient-to-r from-[#0f2c59] to-[#1a3d6f] text-white font-bold text-sm flex justify-between items-center">
                  <span className="flex items-center gap-2">
                    <KeyRound className="w-4 h-4 text-amber-300" />
                    <span>รายชื่อผู้ดูแลระบบและรหัสผ่าน (Admin Users & Credentials)</span>
                  </span>
                  <span className="text-xs bg-white/20 px-3 py-1 rounded-full font-medium">
                    {admins.length} บัญชีในระบบ
                  </span>
                </div>

                <div className="divide-y divide-slate-100">
                  {admins.map(adm => {
                    const isRevealed = revealedPasswords[adm.id] || false;
                    const pwdDisplay = adm.password || (adm.username === 'Admin' ? '035746488' : adm.username === 'chanon' ? '0870006622' : 'admin123');
                    const isCopied = copiedAdminId === adm.id;

                    const roleBadgeColor =
                      adm.role === 'Superadmin'
                        ? 'bg-purple-100 text-purple-800 border-purple-200'
                        : adm.role === 'Manager'
                        ? 'bg-blue-100 text-blue-800 border-blue-200'
                        : 'bg-emerald-100 text-emerald-800 border-emerald-200';

                    return (
                      <div key={adm.id} className="p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-50/70 transition-colors">
                        {/* User identity */}
                        <div className="flex items-center gap-3.5 min-w-[220px]">
                          <div className="w-11 h-11 bg-[#0f2c59]/10 text-[#0f2c59] rounded-2xl flex items-center justify-center font-extrabold text-base border border-[#0f2c59]/20 shadow-2xs">
                            {adm.username[0]?.toUpperCase() || 'A'}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-extrabold text-sm sm:text-base text-slate-800 font-mono">
                                {adm.username}
                              </p>
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${roleBadgeColor}`}>
                                {adm.role}
                              </span>
                            </div>
                            <p className="text-xs text-slate-600 font-medium mt-0.5">{adm.name}</p>
                          </div>
                        </div>

                        {/* Password display & action */}
                        <div className="flex items-center gap-2 bg-slate-100/80 px-3.5 py-2 rounded-xl border border-slate-200 w-fit">
                          <KeyRound className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                          <span className="text-xs text-slate-500 font-medium">รหัสผ่าน:</span>
                          <span className="font-mono text-xs font-bold text-slate-800 min-w-[70px] select-all">
                            {isRevealed ? pwdDisplay : '••••••••'}
                          </span>
                          <button
                            type="button"
                            onClick={() => togglePasswordReveal(adm.id)}
                            className="text-slate-400 hover:text-slate-700 p-1 rounded transition-colors cursor-pointer"
                            title={isRevealed ? 'ซ่อนรหัสผ่าน' : 'ดูรหัสผ่าน'}
                          >
                            {isRevealed ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleCopyPassword(adm.id, pwdDisplay)}
                            className="text-slate-400 hover:text-emerald-700 p-1 rounded transition-colors cursor-pointer"
                            title="คัดลอกรหัสผ่าน"
                          >
                            {isCopied ? <CheckCheck className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                          </button>
                        </div>

                        {/* Last Login & timestamps */}
                        <div className="text-xs text-slate-500 min-w-[140px]">
                          <p className="font-semibold text-slate-700">เข้าใช้งานล่าสุด:</p>
                          <p className="font-mono text-[11px] text-slate-500">{adm.lastLogin || 'ไม่เคยเข้าสู่ระบบ'}</p>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2 self-end md:self-center">
                          <button
                            onClick={() => {
                              setEditingAdmin(adm);
                              setNewAdminForm({
                                username: adm.username,
                                name: adm.name,
                                password: pwdDisplay,
                                role: adm.role
                              });
                              setShowModalPassword(false);
                              setAdminModalOpen(true);
                            }}
                            className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-[#0f2c59] rounded-xl transition-all cursor-pointer flex items-center gap-1.5 text-xs font-bold border border-slate-200 hover:shadow-2xs"
                            title="แก้ไขชื่อผู้ใช้และรหัสผ่าน"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                            <span>แก้ไข / เปลี่ยนรหัส</span>
                          </button>
                          <button
                            onClick={() => handleDeleteAdmin(adm)}
                            className="px-3 py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 text-xs font-bold border border-red-200"
                            title="ลบบัญชีผู้ดูแลระบบ"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>ลบ</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Instructions and Security Notice */}
              <div className="bg-amber-50/70 border border-amber-200/80 p-4 sm:p-5 rounded-2xl flex items-start gap-3.5">
                <div className="p-2 bg-amber-100 text-amber-800 rounded-xl shrink-0 mt-0.5">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div className="space-y-1 text-xs text-amber-900 leading-relaxed">
                  <p className="font-extrabold text-sm text-amber-950">คำแนะนำความปลอดภัยและการเข้าใช้งานระบบ (Security Guide):</p>
                  <p>• เมื่อเพิ่มหรือแก้ไข <strong>User</strong> และ <strong>Password</strong> ข้อมูลจะถูกบันทึกเข้าสู่ระบบฐานข้อมูล Firebase Firestore แบบ Realtime</p>
                  <p>• บัญชีที่ถูกเพิ่มสามารถนำ Username และ Password ไปใช้เข้าสู่ระบบที่หน้า <strong>"เข้าสู่ระบบแอดมิน" (Admin Portal)</strong> ได้ทันที</p>
                  <p>• แนะนำให้กำหนดรหัสผ่านที่มีความยาวอย่างน้อย 6-8 ตัวอักษร เพื่อความปลอดภัยในการบริหารจัดการระบบรถรับส่ง</p>
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
                <label className="block font-bold text-slate-700 mb-1">ชื่อสายรถ (Route Name)</label>
                <input
                  type="text"
                  required
                  value={routeForm.name}
                  onChange={(e) => setRouteForm({ ...routeForm, name: e.target.value })}
                  className="w-full bg-slate-50 border p-2.5 rounded-xl font-semibold"
                />
              </div>

              {/* Origin & Destination (ต้นทาง - ปลายทาง) */}
              <div className="grid grid-cols-2 gap-3 bg-emerald-50/50 p-3 rounded-2xl border border-emerald-200/80">
                <div>
                  <label className="block font-bold text-[#0e5d32] mb-1">📍 ต้นทาง (Origin)</label>
                  <input
                    type="text"
                    required
                    value={routeForm.fromLocation}
                    onChange={(e) => setRouteForm({ ...routeForm, fromLocation: e.target.value })}
                    placeholder="e.g. Factory Gate"
                    className="w-full bg-white border border-emerald-300 p-2.5 rounded-xl font-bold text-slate-800 focus:ring-2 focus:ring-[#0e5d32] outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-[#0e5d32] mb-1">🏁 ปลายทาง (Destination)</label>
                  <input
                    type="text"
                    required
                    value={routeForm.toLocation}
                    onChange={(e) => setRouteForm({ ...routeForm, toLocation: e.target.value })}
                    placeholder="e.g. Canteen"
                    className="w-full bg-white border border-emerald-300 p-2.5 rounded-xl font-bold text-slate-800 focus:ring-2 focus:ring-[#0e5d32] outline-none"
                  />
                </div>
              </div>

              {/* Driver Name & License Plate */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">ชื่อคนขับ (Driver Name)</label>
                  <input
                    type="text"
                    value={routeForm.driverName}
                    onChange={(e) => setRouteForm({ ...routeForm, driverName: e.target.value })}
                    className="w-full bg-slate-50 border p-2.5 rounded-xl font-medium"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">ทะเบียนรถ (License Plate)</label>
                  <input
                    type="text"
                    value={routeForm.licensePlate}
                    onChange={(e) => setRouteForm({ ...routeForm, licensePlate: e.target.value })}
                    className="w-full bg-slate-50 border p-2.5 rounded-xl font-medium"
                  />
                </div>
              </div>

              {/* Capacity & Active Status */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">จำนวนที่นั่ง (Capacity)</label>
                  <input
                    type="number"
                    required
                    min={1}
                    max={100}
                    value={routeForm.capacity}
                    onChange={(e) => setRouteForm({ ...routeForm, capacity: Number(e.target.value) })}
                    className="w-full bg-slate-50 border p-2.5 rounded-xl font-bold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">สถานะ (Status)</label>
                  <select
                    value={routeForm.active ? 'true' : 'false'}
                    onChange={(e) => setRouteForm({ ...routeForm, active: e.target.value === 'true' })}
                    className="w-full bg-slate-50 border p-2.5 rounded-xl font-bold"
                  >
                    <option value="true">เปิดใช้งาน (Active)</option>
                    <option value="false">ปิดใช้งาน (Inactive)</option>
                  </select>
                </div>
              </div>

              {/* Departure Times dynamic management inside route modal */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3.5">
                <div className="flex justify-between items-center">
                  <label className="block font-extrabold text-slate-800 text-xs">
                    รอบเวลาออกเดินทาง (Departure Times)
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      if (editingRoute) {
                        handleOpenTimeModalForRoute(editingRoute);
                      } else {
                        handleOpenGlobalTimeModal();
                      }
                    }}
                    className="text-[#0e5d32] hover:text-[#0b4a28] font-bold text-[11px] flex items-center gap-1 cursor-pointer"
                  >
                    <Clock className="w-3.5 h-3.5" />
                    <span>จัดการรอบเวลาขั้นสูง</span>
                  </button>
                </div>

                {/* Day Shift Section */}
                <div className="space-y-2 bg-white p-3 rounded-xl border border-amber-200/80">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-extrabold text-amber-800 flex items-center gap-1">
                      <span>☀️ กะเช้า / กลางวัน (Day Shift)</span>
                    </span>
                    <span className="text-[10px] text-slate-400 font-semibold">
                      {(routeForm.departureTimes?.Day || []).length} รอบ
                    </span>
                  </div>

                  {/* Day Chips */}
                  <div className="flex flex-wrap gap-1.5 min-h-7 items-center">
                    {(routeForm.departureTimes?.Day || []).map(time => (
                      <span
                        key={time}
                        className="inline-flex items-center gap-1 bg-amber-50 text-amber-900 border border-amber-300 px-2.5 py-1 rounded-lg font-mono font-bold text-xs"
                      >
                        {time}
                        <button
                          type="button"
                          onClick={() => {
                            setRouteForm({
                              ...routeForm,
                              departureTimes: {
                                ...routeForm.departureTimes,
                                Day: routeForm.departureTimes.Day.filter(t => t !== time)
                              }
                            });
                          }}
                          className="hover:text-red-600 transition-colors cursor-pointer"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                    {(routeForm.departureTimes?.Day || []).length === 0 && (
                      <span className="text-[11px] text-slate-400 italic">ยังไม่มีรอบเวลากะเช้า</span>
                    )}
                  </div>

                  {/* Add Day Time Input & Quick presets */}
                  <div className="flex items-center gap-1.5 pt-1">
                    <input
                      type="time"
                      value={routeModalNewDayTime}
                      onChange={(e) => setRouteModalNewDayTime(e.target.value)}
                      className="bg-slate-50 border border-slate-300 rounded-lg px-2 py-1 text-xs font-mono font-bold text-slate-800 outline-none focus:ring-1 focus:ring-amber-500 w-28"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const val = routeModalNewDayTime.trim();
                        if (val && !routeForm.departureTimes.Day.includes(val)) {
                          setRouteForm({
                            ...routeForm,
                            departureTimes: {
                              ...routeForm.departureTimes,
                              Day: [...routeForm.departureTimes.Day, val].sort()
                            }
                          });
                          setRouteModalNewDayTime('');
                        }
                      }}
                      className="bg-amber-500 hover:bg-amber-600 text-white px-2.5 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                    >
                      + เพิ่ม
                    </button>
                    <div className="flex items-center gap-1 overflow-x-auto">
                      {['17:20', '20:10', '21:30'].map(p => (
                        <button
                          key={p}
                          type="button"
                          onClick={() => {
                            if (!routeForm.departureTimes.Day.includes(p)) {
                              setRouteForm({
                                ...routeForm,
                                departureTimes: {
                                  ...routeForm.departureTimes,
                                  Day: [...routeForm.departureTimes.Day, p].sort()
                                }
                              });
                            }
                          }}
                          className="px-1.5 py-0.5 text-[10px] bg-slate-100 hover:bg-amber-100 text-slate-600 rounded font-mono font-bold cursor-pointer"
                        >
                          +{p}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Night Shift Section */}
                <div className="space-y-2 bg-white p-3 rounded-xl border border-indigo-200/80">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-extrabold text-indigo-800 flex items-center gap-1">
                      <span>🌙 กะดึก / กลางคืน (Night Shift)</span>
                    </span>
                    <span className="text-[10px] text-slate-400 font-semibold">
                      {(routeForm.departureTimes?.Night || []).length} รอบ
                    </span>
                  </div>

                  {/* Night Chips */}
                  <div className="flex flex-wrap gap-1.5 min-h-7 items-center">
                    {(routeForm.departureTimes?.Night || []).map(time => (
                      <span
                        key={time}
                        className="inline-flex items-center gap-1 bg-indigo-50 text-indigo-900 border border-indigo-300 px-2.5 py-1 rounded-lg font-mono font-bold text-xs"
                      >
                        {time}
                        <button
                          type="button"
                          onClick={() => {
                            setRouteForm({
                              ...routeForm,
                              departureTimes: {
                                ...routeForm.departureTimes,
                                Night: routeForm.departureTimes.Night.filter(t => t !== time)
                              }
                            });
                          }}
                          className="hover:text-red-600 transition-colors cursor-pointer"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                    {(routeForm.departureTimes?.Night || []).length === 0 && (
                      <span className="text-[11px] text-slate-400 italic">ยังไม่มีรอบเวลากะดึก</span>
                    )}
                  </div>

                  {/* Add Night Time Input & Quick presets */}
                  <div className="flex items-center gap-1.5 pt-1">
                    <input
                      type="time"
                      value={routeModalNewNightTime}
                      onChange={(e) => setRouteModalNewNightTime(e.target.value)}
                      className="bg-slate-50 border border-slate-300 rounded-lg px-2 py-1 text-xs font-mono font-bold text-slate-800 outline-none focus:ring-1 focus:ring-indigo-500 w-28"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const val = routeModalNewNightTime.trim();
                        if (val && !routeForm.departureTimes.Night.includes(val)) {
                          setRouteForm({
                            ...routeForm,
                            departureTimes: {
                              ...routeForm.departureTimes,
                              Night: [...routeForm.departureTimes.Night, val].sort()
                            }
                          });
                          setRouteModalNewNightTime('');
                        }
                      }}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white px-2.5 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                    >
                      + เพิ่ม
                    </button>
                    <div className="flex items-center gap-1 overflow-x-auto">
                      {['05:30', '08:10', '08:30'].map(p => (
                        <button
                          key={p}
                          type="button"
                          onClick={() => {
                            if (!routeForm.departureTimes.Night.includes(p)) {
                              setRouteForm({
                                ...routeForm,
                                departureTimes: {
                                  ...routeForm.departureTimes,
                                  Night: [...routeForm.departureTimes.Night, p].sort()
                                }
                              });
                            }
                          }}
                          className="px-1.5 py-0.5 text-[10px] bg-slate-100 hover:bg-indigo-100 text-slate-600 rounded font-mono font-bold cursor-pointer"
                        >
                          +{p}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
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

      {/* MODAL 3: NEW / EDIT ADMIN USER & PASSWORD */}
      {adminModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white p-6 sm:p-7 rounded-3xl max-w-md w-full shadow-2xl space-y-4 border border-slate-100">
            <div className="flex justify-between items-center border-b pb-3.5">
              <div>
                <h3 className="font-extrabold text-lg text-slate-900 flex items-center gap-2">
                  <KeyRound className="w-5 h-5 text-[#0f2c59]" />
                  <span>{editingAdmin ? 'แก้ไขผู้ดูแลระบบและรหัสผ่าน' : 'เพิ่ม User และ Password ใหม่'}</span>
                </h3>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  {editingAdmin ? 'แก้ไขข้อมูลผู้ใช้และปรับปรุงรหัสผ่านเข้าสู่ระบบ' : 'สร้างบัญชีผู้ใช้งานและกำหนดรหัสผ่านสำหรับเจ้าหน้าที่'}
                </p>
              </div>
              <button
                onClick={() => setAdminModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveAdminSubmit} className="space-y-4 text-xs">
              {/* Username Field */}
              <div>
                <label className="block font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-[#0f2c59]" />
                  <span>{t('usernameLabel')} (ชื่อผู้ใช้งาน) <span className="text-red-500">*</span></span>
                </label>
                <input
                  type="text"
                  required
                  value={newAdminForm.username}
                  onChange={(e) => setNewAdminForm({ ...newAdminForm, username: e.target.value })}
                  placeholder="เช่น admin_transport, chanon_sanko"
                  className="w-full bg-slate-50 border border-slate-300 focus:border-[#0f2c59] p-3 rounded-xl font-bold font-mono text-slate-800 outline-none focus:ring-2 focus:ring-[#0f2c59]/20 transition-all text-xs"
                />
                <p className="text-[11px] text-slate-400 mt-1">ใช้สำหรับเข้าสู่ระบบที่หน้าล็อกอิน (ภาษาอังกฤษหรือตัวเลข)</p>
              </div>

              {/* Password Field with Toggle and Generator */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="font-bold text-slate-700 flex items-center gap-1.5">
                    <KeyRound className="w-3.5 h-3.5 text-[#0f2c59]" />
                    <span>{t('passwordLabel')} (รหัสผ่าน) <span className="text-red-500">*</span></span>
                  </label>
                  <button
                    type="button"
                    onClick={generateRandomPassword}
                    className="text-[11px] text-[#0f2c59] hover:text-[#1a3d6f] font-bold flex items-center gap-1 hover:underline cursor-pointer"
                    title="สุ่มรหัสผ่านอัตโนมัติ"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>สุ่มรหัสผ่าน</span>
                  </button>
                </div>

                <div className="relative">
                  <input
                    type={showModalPassword ? 'text' : 'password'}
                    required={!editingAdmin}
                    value={newAdminForm.password}
                    onChange={(e) => setNewAdminForm({ ...newAdminForm, password: e.target.value })}
                    placeholder={editingAdmin ? 'ระบุรหัสผ่านใหม่ หรือคงเดิมไว้' : 'ระบุรหัสผ่านอย่างน้อย 4 ตัวอักษร'}
                    className="w-full bg-slate-50 border border-slate-300 focus:border-[#0f2c59] p-3 pr-10 rounded-xl font-mono font-bold text-slate-800 outline-none focus:ring-2 focus:ring-[#0f2c59]/20 transition-all text-xs"
                  />
                  <button
                    type="button"
                    onClick={() => setShowModalPassword(!showModalPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors p-1"
                    title={showModalPassword ? 'ซ่อนรหัสผ่าน' : 'แสดงรหัสผ่าน'}
                  >
                    {showModalPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  {editingAdmin ? 'หากไม่ต้องการเปลี่ยนรหัสผ่าน สามารถเว้นว่างหรือคงรหัสเดิมไว้ได้' : 'กำหนดรหัสผ่านสำหรับล็อกอินเข้าแอดมิน (อย่างน้อย 4 ตัวอักษร)'}
                </p>
              </div>

              {/* Full Name Field */}
              <div>
                <label className="block font-bold text-slate-700 mb-1.5">
                  {t('fullNameHeader')} / ตำแหน่ง (Full Name & Dept) <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={newAdminForm.name}
                  onChange={(e) => setNewAdminForm({ ...newAdminForm, name: e.target.value })}
                  placeholder="เช่น สมศักดิ์ จัดการเดินรถ (HR & GA)"
                  className="w-full bg-slate-50 border border-slate-300 focus:border-[#0f2c59] p-3 rounded-xl font-semibold text-slate-800 outline-none focus:ring-2 focus:ring-[#0f2c59]/20 transition-all text-xs"
                />
              </div>

              {/* Role Selection */}
              <div>
                <label className="block font-bold text-slate-700 mb-1.5">
                  สิทธิ์การใช้งาน (Admin Role) <span className="text-red-500">*</span>
                </label>
                <select
                  value={newAdminForm.role}
                  onChange={(e) => setNewAdminForm({ ...newAdminForm, role: e.target.value as any })}
                  className="w-full bg-slate-50 border border-slate-300 focus:border-[#0f2c59] p-3 rounded-xl font-semibold text-slate-800 outline-none focus:ring-2 focus:ring-[#0f2c59]/20 transition-all text-xs"
                >
                  <option value="Manager">Transport Manager (ผู้จัดการฝ่ายเดินรถ)</option>
                  <option value="Superadmin">Superadmin (ผู้ดูแลระบบสูงสุด)</option>
                  <option value="Coordinator">Shift Coordinator (ผู้ประสานงานกะ)</option>
                </select>
              </div>

              {/* Action Buttons */}
              <div className="pt-3 flex gap-3">
                <button
                  type="button"
                  onClick={() => setAdminModalOpen(false)}
                  className="flex-1 border border-slate-200 py-3 rounded-xl font-bold text-slate-600 hover:bg-slate-50 cursor-pointer transition-colors"
                >
                  {t('cancel')}
                </button>
                <button
                  type="submit"
                  className="flex-1 btn-sanko text-white py-3 rounded-xl font-bold cursor-pointer shadow-md hover:shadow-lg transition-all"
                >
                  {editingAdmin ? 'บันทึกการเปลี่ยนแปลง' : 'ยืนยันเพิ่ม User & Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* News & Announcement Editor Modal */}
      <NewsEditorModal
        isOpen={newsModalOpen}
        onClose={() => setNewsModalOpen(false)}
        onSave={onSaveNews}
        initialData={editingNews}
        currentAdminName={currentAdmin?.name}
      />

      {/* Admin PDF Viewer Modal */}
      {adminPreviewPdf && (
        <PdfViewerModal
          name={adminPreviewPdf.name}
          url={adminPreviewPdf.url}
          onClose={() => setAdminPreviewPdf(null)}
        />
      )}

      {/* Departure Time Management Modal (Per Route or Factory-Wide) */}
      <DepartureTimeModal
        isOpen={timeModalOpen}
        onClose={() => {
          setTimeModalOpen(false);
          setSelectedRouteForTimes(null);
        }}
        targetRoute={selectedRouteForTimes}
        allRoutes={busRoutes}
        onSaveTimes={handleSaveTimes}
      />
    </section>
  );
};
