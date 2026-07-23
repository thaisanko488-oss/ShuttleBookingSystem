import React, { useState, useEffect } from 'react';
import { NavView, Employee, BusRoute, Booking, AdminUser, SystemNotice } from './types';
import {
  subscribeEmployees, saveEmployeeDoc, deleteEmployeeDoc,
  subscribeBusRoutes, saveBusRouteDoc, deleteBusRouteDoc,
  subscribeBookings, addBookingDoc, updateBookingStatusDoc,
  subscribeAdmins, saveAdminDoc,
  subscribeSystemNotice, saveSystemNoticeDoc
} from './services/firebaseService';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { EmployeeBookingView } from './components/EmployeeBookingView';
import { UserManualView } from './components/UserManualView';
import { AdminLoginView } from './components/AdminLoginView';
import { AdminDashboardView } from './components/AdminDashboardView';
import { Bell } from 'lucide-react';

export default function App() {
  const [currentView, setCurrentView] = useState<NavView>('employee-booking');

  // Application Data State synced from Firebase Firestore
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [busRoutes, setBusRoutes] = useState<BusRoute[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [systemNotice, setSystemNotice] = useState<SystemNotice>({
    enabled: true,
    message: 'กรุณาสำรองที่นั่งก่อนเวลาเดินทางอย่างน้อย 1 ชั่วโมง / Please book at least 1 hour prior to departure.'
  });

  // Admin Auth State
  const [currentAdmin, setCurrentAdmin] = useState<AdminUser | null>(null);

  // Subscribe to Firebase Firestore real-time snapshots
  useEffect(() => {
    const unsubEmp = subscribeEmployees(setEmployees);
    const unsubRoutes = subscribeBusRoutes(setBusRoutes);
    const unsubBookings = subscribeBookings(setBookings);
    const unsubAdmins = subscribeAdmins(setAdmins);
    const unsubNotice = subscribeSystemNotice(setSystemNotice);

    return () => {
      unsubEmp();
      unsubRoutes();
      unsubBookings();
      unsubAdmins();
      unsubNotice();
    };
  }, []);

  // Booking handlers
  const handleAddBooking = async (newBooking: Booking) => {
    await addBookingDoc(newBooking);
  };

  const handleCancelBooking = async (bookingId: string) => {
    await updateBookingStatusDoc(bookingId, 'Cancelled');
  };

  // Admin handlers
  const handleAdminLoginSuccess = (admin: AdminUser) => {
    setCurrentAdmin(admin);
    setCurrentView('admin-dashboard');
  };

  const handleAdminLogout = () => {
    setCurrentAdmin(null);
    setCurrentView('employee-booking');
  };

  const handleSaveEmployee = async (emp: Employee) => {
    await saveEmployeeDoc(emp);
  };

  const handleDeleteEmployee = async (id: string) => {
    await deleteEmployeeDoc(id);
  };

  const handleSaveBusRoute = async (route: BusRoute) => {
    await saveBusRouteDoc(route);
  };

  const handleDeleteBusRoute = async (id: string) => {
    await deleteBusRouteDoc(id);
  };

  const handleSaveAdmin = async (admin: AdminUser) => {
    await saveAdminDoc(admin);
  };

  const handleUpdateNotice = async (notice: SystemNotice) => {
    await saveSystemNoticeDoc(notice);
  };

  return (
    <div className="min-h-screen flex flex-col justify-between relative selection:bg-slate-200 selection:text-slate-950">
      {/* Animated Canvas Background */}
      <div className="bg-animated"></div>

      {/* Navigation Bar */}
      <Navbar
        currentView={currentView}
        setCurrentView={setCurrentView}
        isAdminLoggedIn={!!currentAdmin}
        onLogoutAdmin={handleAdminLogout}
      />

      {/* Main View Container */}
      <main className="pt-28 pb-16 px-4 sm:px-8 max-w-7xl mx-auto w-full flex-1">
        {systemNotice.enabled && systemNotice.message && (
          <div className="bg-[#0f2c59]/10 border border-[#0f2c59]/30 text-[#0f2c59] px-4 py-3 rounded-2xl mb-6 flex items-center gap-3 shadow-2xs max-w-7xl mx-auto animate-in fade-in duration-300">
            <Bell className="w-5 h-5 text-[#0f2c59] shrink-0 animate-bounce" />
            <span className="text-xs sm:text-sm font-semibold">{systemNotice.message}</span>
          </div>
        )}

        {currentView === 'employee-booking' && (
          <EmployeeBookingView
            employees={employees}
            busRoutes={busRoutes}
            bookings={bookings}
            onAddBooking={handleAddBooking}
            onOpenUserManual={() => setCurrentView('user-manual')}
          />
        )}

        {currentView === 'user-manual' && (
          <UserManualView
            onBackToBooking={() => setCurrentView('employee-booking')}
          />
        )}

        {currentView === 'admin-login' && (
          <AdminLoginView
            admins={admins}
            onLoginSuccess={handleAdminLoginSuccess}
          />
        )}

        {currentView === 'admin-dashboard' && (
          <AdminDashboardView
            currentAdmin={currentAdmin}
            bookings={bookings}
            employees={employees}
            busRoutes={busRoutes}
            admins={admins}
            systemNotice={systemNotice}
            onLogout={handleAdminLogout}
            onCancelBooking={handleCancelBooking}
            onSaveEmployee={handleSaveEmployee}
            onDeleteEmployee={handleDeleteEmployee}
            onSaveBusRoute={handleSaveBusRoute}
            onDeleteBusRoute={handleDeleteBusRoute}
            onSaveAdmin={handleSaveAdmin}
            onUpdateNotice={handleUpdateNotice}
          />
        )}
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}
