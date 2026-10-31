import React, { useState, useEffect } from 'react';
import { NavView, Employee, BusRoute, Booking, AdminUser, SystemNotice, NewsArticle } from './types';
import {
  subscribeEmployees, saveEmployeeDoc, deleteEmployeeDoc,
  subscribeBusRoutes, saveBusRouteDoc, deleteBusRouteDoc,
  subscribeBookings, addBookingDoc, updateBookingStatusDoc,
  subscribeAdmins, saveAdminDoc, deleteAdminDoc,
  subscribeSystemNotice, saveSystemNoticeDoc,
  subscribeNews, saveNewsDoc, deleteNewsDoc
} from './services/firebaseService';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { EmployeeBookingView } from './components/EmployeeBookingView';
import { NewsView } from './components/NewsView';
import { UserManualView } from './components/UserManualView';
import { AdminLoginView } from './components/AdminLoginView';
import { AdminDashboardView } from './components/AdminDashboardView';

export default function App() {
  // Read initial view from URL query (?view=...) or hash (#...)
  const getInitialView = (): NavView => {
    try {
      const params = new URLSearchParams(window.location.search);
      const viewParam = params.get('view');
      if (viewParam === 'news') return 'news';
      if (viewParam === 'user-manual') return 'user-manual';
      if (viewParam === 'admin-login') return 'admin-login';
      if (viewParam === 'admin-dashboard') return 'admin-dashboard';
      if (viewParam === 'employee-booking') return 'employee-booking';

      const hash = window.location.hash.replace('#', '');
      if (hash === 'news') return 'news';
      if (hash === 'user-manual') return 'user-manual';
      if (hash === 'admin-login') return 'admin-login';
      if (hash === 'admin-dashboard') return 'admin-dashboard';
    } catch {
      // ignore
    }
    return 'employee-booking';
  };

  const [currentView, setCurrentView] = useState<NavView>(getInitialView);

  // Sync view changes with browser history & URL search params
  const handleSetView = (view: NavView) => {
    setCurrentView(view);
    try {
      const url = new URL(window.location.href);
      if (view === 'employee-booking') {
        url.searchParams.delete('view');
      } else {
        url.searchParams.set('view', view);
      }
      window.history.pushState({ view }, '', url.toString());
    } catch {
      // ignore
    }
  };

  // Listen to popstate for browser back/forward buttons
  useEffect(() => {
    const onPopState = () => {
      setCurrentView(getInitialView());
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  // Application Data State synced from Firebase Firestore
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [busRoutes, setBusRoutes] = useState<BusRoute[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [news, setNews] = useState<NewsArticle[]>([]);
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
    const unsubNews = subscribeNews(setNews);

    return () => {
      unsubEmp();
      unsubRoutes();
      unsubBookings();
      unsubAdmins();
      unsubNotice();
      unsubNews();
    };
  }, []);

  // Booking handlers
  const handleAddBooking = async (newBooking: Booking) => {
    await addBookingDoc(newBooking);
  };

  const handleCancelBooking = async (bookingId: string) => {
    await updateBookingStatusDoc(bookingId, 'Cancelled');
  };

  // News handlers
  const handleSaveNews = async (article: NewsArticle) => {
    setNews(prev => {
      const idx = prev.findIndex(n => n.id === article.id);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = article;
        return copy;
      }
      return [article, ...prev];
    });
    try {
      await saveNewsDoc(article);
    } catch (err) {
      console.error('Failed to save news article:', err);
      throw err;
    }
  };

  const handleDeleteNews = async (id: string) => {
    // Immediately remove from state so the item disappears with 0 lag
    setNews(prev => prev.filter(n => n.id !== id));
    try {
      await deleteNewsDoc(id);
    } catch (err) {
      console.error('Failed to delete news article:', err);
      throw err;
    }
  };


  // Admin handlers
  const handleAdminLoginSuccess = (admin: AdminUser) => {
    setCurrentAdmin(admin);
    setCurrentView('admin-dashboard');
  };

  const handleAdminLogout = () => {
    setCurrentAdmin(null);
    handleSetView('employee-booking');
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

  const handleDeleteAdmin = async (id: string) => {
    await deleteAdminDoc(id);
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
        setCurrentView={handleSetView}
        isAdminLoggedIn={!!currentAdmin}
        onLogoutAdmin={handleAdminLogout}
      />

      {/* Main View Container */}
      <main className="pt-28 pb-16 px-4 sm:px-8 max-w-7xl mx-auto w-full flex-1">
        {currentView === 'employee-booking' && (
          <EmployeeBookingView
            employees={employees}
            busRoutes={busRoutes}
            bookings={bookings}
            onAddBooking={handleAddBooking}
            onOpenUserManual={() => handleSetView('user-manual')}
          />
        )}

        {currentView === 'news' && (
          <NewsView
            news={news}
            currentAdmin={currentAdmin}
            onSaveNews={handleSaveNews}
            onDeleteNews={handleDeleteNews}
          />
        )}

        {currentView === 'user-manual' && (
          <UserManualView
            onBackToBooking={() => handleSetView('employee-booking')}
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
            news={news}
            onLogout={handleAdminLogout}
            onCancelBooking={handleCancelBooking}
            onSaveEmployee={handleSaveEmployee}
            onDeleteEmployee={handleDeleteEmployee}
            onSaveBusRoute={handleSaveBusRoute}
            onDeleteBusRoute={handleDeleteBusRoute}
            onSaveAdmin={handleSaveAdmin}
            onDeleteAdmin={handleDeleteAdmin}
            onUpdateNotice={handleUpdateNotice}
            onSaveNews={handleSaveNews}
            onDeleteNews={handleDeleteNews}
          />
        )}
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}
