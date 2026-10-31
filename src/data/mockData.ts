import { Employee, BusRoute, Booking, AdminUser, NewsArticle } from '../types';
import { SAMPLE_ROUTE_PDF, SAMPLE_SAFETY_PDF, SAMPLE_SCHEDULE_PDF } from '../utils/pdfSample';

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
  { id: "adm-1", username: "Admin", name: "System Admin (Superuser)", role: "Superadmin", password: "035746488", lastLogin: "2 hours ago" },
  { id: "adm-2", username: "chanon", name: "Chanon (Transport Manager)", role: "Manager", password: "0870006622", lastLogin: "Yesterday" },
  { id: "adm-3", username: "it_admin", name: "IT Support Desk", role: "Coordinator", password: "admin123", lastLogin: "3 days ago" }
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

// Initial Sample News Announcements
export const INITIAL_NEWS: NewsArticle[] = [
  {
    id: "news-001",
    title: "ประกาศ: แจ้งปรับตารางเวลาเดินรถรับส่งสาย Route A และ Route B (เริ่ม 1 ตุลาคม 2569)",
    category: "Route",
    pinned: true,
    status: "Published",
    author: "แผนกบริหารยานพาหนะและธุรการ (Transport & Admin)",
    createdAt: "2026-09-18T08:30:00.000Z",
    content: `เรียน พนักงาน บริษัท ไทย ซังโค จำกัด ทุกท่าน

เพื่ออำนวยความสะดวกในการเดินทางของพนักงานกะวันและสอดคล้องกับมาตรการจราจรหน้าทางเข้าโรงงาน แผนกบริหารยานพาหนะขอแจ้งปรับตารางเวลาเดินรถรับส่งพนักงาน สาย Route A และ Route B ดังนี้:

1. สาย Route A (Main Gate - Plant 1):
   - รอบเวลาปกติ กะวัน ปรับเวลาออกเป็น 17:20 น.
   - รอบ OT กะวัน เวลา 20:10 น. (คงเดิม)
   - กะดึก เวลา 08:10 น. (คงเดิม)

2. สาย Route B (Logistics Hub - Warehouse):
   - เพิ่มจุดจอดสำรองบริเวณหน้าอาคาร Canteen
   - เวลาออกรถยังคงเดิมตามรอบ 17:20 และ 20:10 น.

พนักงานสามารถตรวจสอบตารางเส้นทางและดาวน์โหลดเอกสารประกาศฉบับเต็ม รวมถึงแผนผังจุดจอดรถได้จากเอกสารแนบด้านล่างนี้ หากมีข้อสงสัยเพิ่มเติมกรุณาติดต่อเคาน์เตอร์ฝ่ายธุรการหรือเบอร์ภายใน 1420`,
    attachments: [
      {
        id: "att-001",
        name: "ประกาศปรับเวลาเดินรถ_RouteA_B_ต.ค.2569.pdf",
        type: "pdf",
        url: SAMPLE_ROUTE_PDF,
        size: "420 KB"
      },
      {
        id: "att-002",
        name: "แผนผังจุดจอดรถและเส้นทางเดินรถ_2026.png",
        type: "image",
        url: "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?q=80&w=1200&auto=format&fit=crop",
        size: "1.4 MB"
      }
    ]
  },
  {
    id: "news-002",
    title: "มาตรการความปลอดภัยและระเบียบปฏิบัติในการโดยสารรถรับส่งพนักงาน",
    category: "General",
    pinned: false,
    status: "Published",
    author: "คณะกรรมการความปลอดภัยฯ (JSH COMMITTEE)",
    createdAt: "2026-09-15T09:00:00.000Z",
    content: `ประกาศจากคณะกรรมการความปลอดภัย อาชีวอนามัย และสภาพแวดล้อมในการทำงาน (คปอ.)

ขอความร่วมมือพนักงานทุกท่านที่ใช้บริการรถรับส่งปฏิบัติตามแนวทางความปลอดภัยดังต่อไปนี้:
1. ทำการจองที่นั่งผ่านระบบล่วงหน้าอย่างน้อย 1 ชั่วโมงก่อนเวลาเดินรถ
2. แสดงรหัสตั๋วโดยสาร (Digital E-Ticket) ให้พนักงานขับรถตรวจสอบก่อนขึ้นรถ
3. คาดเข็มขัดนิรภัยตลอดการเดินทางทุกที่นั่ง
4. งดรับประทานอาหารที่มีกลิ่นฉุน และรักษาความสะอาดภายในห้องโดยสาร
5. หากจำเป็นต้องยกเลิก กรุณากดยกเลิกในระบบก่อนเวลารถออกเพื่อเปิดสิทธิ์ให้เพื่อนพนักงานท่านอื่น

สามารถดาวน์โหลดคู่มือระเบียบความปลอดภัยฉบับสมบูรณ์ (Safety Manual PDF) ได้ด้านล่าง`,
    attachments: [
      {
        id: "att-003",
        name: "คู่มือความปลอดภัยการโดยสารรถรับส่ง_ThaiSanko.pdf",
        type: "pdf",
        url: SAMPLE_SAFETY_PDF,
        size: "680 KB"
      },
      {
        id: "att-004",
        name: "อินโฟกราฟิก_ข้อปฏิบัติความปลอดภัยบนรถรับส่ง.jpg",
        type: "image",
        url: "https://images.unsplash.com/photo-1570125909232-eb263c188f7e?q=80&w=1200&auto=format&fit=crop",
        size: "950 KB"
      }
    ]
  },
  {
    id: "news-003",
    title: "ประกาศด่วน: ตารางเดินรถรับส่งช่วงวันหยุดและแผนการซ่อมบำรุงประจำเดือน",
    category: "Holiday",
    pinned: false,
    status: "Published",
    author: "ฝ่ายทรัพยากรบุคคล (Human Resources)",
    createdAt: "2026-09-10T14:15:00.000Z",
    content: `แจ้งพนักงานทุกแผนกทราบ

เนื่องในวันหยุดประจำบริษัทช่วงสิ้นเดือนนี้ รถรับส่งจะให้บริการเฉพาะพนักงานกะที่ได้รับมอบหมายงานทำงานล่วงเวลา (OT) เท่านั้น สำหรับพนักงานทั่วไปจะไม่มีรถรอบปกติ 17:20 น.

กรุณาตรวจสอบรายชื่อสายรถที่เปิดวิ่งพิเศษในเอกสารแนบ และหัวหน้างานกรุณาส่งรายชื่อพนักงานที่ต้องมาปฏิบัติงานภายในวันพุธนี้

ขอขอบคุณทุกท่านที่ให้ความร่วมมือ`,
    attachments: [
      {
        id: "att-005",
        name: "ตารางเดินรถวันหยุด_และแผนซ่อมบำรุง.pdf",
        type: "pdf",
        url: SAMPLE_SCHEDULE_PDF,
        size: "350 KB"
      }
    ]
  }
];

const NEWS_KEY = 'thaisanko_news_v1';

export function loadNews(): NewsArticle[] {
  try {
    const data = localStorage.getItem(NEWS_KEY);
    return data ? JSON.parse(data) : INITIAL_NEWS;
  } catch {
    return INITIAL_NEWS;
  }
}

export function saveNews(data: NewsArticle[]) {
  try {
    localStorage.setItem(NEWS_KEY, JSON.stringify(data));
  } catch (e) {
    console.error('Failed to save news', e);
  }
}
