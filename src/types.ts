export type NavView = 'employee-booking' | 'news' | 'user-manual' | 'admin-login' | 'admin-dashboard';

export type AdminTab = 'summary' | 'dailyReport' | 'news' | 'bookings' | 'employee' | 'bus' | 'settings';

export type WorkShift = 'Day' | 'Night';

export interface NewsAttachment {
  id: string;
  name: string;
  type: 'image' | 'pdf';
  url: string; // Base64 data URL or remote URL
  size?: string; // e.g. "1.2 MB"
  hasChunks?: boolean;
  thumbnailUrl?: string;
}

export type NewsCategory = 'General' | 'Urgent' | 'Route' | 'Holiday' | 'Maintenance';

export interface NewsArticle {
  id: string;
  title: string;
  category: NewsCategory;
  content: string;
  author: string;
  createdAt: string; // ISO date string
  updatedAt?: string;
  pinned?: boolean;
  status: 'Published' | 'Draft';
  attachments: NewsAttachment[];
}

export interface Employee {
  id: string;
  name: string;
  department: string;
  primaryRoute: string;
  phone?: string;
  status: 'Active' | 'Inactive';
  totalBookings?: number;
}

export interface BusRoute {
  id: string;
  code: string;
  name: string;
  fromLocation: string;
  toLocation: string;
  driverName: string;
  licensePlate: string;
  capacity: number;
  active: boolean;
  departureTimes: {
    Day: string[];
    Night: string[];
  };
}

export interface Booking {
  id: string;
  ticketNo: string;
  employeeId: string;
  employeeName: string;
  department: string;
  date: string; // YYYY-MM-DD
  routeId: string;
  routeName: string;
  shift: WorkShift;
  departureTime: string;
  seatNumber: number;
  status: 'Confirmed' | 'Completed' | 'Cancelled';
  createdAt: string;
}

export interface AdminUser {
  id: string;
  username: string;
  name: string;
  role: 'Superadmin' | 'Manager' | 'Coordinator';
  password?: string;
  lastLogin: string;
  createdAt?: string;
}

export interface SystemNotice {
  enabled: boolean;
  message: string;
}
