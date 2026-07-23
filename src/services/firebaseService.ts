import {
  collection,
  doc,
  setDoc,
  getDocs,
  onSnapshot,
  deleteDoc,
  updateDoc
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Employee, BusRoute, Booking, AdminUser, SystemNotice } from '../types';
import {
  INITIAL_EMPLOYEES,
  INITIAL_BUS_ROUTES,
  INITIAL_BOOKINGS,
  INITIAL_ADMINS
} from '../data/mockData';

// Collection references
const EMPLOYEES_COL = 'employees';
const BUS_ROUTES_COL = 'busRoutes';
const BOOKINGS_COL = 'bookings';
const ADMINS_COL = 'admins';
const SYSTEM_NOTICE_COL = 'systemNotice';
const NOTICE_DOC_ID = 'current';

// Seed flags to avoid multiple concurrent seeding triggers
let isSeedingEmployees = false;
let isSeedingBusRoutes = false;
let isSeedingBookings = false;
let isSeedingAdmins = false;
let isSeedingNotice = false;

// --- EMPLOYEES ---
export function subscribeEmployees(onData: (employees: Employee[]) => void) {
  const colRef = collection(db, EMPLOYEES_COL);
  return onSnapshot(colRef, async (snapshot) => {
    const sampleIds = ["10452", "10453", "10454", "10455", "10456", "10457", "10458", "10459", "10460"];
    const docsToDelete = snapshot.docs.filter(d => sampleIds.includes(d.id));
    
    if (docsToDelete.length > 0) {
      for (const d of docsToDelete) {
        try {
          await deleteDoc(doc(db, EMPLOYEES_COL, d.id));
        } catch (err) {
          console.error('Error removing sample employee:', err);
        }
      }
    } else {
      const data: Employee[] = snapshot.docs
        .map(d => d.data() as Employee)
        .filter(emp => !sampleIds.includes(emp.id));
      onData(data);
    }
  }, (err) => {
    console.error('Employees subscription error:', err);
  });
}

export async function saveEmployeeDoc(emp: Employee): Promise<void> {
  await setDoc(doc(db, EMPLOYEES_COL, emp.id), emp);
}

export async function deleteEmployeeDoc(id: string): Promise<void> {
  await deleteDoc(doc(db, EMPLOYEES_COL, id));
}

// --- BUS ROUTES ---
export function subscribeBusRoutes(onData: (routes: BusRoute[]) => void) {
  const colRef = collection(db, BUS_ROUTES_COL);
  return onSnapshot(colRef, async (snapshot) => {
    if (snapshot.empty && !isSeedingBusRoutes) {
      isSeedingBusRoutes = true;
      try {
        for (const route of INITIAL_BUS_ROUTES) {
          await setDoc(doc(db, BUS_ROUTES_COL, route.id), route);
        }
      } catch (err) {
        console.error('Error seeding bus routes:', err);
      } finally {
        isSeedingBusRoutes = false;
      }
    } else {
      const data: BusRoute[] = snapshot.docs.map(d => {
        const r = d.data() as BusRoute;
        // Ensure accurate departure times for Day and Night shifts
        const dayTimes = (r.departureTimes?.Day || []).filter(t => !t.includes('AM') && !t.includes('PM'));
        const nightTimes = (r.departureTimes?.Night || []).filter(t => !t.includes('AM') && !t.includes('PM'));
        return {
          ...r,
          departureTimes: {
            Day: dayTimes.length > 0 ? dayTimes : ['17:20', '20:10'],
            Night: nightTimes.length > 0 ? nightTimes : ['08:10']
          }
        };
      });
      onData(data);
    }
  }, (err) => {
    console.error('Bus routes subscription error:', err);
  });
}

export async function saveBusRouteDoc(route: BusRoute): Promise<void> {
  await setDoc(doc(db, BUS_ROUTES_COL, route.id), route);
}

export async function deleteBusRouteDoc(id: string): Promise<void> {
  await deleteDoc(doc(db, BUS_ROUTES_COL, id));
}

let hasClearedInitialBookings = false;

// --- BOOKINGS ---
export function subscribeBookings(onData: (bookings: Booking[]) => void) {
  const colRef = collection(db, BOOKINGS_COL);
  return onSnapshot(colRef, async (snapshot) => {
    if (!hasClearedInitialBookings && !snapshot.empty) {
      hasClearedInitialBookings = true;
      for (const d of snapshot.docs) {
        try {
          await deleteDoc(doc(db, BOOKINGS_COL, d.id));
        } catch (err) {
          console.error('Error clearing booking:', err);
        }
      }
      onData([]);
      return;
    }
    const sampleIds = ["bk-101", "bk-102", "bk-103"];
    const data: Booking[] = snapshot.docs
      .map(d => d.data() as Booking)
      .filter(b => !sampleIds.includes(b.id));
    // Sort newest bookings first
    data.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    onData(data);
  }, (err) => {
    console.error('Bookings subscription error:', err);
  });
}

export async function addBookingDoc(booking: Booking): Promise<void> {
  await setDoc(doc(db, BOOKINGS_COL, booking.id), booking);
}

export async function updateBookingStatusDoc(id: string, status: 'Confirmed' | 'Completed' | 'Cancelled'): Promise<void> {
  await updateDoc(doc(db, BOOKINGS_COL, id), { status });
}

export async function deleteBookingDoc(id: string): Promise<void> {
  await deleteDoc(doc(db, BOOKINGS_COL, id));
}

// --- ADMINS ---
export function subscribeAdmins(onData: (admins: AdminUser[]) => void) {
  const colRef = collection(db, ADMINS_COL);
  return onSnapshot(colRef, async (snapshot) => {
    if (snapshot.empty && !isSeedingAdmins) {
      isSeedingAdmins = true;
      try {
        for (const adm of INITIAL_ADMINS) {
          await setDoc(doc(db, ADMINS_COL, adm.id), adm);
        }
      } catch (err) {
        console.error('Error seeding admins:', err);
      } finally {
        isSeedingAdmins = false;
      }
    } else {
      const data: AdminUser[] = snapshot.docs.map(d => d.data() as AdminUser);
      onData(data);
    }
  }, (err) => {
    console.error('Admins subscription error:', err);
  });
}

export async function saveAdminDoc(admin: AdminUser): Promise<void> {
  await setDoc(doc(db, ADMINS_COL, admin.id), admin);
}

// --- SYSTEM NOTICE ---
export function subscribeSystemNotice(onData: (notice: SystemNotice) => void) {
  const docRef = doc(db, SYSTEM_NOTICE_COL, NOTICE_DOC_ID);
  return onSnapshot(docRef, async (docSnap) => {
    if (!docSnap.exists() && !isSeedingNotice) {
      isSeedingNotice = true;
      const defaultNotice: SystemNotice = {
        enabled: true,
        message: 'กรุณาสำรองที่นั่งก่อนเวลาเดินทางอย่างน้อย 1 ชั่วโมง / Please book at least 1 hour prior to departure.'
      };
      try {
        await setDoc(docRef, defaultNotice);
      } catch (err) {
        console.error('Error seeding notice:', err);
      } finally {
        isSeedingNotice = false;
      }
    } else if (docSnap.exists()) {
      onData(docSnap.data() as SystemNotice);
    }
  }, (err) => {
    console.error('System notice subscription error:', err);
  });
}

export async function saveSystemNoticeDoc(notice: SystemNotice): Promise<void> {
  await setDoc(doc(db, SYSTEM_NOTICE_COL, NOTICE_DOC_ID), notice);
}
