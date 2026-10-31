import React, { useState, useMemo, useEffect } from 'react';
import { NewsArticle, AdminUser, NewsCategory, NewsAttachment } from '../types';
import { loadAttachmentUrl } from '../services/firebaseService';
import {
  Megaphone,
  Pin,
  Calendar,
  User,
  FileText,
  Image as ImageIcon,
  Download,
  Plus,
  Edit,
  Trash2,
  Search,
  ChevronRight,
  ExternalLink,
  X,
  Eye,
  AlertCircle
} from 'lucide-react';
import Swal from 'sweetalert2';
import { NewsEditorModal } from './NewsEditorModal';
import { PdfViewerModal } from './PdfViewerModal';

interface NewsViewProps {
  news: NewsArticle[];
  currentAdmin: AdminUser | null;
  onSaveNews: (article: NewsArticle) => Promise<void>;
  onDeleteNews: (id: string) => Promise<void>;
}

export const NewsView: React.FC<NewsViewProps> = ({
  news,
  currentAdmin,
  onSaveNews,
  onDeleteNews
}) => {
  // State
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedArticle, setSelectedArticle] = useState<NewsArticle | null>(null);

  // Editor Modal State
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingArticle, setEditingArticle] = useState<NewsArticle | null>(null);

  // Lightbox / Document Preview State
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [previewPdf, setPreviewPdf] = useState<{ name: string; url: string } | null>(null);

  // Filter news
  const filteredNews = useMemo(() => {
    return news.filter((item) => {
      // If not admin, only show Published
      if (!currentAdmin && item.status === 'Draft') return false;

      const matchesCat = selectedCategory === 'all' || item.category === selectedCategory;
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        item.title.toLowerCase().includes(q) ||
        item.content.toLowerCase().includes(q) ||
        item.author.toLowerCase().includes(q);

      return matchesCat && matchesSearch;
    });
  }, [news, selectedCategory, searchQuery, currentAdmin]);

  // Separate pinned and standard news
  const pinnedNews = useMemo(() => filteredNews.filter((n) => n.pinned), [filteredNews]);
  const standardNews = useMemo(() => filteredNews.filter((n) => !n.pinned), [filteredNews]);

  // Open Editor for new article
  const handleAddNew = () => {
    setEditingArticle(null);
    setIsEditorOpen(true);
  };

  // Open Editor for existing article
  const handleEdit = (article: NewsArticle, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setEditingArticle(article);
    setIsEditorOpen(true);
  };

  // Delete article
  const handleDelete = (article: NewsArticle, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    Swal.fire({
      title: 'ยืนยันการลบข่าวสาร?',
      html: `คุณต้องการลบ <strong>"${article.title}"</strong> ออกจากระบบใช่หรือไม่?<br/><small class="text-slate-500">การกระทำนี้ไม่สามารถย้อนกลับได้</small>`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'ลบข่าวสาร',
      cancelButtonText: 'ยกเลิก'
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          await onDeleteNews(article.id);
          if (selectedArticle?.id === article.id) {
            setSelectedArticle(null);
          }
          Swal.fire({
            icon: 'success',
            title: 'ลบข้อมูลสำเร็จ',
            text: 'ข่าวสารถูกลบออกจากระบบเรียบร้อยแล้ว',
            timer: 1500,
            showConfirmButton: false
          });
        } catch (err) {
          console.error('Failed to delete news:', err);
          Swal.fire({
            icon: 'error',
            title: 'เกิดข้อผิดพลาด',
            text: 'ไม่สามารถลบข่าวสารได้ กรุณาลองใหม่อีกครั้ง'
          });
        }
      }
    });
  };

  // Format Date in Thai format
  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('th-TH', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateStr;
    }
  };

  // Helper for Category badge style
  const getCategoryBadge = (cat: NewsCategory) => {
    switch (cat) {
      case 'Urgent':
        return {
          text: 'ประกาศด่วน',
          bg: 'bg-red-500 text-white',
          border: 'border-red-600',
          dot: 'bg-red-200'
        };
      case 'Route':
        return {
          text: 'สายรถ & เวลา',
          bg: 'bg-blue-600 text-white',
          border: 'border-blue-700',
          dot: 'bg-blue-200'
        };
      case 'Holiday':
        return {
          text: 'วันหยุด & เทศกาล',
          bg: 'bg-purple-600 text-white',
          border: 'border-purple-700',
          dot: 'bg-purple-200'
        };
      case 'Maintenance':
        return {
          text: 'ซ่อมบำรุง & ความปลอดภัย',
          bg: 'bg-amber-600 text-white',
          border: 'border-amber-700',
          dot: 'bg-amber-200'
        };
      case 'General':
      default:
        return {
          text: 'ข่าวทั่วไป',
          bg: 'bg-[#0e5d32] text-white',
          border: 'border-[#0b4a28]',
          dot: 'bg-emerald-200'
        };
    }
  };

  // Download file handler
  const handleDownload = (name: string, url: string) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = name;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Open image handler with lazy chunk resolution
  const handleOpenImage = async (img: NewsAttachment) => {
    let url = img.url;
    if (!url || img.hasChunks) {
      url = (await loadAttachmentUrl(img)) || url;
    }
    if (url) {
      setPreviewImage(url);
    }
  };

  // Open PDF handler with lazy chunk resolution
  const handleOpenPdf = async (pdf: NewsAttachment) => {
    let url = pdf.url;
    if (!url || pdf.hasChunks) {
      url = (await loadAttachmentUrl(pdf)) || url;
    }
    if (url) {
      setPreviewPdf({ name: pdf.name, url });
    }
  };

  // Download handler with lazy chunk resolution
  const handleDownloadAttachment = async (att: NewsAttachment) => {
    let url = att.url;
    if (!url || att.hasChunks) {
      url = (await loadAttachmentUrl(att)) || url;
    }
    if (url) {
      handleDownload(att.name, url);
    }
  };

  // Auto-resolve any chunked attachments when an article is opened
  useEffect(() => {
    if (!selectedArticle) return;
    const needLoading = selectedArticle.attachments?.filter(
      (a) => a.hasChunks && (!a.url || a.url.length < 500)
    );
    if (!needLoading || needLoading.length === 0) return;

    let isMounted = true;
    Promise.all(
      needLoading.map(async (att) => {
        const fullUrl = await loadAttachmentUrl(att);
        return { id: att.id, url: fullUrl };
      })
    ).then((resolved) => {
      if (!isMounted) return;
      setSelectedArticle((prev) => {
        if (!prev || prev.id !== selectedArticle.id) return prev;
        return {
          ...prev,
          attachments: prev.attachments.map((att) => {
            const hit = resolved.find((r) => r.id === att.id);
            return hit && hit.url ? { ...att, url: hit.url } : att;
          })
        };
      });
    });

    return () => {
      isMounted = false;
    };
  }, [selectedArticle?.id]);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top Banner & Title Bar */}
      <div className="bg-white/80 backdrop-blur-md rounded-3xl p-6 sm:p-8 border border-white/50 shadow-md shadow-emerald-950/5 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-br from-[#0e5d32]/10 to-[#59B135]/15 rounded-full blur-3xl -z-10 pointer-events-none"></div>

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div>
            <div className="flex items-center gap-2.5 mb-2">
              <span className="p-2 bg-[#0e5d32] text-white rounded-xl shadow-xs">
                <Megaphone className="w-5 h-5" />
              </span>
              <span className="text-xs font-black uppercase tracking-wider text-[#0e5d32] bg-[#0e5d32]/10 px-3 py-1 rounded-full">
                Thai Sanko News & Updates
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-[#0e5d32] tracking-tight">
              ข่าวสารและประกาศจากบริษัท
            </h1>
            <p className="text-sm text-slate-600 mt-1 max-w-2xl leading-relaxed">
              ศูนย์รวมข่าวสาร ประกาศปรับเวลาเดินรถ เอกสารระเบียบปฏิบัติ และข้อมูลสำคัญสำหรับพนักงาน บริษัท ไทย ซังโค จำกัด
            </p>
          </div>

          {currentAdmin && (
            <div className="flex items-center gap-2.5 shrink-0">
              <button
                onClick={handleAddNew}
                className="bg-[#0e5d32] hover:bg-[#0b4a28] text-white px-4 py-2.5 rounded-2xl text-xs font-bold flex items-center gap-2 shadow-md hover:shadow-lg transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>เพิ่มประกาศใหม่</span>
              </button>
            </div>
          )}
        </div>

        {/* Filter & Search Bar */}
        <div className="mt-6 pt-5 border-t border-slate-200/80 flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Category Tabs */}
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
            {[
              { id: 'all', label: 'ทั้งหมด' },
              { id: 'Urgent', label: 'ประกาศด่วน' },
              { id: 'Route', label: 'สายรถและเวลา' },
              { id: 'General', label: 'ข่าวทั่วไป' },
              { id: 'Holiday', label: 'วันหยุด' },
              { id: 'Maintenance', label: 'ความปลอดภัย' }
            ].map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  selectedCategory === cat.id
                    ? 'bg-[#0e5d32] text-white shadow-xs'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div className="relative w-full md:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ค้นหาตามหัวข้อ, ข้อความ..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-2 text-xs font-medium text-slate-800 placeholder-slate-400 outline-none focus:bg-white focus:ring-2 focus:ring-[#0e5d32] transition-all"
            />
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      {filteredNews.length === 0 ? (
        <div className="bg-white/80 rounded-3xl p-12 text-center border border-slate-200 shadow-2xs">
          <Megaphone className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-700">ไม่พบข่าวสารหรือประกาศ</h3>
          <p className="text-xs text-slate-500 mt-1">
            {news.length === 0
              ? 'ขณะนี้ยังไม่มีประกาศข่าวสารในระบบ'
              : 'ลองเปลี่ยนหมวดหมู่หรือคำค้นหาเพื่อค้นหาประกาศอื่น'}
          </p>
          {currentAdmin && news.length === 0 && (
            <button
              onClick={handleAddNew}
              className="mt-4 inline-flex items-center gap-2 bg-[#0e5d32] hover:bg-[#0b4a28] text-white px-4 py-2 rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" /> สร้างประกาศใหม่
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          {/* PINNED ANNOUNCEMENTS (If any) */}
          {pinnedNews.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-amber-800">
                <Pin className="w-4 h-4 text-amber-600 fill-amber-600" />
                <span>ข่าวสำคัญปักหมุด (Pinned Announcements)</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {pinnedNews.map((article) => {
                  const badge = getCategoryBadge(article.category);
                  const imageAtts = article.attachments.filter((a) => a.type === 'image');
                  const pdfAtts = article.attachments.filter((a) => a.type === 'pdf');

                  return (
                    <div
                      key={article.id}
                      onClick={() => setSelectedArticle(article)}
                      className="bg-gradient-to-br from-amber-50/90 to-white border-2 border-amber-300/80 rounded-3xl p-5 sm:p-6 shadow-sm hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between relative overflow-hidden"
                    >
                      <div className="space-y-3">
                        {/* Meta header */}
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span
                              className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full ${badge.bg}`}
                            >
                              {badge.text}
                            </span>
                            <span className="flex items-center gap-1 text-[10px] font-bold text-amber-800 bg-amber-100/90 px-2 py-0.5 rounded-full">
                              <Pin className="w-3 h-3 fill-amber-700 text-amber-700" /> ปักหมุด
                            </span>
                          </div>

                          {/* Admin Controls */}
                          {currentAdmin && (
                            <div className="flex items-center gap-1">
                              <button
                                onClick={(e) => handleEdit(article, e)}
                                className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                                title="แก้ไขข่าวสาร"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              <button
                                onClick={(e) => handleDelete(article, e)}
                                className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                                title="ลบข่าวสาร"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          )}
                        </div>

                        {/* Title */}
                        <h3 className="text-base sm:text-lg font-bold text-slate-900 group-hover:text-[#0e5d32] transition-colors leading-snug">
                          {article.title}
                        </h3>

                        {/* Text Excerpt */}
                        <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed">
                          {article.content}
                        </p>

                        {/* Attachments preview pill row */}
                        {article.attachments.length > 0 && (
                          <div className="flex flex-wrap items-center gap-2 pt-1">
                            {imageAtts.length > 0 && (
                              <span className="inline-flex items-center gap-1 bg-blue-50 text-blue-800 border border-blue-200 text-[10px] font-bold px-2 py-0.5 rounded-lg">
                                <ImageIcon className="w-3 h-3" />
                                <span>{imageAtts.length} รูปภาพ</span>
                              </span>
                            )}
                            {pdfAtts.length > 0 && (
                              <span className="inline-flex items-center gap-1 bg-red-50 text-red-800 border border-red-200 text-[10px] font-bold px-2 py-0.5 rounded-lg">
                                <FileText className="w-3 h-3" />
                                <span>{pdfAtts.length} เอกสาร PDF</span>
                              </span>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Card Footer */}
                      <div className="mt-4 pt-3 border-t border-amber-200/60 flex items-center justify-between text-[11px] text-slate-500">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          <span>{formatDate(article.createdAt)}</span>
                        </div>
                        <span className="font-bold text-[#0e5d32] group-hover:translate-x-0.5 transition-transform flex items-center gap-0.5">
                          อ่านรายละเอียด <ChevronRight className="w-3.5 h-3.5" />
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ALL ANNOUNCEMENTS GRID */}
          <div className="space-y-3">
            {pinnedNews.length > 0 && (
              <h2 className="text-xs font-black uppercase tracking-wider text-slate-500">
                ข่าวสารทั้งหมด ({standardNews.length} รายการ)
              </h2>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {standardNews.map((article) => {
                const badge = getCategoryBadge(article.category);
                const imageAtts = article.attachments.filter((a) => a.type === 'image');
                const pdfAtts = article.attachments.filter((a) => a.type === 'pdf');
                const firstImg = imageAtts[0];

                return (
                  <div
                    key={article.id}
                    onClick={() => setSelectedArticle(article)}
                    className="bg-white/90 border border-slate-200 rounded-3xl p-5 shadow-2xs hover:shadow-md hover:border-slate-300 transition-all cursor-pointer group flex flex-col justify-between"
                  >
                    <div className="space-y-3">
                      {/* Optional cover thumbnail */}
                      {firstImg && (
                        <div className="w-full h-36 rounded-2xl overflow-hidden bg-slate-100 relative group-hover:opacity-95 transition-opacity">
                          <img
                            src={firstImg.thumbnailUrl || firstImg.url}
                            alt={firstImg.name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              (e.target as HTMLElement).style.display = 'none';
                            }}
                          />
                          <div className="absolute bottom-2 right-2 bg-black/60 backdrop-blur-xs text-white text-[9px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1">
                            <ImageIcon className="w-3 h-3" />
                            <span>รูปภาพแนบ</span>
                          </div>
                        </div>
                      )}

                      {/* Header Badge & Admin tools */}
                      <div className="flex items-center justify-between gap-2">
                        <span
                          className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full ${badge.bg}`}
                        >
                          {badge.text}
                        </span>

                        {currentAdmin && (
                          <div className="flex items-center gap-1">
                            <button
                              onClick={(e) => handleEdit(article, e)}
                              className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                              title="แก้ไขข่าวสาร"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={(e) => handleDelete(article, e)}
                              className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                              title="ลบข่าวสาร"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Title */}
                      <h3 className="text-sm sm:text-base font-bold text-slate-900 group-hover:text-[#0e5d32] transition-colors line-clamp-2 leading-snug">
                        {article.title}
                      </h3>

                      {/* Content excerpt */}
                      <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed">
                        {article.content}
                      </p>

                      {/* Attachments badges */}
                      {article.attachments.length > 0 && (
                        <div className="flex flex-wrap items-center gap-1.5 pt-1">
                          {imageAtts.length > 0 && (
                            <span className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 text-[10px] font-bold px-2 py-0.5 rounded-md border border-blue-100">
                              <ImageIcon className="w-3 h-3" /> {imageAtts.length} ภาพ
                            </span>
                          )}
                          {pdfAtts.length > 0 && (
                            <span className="inline-flex items-center gap-1 bg-red-50 text-red-700 text-[10px] font-bold px-2 py-0.5 rounded-md border border-red-100">
                              <FileText className="w-3 h-3" /> {pdfAtts.length} PDF
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Footer */}
                    <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        <span>{formatDate(article.createdAt).split(' ')[0]}</span>
                      </div>
                      <span className="font-bold text-[#0e5d32] flex items-center gap-0.5 group-hover:translate-x-0.5 transition-transform">
                        เปิดอ่าน <ChevronRight className="w-3.5 h-3.5" />
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ARTICLE READER MODAL (FULL DETAILS) */}
      {selectedArticle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden">
            {/* Modal Header */}
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span
                  className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full ${
                    getCategoryBadge(selectedArticle.category).bg
                  }`}
                >
                  {getCategoryBadge(selectedArticle.category).text}
                </span>
                {selectedArticle.pinned && (
                  <span className="text-[10px] font-bold text-amber-300 bg-amber-950/80 px-2 py-0.5 rounded-full flex items-center gap-1">
                    <Pin className="w-3 h-3 fill-amber-300" /> ข่าวปักหมุด
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                {currentAdmin && (
                  <>
                    <button
                      onClick={() => handleEdit(selectedArticle)}
                      className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
                      title="แก้ไขข่าวสารนี้"
                    >
                      <Edit className="w-3.5 h-3.5" /> <span>แก้ไข</span>
                    </button>
                    <button
                      onClick={() => handleDelete(selectedArticle)}
                      className="p-1.5 rounded-lg bg-red-600/80 hover:bg-red-600 text-white text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
                      title="ลบข่าวสารนี้"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> <span>ลบ</span>
                    </button>
                  </>
                )}
                <button
                  onClick={() => setSelectedArticle(null)}
                  className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
                  aria-label="Close modal"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-6 custom-scrollbar">
              {/* Title & Meta */}
              <div>
                <h2 className="text-xl sm:text-2xl font-black text-slate-900 leading-snug">
                  {selectedArticle.title}
                </h2>
                <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 mt-2.5 pt-2.5 border-t border-slate-100">
                  <div className="flex items-center gap-1.5 font-medium">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <span>เผยแพร่: {formatDate(selectedArticle.createdAt)}</span>
                  </div>
                  <div className="flex items-center gap-1.5 font-medium">
                    <User className="w-3.5 h-3.5 text-slate-400" />
                    <span>โดย: {selectedArticle.author}</span>
                  </div>
                </div>
              </div>

              {/* Full Text Content */}
              <div className="text-sm text-slate-700 leading-relaxed whitespace-pre-line space-y-4 bg-slate-50/70 p-5 rounded-2xl border border-slate-200/80 font-normal">
                {selectedArticle.content}
              </div>

              {/* Attachments Section */}
              {selectedArticle.attachments && selectedArticle.attachments.length > 0 && (
                <div className="space-y-4 pt-2">
                  <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-[#0e5d32]" />
                    <span>เอกสารแนบและรูปภาพประกอบ ({selectedArticle.attachments.length} ไฟล์)</span>
                  </h3>

                  {/* IMAGES GALLERY */}
                  {selectedArticle.attachments.some((a) => a.type === 'image') && (
                    <div className="space-y-2">
                      <p className="text-[11px] font-bold text-slate-500">รูปภาพประกอบ:</p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {selectedArticle.attachments
                          .filter((a) => a.type === 'image')
                          .map((img) => (
                            <div
                              key={img.id}
                              className="group relative rounded-2xl overflow-hidden border border-slate-200 bg-slate-100 shadow-2xs"
                            >
                              <img
                                src={img.url || img.thumbnailUrl}
                                alt={img.name}
                                className="w-full h-44 object-cover group-hover:scale-103 transition-transform duration-300"
                              />
                              <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent opacity-90 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity flex flex-col justify-end p-3">
                                <p className="text-xs font-bold text-white truncate">{img.name}</p>
                                <div className="flex items-center gap-2 mt-1.5">
                                  <button
                                    type="button"
                                    onClick={() => handleOpenImage(img)}
                                    className="bg-white/90 hover:bg-white text-slate-900 px-2.5 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1 cursor-pointer"
                                  >
                                    <Eye className="w-3 h-3" /> ขยายรูป
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleDownloadAttachment(img)}
                                    className="bg-[#0e5d32] hover:bg-[#0b4a28] text-white px-2.5 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1 cursor-pointer"
                                  >
                                    <Download className="w-3 h-3" /> ดาวน์โหลด
                                  </button>
                                </div>
                              </div>
                            </div>
                          ))}
                      </div>
                    </div>
                  )}

                  {/* PDF DOCUMENTS */}
                  {selectedArticle.attachments.some((a) => a.type === 'pdf') && (
                    <div className="space-y-2 pt-1">
                      <p className="text-[11px] font-bold text-slate-500">เอกสาร PDF ดาวน์โหลด:</p>
                      <div className="space-y-2.5">
                        {selectedArticle.attachments
                          .filter((a) => a.type === 'pdf')
                          .map((pdf) => (
                            <div
                              key={pdf.id}
                              className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 bg-white border border-slate-200 rounded-2xl shadow-2xs hover:border-slate-300 transition-all gap-3"
                            >
                              <div className="flex items-center gap-3 min-w-0">
                                <div className="p-2.5 bg-red-50 text-red-600 rounded-xl shrink-0 border border-red-100">
                                  <FileText className="w-6 h-6" />
                                </div>
                                <div className="min-w-0">
                                  <p className="text-xs font-bold text-slate-800 truncate" title={pdf.name}>
                                    {pdf.name}
                                  </p>
                                  <p className="text-[10px] text-slate-400 mt-0.5">
                                    เอกสารรูปแบบ PDF {pdf.size ? `• ขนาด ${pdf.size}` : ''}
                                  </p>
                                </div>
                              </div>

                              <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                                <button
                                  type="button"
                                  onClick={() => handleOpenPdf(pdf)}
                                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                                  title="เปิดดูตัวอย่างเอกสาร PDF"
                                >
                                  <ExternalLink className="w-3.5 h-3.5" />
                                  <span>เปิดดู PDF</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDownloadAttachment(pdf)}
                                  className="px-3.5 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                                  title="ดาวน์โหลดไฟล์ PDF เก็บไว้ในเครื่อง"
                                >
                                  <Download className="w-3.5 h-3.5" />
                                  <span>ดาวน์โหลด</span>
                                </button>
                              </div>
                            </div>
                          ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex justify-between items-center text-xs text-slate-500">
              <span>บริษัท ไทย ซังโค จำกัด • แผนกธุรการและบริหารยานพาหนะ</span>
              <button
                onClick={() => setSelectedArticle(null)}
                className="bg-slate-200 hover:bg-slate-300 text-slate-700 px-4 py-1.5 rounded-xl font-bold cursor-pointer transition-colors"
              >
                ปิดหน้าต่าง
              </button>
            </div>
          </div>
        </div>
      )}

      {/* IMAGE LIGHTBOX MODAL */}
      {previewImage && (
        <div
          onClick={() => setPreviewImage(null)}
          className="fixed inset-0 z-60 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 cursor-zoom-out animate-in fade-in duration-200"
        >
          <div className="relative max-w-4xl max-h-[90vh] flex flex-col items-center">
            <button
              onClick={() => setPreviewImage(null)}
              className="absolute -top-12 right-0 bg-white/20 hover:bg-white/30 text-white p-2 rounded-full cursor-pointer transition-colors"
              aria-label="Close preview"
            >
              <X className="w-6 h-6" />
            </button>
            <img
              src={previewImage}
              alt="Preview"
              className="max-w-full max-h-[80vh] rounded-2xl object-contain shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}

      {/* PDF PREVIEW MODAL */}
      {previewPdf && (
        <PdfViewerModal
          name={previewPdf.name}
          url={previewPdf.url}
          onClose={() => setPreviewPdf(null)}
        />
      )}

      {/* NEWS EDITOR MODAL */}
      <NewsEditorModal
        isOpen={isEditorOpen}
        onClose={() => setIsEditorOpen(false)}
        onSave={onSaveNews}
        initialData={editingArticle}
        currentAdminName={currentAdmin?.name}
      />
    </div>
  );
};
