import { Employee, BusRoute, Booking, AdminUser } from '../types';

export const INITIAL_EMPLOYEES: Employee[] = [];

export const INITIAL_BUS_ROUTES: BusRoute[] = [
  {
    id: "route-a",
    code: "Route A",
    name: "Route A",
    fromLocation: "Main Gate",
    toLocation: "Production Plant 1",
    driverName: "Somchai Jaidee",
    licensePlate: "30-1452 Ayutthaya",
    capacity: 45,
    active: true,
    departureTimes: {
      Day: ["17:20", "20:10"],
      Night: ["08:10"]
    }
  },
  {
    id: "route-b",
    code: "Route B",
    name: "Route B",
    fromLocation: "Logistics Hub",
    toLocation: "Central Warehouse",
    driverName: "Wichai Sanam",
    licensePlate: "30-8821 Bangkok",
    capacity: 45,
    active: true,
    departureTimes: {
      Day: ["17:20", "20:10"],
      Night: ["08:10"]
    }
  },
  {
    id: "route-c",
    code: "Route C",
    name: "Route C",
    fromLocation: "Admin Office HQ",
    toLocation: "Central Canteen",
    driverName: "Boonmee Kaew",
    licensePlate: "30-9941 Pathum Thani",
    capacity: 40,
    active: true,
    departureTimes: {
      Day: ["17:20", "20:10"],
      Night: ["08:10"]
    }
  },
  {
    id: "route-d",
    code: "Route D",
    name: "Route D",
    fromLocation: "Staff Dormitory Complex",
    toLocation: "Factory 1 Assembly",
    driverName: "Anan Suwan",
    licensePlate: "30-5512 Ayutthaya",
    capacity: 45,
    active: true,
    departureTimes: {
      Day: ["17:20", "20:10"],
      Night: ["08:10"]
    }
  },
  {
    id: "route-e",
    code: "Route E",
    name: "Route E",
    fromLocation: "Factory 2 Entrance",
    toLocation: "Quality Control Center",
    driverName: "Kittisak Muang",
    licensePlate: "30-3321 Saraburi",
    capacity: 35,
    active: true,
    departureTimes: {
      Day: ["17:20", "20:10"],
      Night: ["08:10"]
    }
  },
  {
    id: "route-f",
    code: "Route F",
    name: "Route F",
    fromLocation: "Maintenance Yard",
    toLocation: "Main Assembly Hall",
    driverName: "Mongkol Dee",
    licensePlate: "30-7714 Ayutthaya",
    capacity: 40,
    active: true,
    departureTimes: {
      Day: ["17:20", "20:10"],
      Night: ["08:10"]
    }
  },
  {
    id: "route-g",
    code: "Route G",
    name: "Route G",
    fromLocation: "HR Center",
    toLocation: "Skill Training Hub",
    driverName: "Narong Saeng",
    licensePlate: "30-1102 Bangkok",
    capacity: 30,
    active: true,
    departureTimes: {
      Day: ["17:20", "20:10"],
      Night: ["08:10"]
    }
  },
  {
    id: "route-h",
    code: "Route H",
    name: "Route H",
    fromLocation: "Executive Building",
    toLocation: "VIP Guest Center",
    driverName: "Preecha Suk",
    licensePlate: "30-0012 Bangkok",
    capacity: 20,
    active: true,
    departureTimes: {
      Day: ["17:20", "20:10"],
      Night: ["08:10"]
    }
  }
];

export const INITIAL_ADMINS: AdminUser[] = [
  { id: "adm-1", username: "Admin", name: "System Admin (Superuser)", role: "Superadmin", lastLogin: "2 hours ago" },
  { id: "adm-2", username: "chanon", name: "Chanon (Transport Manager)", role: "Manager", lastLogin: "Yesterday" },
  { id: "adm-3", username: "it_admin", name: "IT Support Desk", role: "Coordinator", lastLogin: "3 days ago" }
];

export function getTodayString(): string {
  const d = new Date();
  return d.toISOString().split('T')[0];
}

export const INITIAL_BOOKINGS: Booking[] = [];

// Helper functions for LocalStorage persistence
const EMPLOYEES_KEY = 'thaisanko_employees_v1';
const BUS_ROUTES_KEY = 'thaisanko_bus_routes_v1';
const BOOKINGS_KEY = 'thaisanko_bookings_v1';
const ADMINS_KEY = 'thaisanko_admins_v1';

export function loadEmployees(): Employee[] {
  try {
    const data = localStorage.getItem(EMPLOYEES_KEY);
    const parsed: Employee[] = data ? JSON.parse(data) : [];
    const sampleIds = ["10452", "10453", "10454", "10455", "10456", "10457", "10458", "10459", "10460"];
    return parsed.filter(e => !sampleIds.includes(e.id));
  } catch {
    return [];
  }
}

export function saveEmployees(data: Employee[]) {
  try {
    localStorage.setItem(EMPLOYEES_KEY, JSON.stringify(data));
  } catch (e) {
    console.error('Failed to save employees', e);
  }
}

export function loadBusRoutes(): BusRoute[] {
  try {
    const data = localStorage.getItem(BUS_ROUTES_KEY);
    return data ? JSON.parse(data) : INITIAL_BUS_ROUTES;
  } catch {
    return INITIAL_BUS_ROUTES;
  }
}

export function saveBusRoutes(data: BusRoute[]) {
  try {
    localStorage.setItem(BUS_ROUTES_KEY, JSON.stringify(data));
  } catch (e) {
    console.error('Failed to save bus routes', e);
  }
}

export function loadBookings(): Booking[] {
  try {
    const data = localStorage.getItem(BOOKINGS_KEY);
    const parsed: Booking[] = data ? JSON.parse(data) : [];
    const sampleIds = ["bk-101", "bk-102", "bk-103"];
    return parsed.filter(b => !sampleIds.includes(b.id));
  } catch {
    return [];
  }
}

export function saveBookings(data: Booking[]) {
  try {
    localStorage.setItem(BOOKINGS_KEY, JSON.stringify(data));
  } catch (e) {
    console.error('Failed to save bookings', e);
  }
}

export function loadAdmins(): AdminUser[] {
  try {
    const data = localStorage.getItem(ADMINS_KEY);
    return data ? JSON.parse(data) : INITIAL_ADMINS;
  } catch {
    return INITIAL_ADMINS;
  }
}

export function saveAdmins(data: AdminUser[]) {
  try {
    localStorage.setItem(ADMINS_KEY, JSON.stringify(data));
  } catch (e) {
    console.error('Failed to save admins', e);
  }
}
