import {
  collection,
  doc,
  setDoc,
  getDocs,
  onSnapshot,
  deleteDoc,
  updateDoc,
  query,
  where
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Employee, BusRoute, Booking, AdminUser, SystemNotice, NewsArticle, NewsAttachment } from '../types';
import {
  INITIAL_EMPLOYEES,
  INITIAL_BUS_ROUTES,
  INITIAL_BOOKINGS,
  INITIAL_ADMINS,
  INITIAL_NEWS
} from '../data/mockData';
import { SAMPLE_ROUTE_PDF, SAMPLE_SAFETY_PDF, SAMPLE_SCHEDULE_PDF } from '../utils/pdfSample';

// Collection references
const EMPLOYEES_COL = 'employees';
const BUS_ROUTES_COL = 'busRoutes';
const BOOKINGS_COL = 'bookings';
const ADMINS_COL = 'admins';
const SYSTEM_NOTICE_COL = 'systemNotice';
const NOTICE_DOC_ID = 'current';
const NEWS_COL = 'news';

// Seed flags to avoid multiple concurrent seeding triggers
let isSeedingEmployees = false;
let isSeedingBusRoutes = false;
let isSeedingBookings = false;
let isSeedingAdmins = false;
let isSeedingNotice = false;
let isSeedingNews = false;

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

// --- BOOKINGS ---
export function subscribeBookings(onData: (bookings: Booking[]) => void) {
  const colRef = collection(db, BOOKINGS_COL);
  return onSnapshot(colRef, (snapshot) => {
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

export async function deleteAdminDoc(id: string): Promise<void> {
  await deleteDoc(doc(db, ADMINS_COL, id));
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

// Helper tracking for deleted news announcements to prevent bounce-back
const DELETED_NEWS_KEY = 'thaisanko_deleted_news_ids_v1';
const NEWS_SEEDED_KEY = 'thaisanko_news_seeded_v1';

function getDeletedNewsIds(): string[] {
  try {
    const raw = localStorage.getItem(DELETED_NEWS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function markNewsIdDeleted(id: string): void {
  try {
    const ids = getDeletedNewsIds();
    if (!ids.includes(id)) {
      ids.push(id);
      localStorage.setItem(DELETED_NEWS_KEY, JSON.stringify(ids));
    }
  } catch (err) {
    console.error('Error saving deleted news id:', err);
  }
}

function unmarkNewsIdDeleted(id: string): void {
  try {
    const ids = getDeletedNewsIds().filter(existingId => existingId !== id);
    localStorage.setItem(DELETED_NEWS_KEY, JSON.stringify(ids));
  } catch (err) {
    console.error('Error unmarking deleted news id:', err);
  }
}

// --- NEWS & ANNOUNCEMENTS ---
export function subscribeNews(onData: (news: NewsArticle[]) => void) {
  const colRef = collection(db, NEWS_COL);
  return onSnapshot(colRef, async (snapshot) => {
    const deletedIds = getDeletedNewsIds();
    const isAlreadySeeded = localStorage.getItem(NEWS_SEEDED_KEY) === 'true';

    // If snapshot has docs that were previously marked as deleted, ensure they are purged from Firestore
    const docsToPurge = snapshot.docs.filter(d => deletedIds.includes(d.id));
    if (docsToPurge.length > 0) {
      for (const d of docsToPurge) {
        try {
          await deleteDoc(doc(db, NEWS_COL, d.id));
        } catch (err) {
          console.error('Error purging deleted news doc:', err);
        }
      }
    }

    if (snapshot.empty) {
      // Only seed initial mock data once on brand-new setup, never re-seed after an admin deletes them
      if (!isAlreadySeeded && !isSeedingNews) {
        isSeedingNews = true;
        try {
          const toSeed = INITIAL_NEWS.filter(item => !deletedIds.includes(item.id));
          for (const item of toSeed) {
            await setDoc(doc(db, NEWS_COL, item.id), item);
          }
          localStorage.setItem(NEWS_SEEDED_KEY, 'true');
        } catch (err) {
          console.error('Error seeding news:', err);
        } finally {
          isSeedingNews = false;
        }
      } else {
        // User has deleted all news; deliver empty array without re-seeding
        onData([]);
      }
    } else {
      localStorage.setItem(NEWS_SEEDED_KEY, 'true');
      const data: NewsArticle[] = snapshot.docs
        .map(d => d.data() as NewsArticle)
        .filter(item => !deletedIds.includes(item.id))
        .map(item => {
          // Auto-heal legacy mock URLs if any
          let updated = false;
          if (item.attachments && item.attachments.length > 0) {
            const newAtts = item.attachments.map(att => {
              if (att.url && att.url.includes('w3.org')) {
                updated = true;
                let replacement = SAMPLE_SCHEDULE_PDF;
                if (item.id === 'news-001') replacement = SAMPLE_ROUTE_PDF;
                if (item.id === 'news-002') replacement = SAMPLE_SAFETY_PDF;
                return { ...att, url: replacement };
              }
              return att;
            });
            if (updated) {
              item.attachments = newAtts;
              // Update Firestore record in background
              setDoc(doc(db, NEWS_COL, item.id), item).catch(() => {});
            }
          }
          return item;
        });

      // Sort pinned news first, then newest createdAt
      data.sort((a, b) => {
        if (a.pinned && !b.pinned) return -1;
        if (!a.pinned && b.pinned) return 1;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
      onData(data);
    }
  }, (err) => {
    console.error('News subscription error:', err);
  });
}

// Collection for chunked large attachments (PDFs & large image payloads)
const NEWS_ATTACHMENTS_CHUNKS_COL = 'news_attachment_chunks';

// High-performance in-memory cache for attachment full URLs
export const attachmentUrlCache = new Map<string, string>();

/**
 * Resolves full data URL for an attachment, loading from cache or Firestore chunks if needed.
 */
export async function loadAttachmentUrl(att: NewsAttachment): Promise<string> {
  // If already a remote link or already contains full non-chunked URL
  if (att.url && !att.hasChunks && (att.url.startsWith('http') || att.url.length > 500)) {
    return att.url;
  }

  // Check cache
  if (attachmentUrlCache.has(att.id)) {
    return attachmentUrlCache.get(att.id)!;
  }

  // If marked as hasChunks, fetch and reconstruct from chunks
  if (att.hasChunks) {
    try {
      const q = query(collection(db, NEWS_ATTACHMENTS_CHUNKS_COL), where('attId', '==', att.id));
      const snap = await getDocs(q);
      if (!snap.empty) {
        const chunks = snap.docs.map(d => d.data() as { index: number; data: string });
        chunks.sort((a, b) => a.index - b.index);
        const fullData = chunks.map(c => c.data).join('');
        if (fullData) {
          attachmentUrlCache.set(att.id, fullData);
          return fullData;
        }
      }
    } catch (err) {
      console.error(`Error loading attachment chunks for ${att.id}:`, err);
    }
  }

  return att.url || '';
}

/**
 * Saves attachment data into Firestore in 300KB chunks so document limits are never breached.
 */
async function saveAttachmentChunks(attId: string, articleId: string, fullDataUrl: string): Promise<void> {
  // Always update in-memory cache immediately
  attachmentUrlCache.set(attId, fullDataUrl);

  const CHUNK_SIZE = 300 * 1024; // 300,000 characters per doc (~300 KB)
  const totalChunks = Math.ceil(fullDataUrl.length / CHUNK_SIZE);

  for (let i = 0; i < totalChunks; i++) {
    const chunkStr = fullDataUrl.slice(i * CHUNK_SIZE, (i + 1) * CHUNK_SIZE);
    const chunkDocRef = doc(db, NEWS_ATTACHMENTS_CHUNKS_COL, `${attId}_${i}`);
    await setDoc(chunkDocRef, {
      attId,
      articleId,
      index: i,
      total: totalChunks,
      data: chunkStr,
      updatedAt: new Date().toISOString()
    });
  }
}

export async function saveNewsDoc(news: NewsArticle): Promise<void> {
  unmarkNewsIdDeleted(news.id);

  // Process attachments to prevent exceeding Firestore 1MB document limit
  const sanitizedAttachments: NewsAttachment[] = [];

  if (news.attachments && news.attachments.length > 0) {
    for (const att of news.attachments) {
      // Check if attachment has large base64 data URL
      const isBase64 = att.url && att.url.startsWith('data:');
      const isPdf = att.type === 'pdf';
      const isLarge = isBase64 && (att.url.length > 100 * 1024 || isPdf);

      if (isLarge) {
        // Save payload in chunks
        await saveAttachmentChunks(att.id, news.id, att.url);

        sanitizedAttachments.push({
          id: att.id,
          name: att.name,
          type: att.type,
          size: att.size,
          hasChunks: true,
          // For images, keep thumbnail preview in url for instant card render
          url: att.type === 'image' ? (att.thumbnailUrl || '') : '',
          thumbnailUrl: att.thumbnailUrl
        });
      } else {
        if (att.url) {
          attachmentUrlCache.set(att.id, att.url);
        }
        sanitizedAttachments.push(att);
      }
    }
  }

  const safeArticle: NewsArticle = {
    ...news,
    attachments: sanitizedAttachments
  };

  await setDoc(doc(db, NEWS_COL, safeArticle.id), safeArticle);
}

export async function deleteNewsDoc(id: string): Promise<void> {
  markNewsIdDeleted(id);
  await deleteDoc(doc(db, NEWS_COL, id));

  // Clean up any attachment chunks in the background
  try {
    const q = query(collection(db, NEWS_ATTACHMENTS_CHUNKS_COL), where('articleId', '==', id));
    getDocs(q).then((snap) => {
      snap.docs.forEach((d) => {
        deleteDoc(d.ref).catch(() => {});
      });
    }).catch(() => {});
  } catch {}
}

