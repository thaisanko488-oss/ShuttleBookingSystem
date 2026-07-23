export type NavView = 'employee-booking' | 'user-manual' | 'admin-login' | 'admin-dashboard';

export type AdminTab = 'summary' | 'employee' | 'bus' | 'settings';

export type WorkShift = 'Day' | 'Night';

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
  lastLogin: string;
}

export interface SystemNotice {
  enabled: boolean;
  message: string;
}
