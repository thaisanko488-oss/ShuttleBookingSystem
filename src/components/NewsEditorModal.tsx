import React, { useState, useEffect } from 'react';
import { NewsArticle, NewsAttachment, NewsCategory } from '../types';
import {
  X,
  Upload,
  FileText,
  Image as ImageIcon,
  Trash2,
  AlertCircle,
  Check,
  Plus,
  Link as LinkIcon,
  Pin,
  Loader2,
  Sparkles
} from 'lucide-react';
import Swal from 'sweetalert2';
import { compressImageFile, readFileAsDataUrl } from '../utils/imageCompressor';
import { loadAttachmentUrl, attachmentUrlCache } from '../services/firebaseService';

interface NewsEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (article: NewsArticle) => Promise<void>;
  initialData?: NewsArticle | null;
  currentAdminName?: string;
}

export const NewsEditorModal: React.FC<NewsEditorModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialData,
  currentAdminName = 'แอดมิน (Admin)'
}) => {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<NewsCategory>('General');
  const [pinned, setPinned] = useState(false);
  const [content, setContent] = useState('');
  const [status, setStatus] = useState<'Published' | 'Draft'>('Published');
  const [attachments, setAttachments] = useState<NewsAttachment[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isProcessingFiles, setIsProcessingFiles] = useState(false);

  // External URL input toggle
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [urlName, setUrlName] = useState('');
  const [urlLink, setUrlLink] = useState('');
  const [urlType, setUrlType] = useState<'image' | 'pdf'>('image');

  // Synchronize state with initialData whenever modal opens or article changes
  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setTitle(initialData.title || '');
        setCategory(initialData.category || 'General');
        setPinned(initialData.pinned || false);
        setContent(initialData.content || '');
        setStatus(initialData.status || 'Published');
        const initialAtts = initialData.attachments || [];
        setAttachments(initialAtts);

        // Preload any chunked attachment full data in the background
        initialAtts.forEach(async (att) => {
          if (!att.url || att.hasChunks) {
            const resolvedUrl = await loadAttachmentUrl(att);
            if (resolvedUrl) {
              setAttachments((prev) =>
                prev.map((item) => (item.id === att.id ? { ...item, url: resolvedUrl } : item))
              );
            }
          }
        });
      } else {
        setTitle('');
        setCategory('General');
        setPinned(false);
        setContent('');
        setStatus('Published');
        setAttachments([]);
      }
      setShowUrlInput(false);
      setUrlName('');
      setUrlLink('');
    }
  }, [isOpen, initialData]);

  if (!isOpen) return null;

  // File Upload Handler (Image / PDF)
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsProcessingFiles(true);

    try {
      const fileList: File[] = Array.from(files);
      const newAttachmentsList: NewsAttachment[] = [];

      for (const file of fileList) {
        // Enforce 10MB individual limit
        if (file.size > 10 * 1024 * 1024) {
          Swal.fire({
            icon: 'warning',
            title: 'ไฟล์มีขนาดใหญ่เกินไป',
            text: `ไฟล์ "${file.name}" มีขนาดมากกว่า 10 MB กรุณาลดขนาดไฟล์ก่อนอัปโหลด`,
            confirmButtonColor: '#0e5d32'
          });
          continue;
        }

        const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
        const isImage = file.type.startsWith('image/') || /\.(jpg|jpeg|png|webp|gif|bmp)$/i.test(file.name);

        if (!isPdf && !isImage) {
          Swal.fire({
            icon: 'info',
            title: 'รูปแบบไฟล์ไม่รองรับ',
            text: `รองรับเฉพาะไฟล์รูปภาพ (JPG, PNG, WEBP) หรือเอกสาร PDF เท่านั้น`,
            confirmButtonColor: '#0e5d32'
          });
          continue;
        }

        const attId = `att-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

        if (isImage) {
          // Automatic canvas compression (resizes large screenshots / photos down to ~50-90 KB)
          const processed = await compressImageFile(file);
          attachmentUrlCache.set(attId, processed.dataUrl);

          newAttachmentsList.push({
            id: attId,
            name: file.name,
            type: 'image',
            url: processed.dataUrl,
            size: processed.sizeStr,
            thumbnailUrl: processed.thumbnailDataUrl
          });
        } else {
          // PDF document
          const processed = await readFileAsDataUrl(file);
          attachmentUrlCache.set(attId, processed.dataUrl);

          newAttachmentsList.push({
            id: attId,
            name: file.name,
            type: 'pdf',
            url: processed.dataUrl,
            size: processed.sizeStr
          });
        }
      }

      if (newAttachmentsList.length > 0) {
        setAttachments((prev) => [...prev, ...newAttachmentsList]);
      }
    } catch (err) {
      console.error('Error processing attachments:', err);
      Swal.fire({
        icon: 'error',
        title: 'เกิดข้อผิดพลาดในการอ่านไฟล์',
        text: 'ไม่สามารถประมวลผลไฟล์ที่เลือกได้ กรุณาลองใหม่อีกครั้ง',
        confirmButtonColor: '#0e5d32'
      });
    } finally {
      setIsProcessingFiles(false);
      e.target.value = '';
    }
  };

  // Add attachment by URL
  const handleAddUrlAttachment = () => {
    if (!urlLink.trim()) {
      Swal.fire({ icon: 'warning', title: 'กรุณากรอกลิงก์ URL', confirmButtonColor: '#0e5d32' });
      return;
    }
    const name = urlName.trim() || (urlType === 'pdf' ? 'เอกสารแนบ.pdf' : 'รูปภาพแนบ.jpg');
    const newAtt: NewsAttachment = {
      id: `att-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      name,
      type: urlType,
      url: urlLink.trim(),
      size: 'Web Link'
    };
    setAttachments((prev) => [...prev, newAtt]);
    setUrlName('');
    setUrlLink('');
    setShowUrlInput(false);
  };

  // Remove attachment
  const handleRemoveAttachment = (id: string) => {
    setAttachments((prev) => prev.filter((a) => a.id !== id));
  };

  // Save / Submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      Swal.fire({
        icon: 'warning',
        title: 'กรุณาระบุหัวข้อข่าวสาร',
        text: 'โปรดกรอกชื่อหัวข้อประกาศเพื่อความชัดเจน',
        confirmButtonColor: '#0e5d32'
      });
      return;
    }

    if (!content.trim()) {
      Swal.fire({
        icon: 'warning',
        title: 'กรุณาพิมพ์ข้อความประกาศ',
        text: 'โปรดระบุรายละเอียดเนื้อหาข่าวสารที่ต้องการแจ้ง',
        confirmButtonColor: '#0e5d32'
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const article: NewsArticle = {
        id: initialData?.id || `news-${Date.now()}`,
        title: title.trim(),
        category,
        pinned,
        content: content.trim(),
        author: initialData?.author || `${currentAdminName} (Thai Sanko)`,
        createdAt: initialData?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        status,
        attachments
      };

      await onSave(article);

      Swal.fire({
        icon: 'success',
        title: initialData ? 'บันทึกการแก้ไขสำเร็จ' : 'เผยแพร่ข่าวสารเรียบร้อย',
        text: 'ข้อมูลข่าวสารและเอกสารแนบได้รับการบันทึกเข้าสู่ระบบแล้ว',
        timer: 1800,
        showConfirmButton: false
      });

      onClose();
    } catch (err: any) {
      console.error('Error saving news article:', err);
      const errMsg = String(err?.message || '');
      let errorText = 'ไม่สามารถบันทึกข้อมูลได้ กรุณาลองใหม่อีกครั้ง';
      if (errMsg.includes('exceeds maximum allowed size') || errMsg.includes('RESOURCE_EXHAUSTED')) {
        errorText = 'ขนาดไฟล์แนบรวมใหญ่เกินกว่าที่ระบบรองรับ กรุณาลดขนาดไฟล์ หรือใช้การแนบลิงก์ URL แทน';
      }
      Swal.fire({
        icon: 'error',
        title: 'เกิดข้อผิดพลาด',
        text: errorText,
        confirmButtonColor: '#0e5d32'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-[#0e5d32] to-[#1b5e20] text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-white/15 rounded-xl">
              <FileText className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg sm:text-xl font-extrabold tracking-tight">
                {initialData ? 'แก้ไขข่าวสาร / ประกาศ' : 'เพิ่มข่าวสารและเอกสารประกาศใหม่'}
              </h3>
              <p className="text-xs text-white/80">
                สามารถพิมพ์ข้อความ แนบรูปภาพ หรืออัปโหลดเอกสาร PDF เพื่อแจ้งพนักงาน
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body / Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5 custom-scrollbar">
          {/* Title */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              หัวข้อข่าวสาร / ประกาศ <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="เช่น ประกาศปรับตารางเวลาเดินรถรับส่งสาย Route A เริ่ม 1 ต.ค. 2569"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-800 placeholder-slate-400 focus:bg-white focus:ring-2 focus:ring-[#0e5d32] focus:border-transparent outline-none transition-all"
            />
          </div>

          {/* Category, Status & Pin */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                หมวดหมู่ (Category)
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as NewsCategory)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm font-semibold text-slate-800 focus:bg-white focus:ring-2 focus:ring-[#0e5d32] outline-none transition-all"
              >
                <option value="General">ข่าวทั่วไป / ข่าวสารบริษัท</option>
                <option value="Urgent">ประกาศด่วน (Urgent)</option>
                <option value="Route">สายรถและตารางเดินรถ</option>
                <option value="Holiday">วันหยุดและช่วงเทศกาล</option>
                <option value="Maintenance">ซ่อมบำรุง / ความปลอดภัย</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                สถานะ (Status)
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as 'Published' | 'Draft')}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm font-semibold text-slate-800 focus:bg-white focus:ring-2 focus:ring-[#0e5d32] outline-none transition-all"
              >
                <option value="Published">เผยแพร่ทันที (Published)</option>
                <option value="Draft">ฉบับร่าง (Draft)</option>
              </select>
            </div>

            <div className="flex flex-col justify-end">
              <label
                onClick={() => setPinned(!pinned)}
                className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl border cursor-pointer transition-all ${
                  pinned
                    ? 'bg-amber-50 border-amber-300 text-amber-900 font-bold'
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100 font-medium'
                }`}
              >
                <input
                  type="checkbox"
                  checked={pinned}
                  onChange={(e) => setPinned(e.target.checked)}
                  className="rounded text-amber-600 focus:ring-amber-500 w-4 h-4 cursor-pointer"
                />
                <Pin className={`w-4 h-4 ${pinned ? 'text-amber-600 fill-amber-600' : 'text-slate-400'}`} />
                <span className="text-xs">ปักหมุดข่าวสำคัญ (Pin)</span>
              </label>
            </div>
          </div>

          {/* Content Body */}
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                ข้อความประกาศ / รายละเอียดเนื้อหา <span className="text-red-500">*</span>
              </label>
              <span className="text-[11px] text-slate-400">
                รองรับการเว้นบรรทัดและพิมพ์ข้อความยาว
              </span>
            </div>
            <textarea
              required
              rows={6}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="พิมพ์ข้อความรายละเอียดข่าวสาร คำชี้แจง หรือประกาศสำหรับพนักงานที่นี่..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 text-sm text-slate-800 placeholder-slate-400 focus:bg-white focus:ring-2 focus:ring-[#0e5d32] focus:border-transparent outline-none transition-all resize-y leading-relaxed"
            ></textarea>
          </div>

          {/* Attachments Section (Images & PDF Documents) */}
          <div className="border border-slate-200 rounded-2xl p-4 bg-slate-50/60 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <Upload className="w-4 h-4 text-[#0e5d32]" />
                  เอกสารแนบ / รูปภาพประกอบ / ไฟล์ PDF ({attachments.length})
                </h4>
                <p className="text-[11px] text-slate-500 flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-emerald-600 inline" />
                  ระบบบีบอัดรูปภาพอัตโนมัติ และรองรับไฟล์เอกสาร PDF
                </p>
              </div>

              <div className="flex items-center gap-2">
                {/* File Upload Button */}
                <label className="bg-[#0e5d32] hover:bg-[#0b4a28] text-white px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors shadow-2xs">
                  {isProcessingFiles ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Plus className="w-3.5 h-3.5" />
                  )}
                  <span>{isProcessingFiles ? 'กำลังอ่านไฟล์...' : 'เลือกไฟล์อัปโหลด'}</span>
                  <input
                    type="file"
                    multiple
                    disabled={isProcessingFiles}
                    accept="image/jpeg,image/png,image/webp,image/gif,image/bmp,application/pdf"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>

                {/* URL input toggle */}
                <button
                  type="button"
                  onClick={() => setShowUrlInput(!showUrlInput)}
                  className="bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <LinkIcon className="w-3.5 h-3.5 text-slate-500" />
                  <span>ใส่ลิงก์ URL</span>
                </button>
              </div>
            </div>

            {/* Optional URL Input Panel */}
            {showUrlInput && (
              <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs space-y-2 animate-in fade-in duration-150">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <input
                    type="text"
                    placeholder="ชื่อเอกสารหรือรูปภาพ (เช่น ตารางเดินรถ.pdf)"
                    value={urlName}
                    onChange={(e) => setUrlName(e.target.value)}
                    className="sm:col-span-1 bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-800 outline-none focus:ring-1 focus:ring-[#0e5d32]"
                  />
                  <input
                    type="url"
                    placeholder="วาง URL (https://.../document.pdf หรือรูปภาพ)"
                    value={urlLink}
                    onChange={(e) => setUrlLink(e.target.value)}
                    className="sm:col-span-1 bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-800 outline-none focus:ring-1 focus:ring-[#0e5d32]"
                  />
                  <div className="flex items-center gap-2">
                    <select
                      value={urlType}
                      onChange={(e) => setUrlType(e.target.value as 'image' | 'pdf')}
                      className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-800 outline-none"
                    >
                      <option value="image">รูปภาพ (Image)</option>
                      <option value="pdf">เอกสาร PDF</option>
                    </select>
                    <button
                      type="button"
                      onClick={handleAddUrlAttachment}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-lg text-xs font-bold shrink-0 cursor-pointer"
                    >
                      เพิ่ม
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Loading Indicator during file processing */}
            {isProcessingFiles && (
              <div className="flex items-center justify-center gap-2 p-4 bg-emerald-50/80 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-semibold animate-pulse">
                <Loader2 className="w-4 h-4 animate-spin text-[#0e5d32]" />
                <span>กำลังประมวลผลและบีบอัดรูปภาพให้เหมาะสมสำหรับระบบ...</span>
              </div>
            )}

            {/* List of Attached Files */}
            {attachments.length === 0 ? (
              <div className="border border-dashed border-slate-300 rounded-xl p-6 text-center text-slate-400">
                <Upload className="w-8 h-8 mx-auto mb-1 text-slate-300 stroke-1" />
                <p className="text-xs font-medium">ยังไม่มีไฟล์เอกสารหรือรูปภาพแนบ</p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  คลิกปุ่ม &quot;เลือกไฟล์อัปโหลด&quot; ด้านบนเพื่อแนบรูปภาพหรือเอกสาร PDF
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                {attachments.map((att) => {
                  const displayUrl = att.url || att.thumbnailUrl;
                  return (
                    <div
                      key={att.id}
                      className="flex items-center justify-between p-2.5 bg-white border border-slate-200 rounded-xl shadow-2xs group hover:border-slate-300 transition-all"
                    >
                      <div className="flex items-center gap-2.5 min-w-0 pr-2">
                        {att.type === 'pdf' ? (
                          <div className="p-2 bg-red-50 text-red-600 rounded-lg shrink-0 border border-red-100">
                            <FileText className="w-5 h-5" />
                          </div>
                        ) : (
                          <div className="w-10 h-10 rounded-lg overflow-hidden bg-slate-100 shrink-0 border border-slate-200 flex items-center justify-center">
                            {displayUrl ? (
                              <img
                                src={displayUrl}
                                alt={att.name}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  (e.target as HTMLElement).style.display = 'none';
                                }}
                              />
                            ) : (
                              <ImageIcon className="w-4 h-4 text-slate-400" />
                            )}
                          </div>
                        )}

                        <div className="min-w-0">
                          <p className="text-xs font-bold text-slate-800 truncate" title={att.name}>
                            {att.name}
                          </p>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span
                              className={`text-[9px] font-extrabold px-1.5 py-0.2 rounded uppercase ${
                                att.type === 'pdf'
                                  ? 'bg-red-100 text-red-700'
                                  : 'bg-blue-100 text-blue-700'
                              }`}
                            >
                              {att.type.toUpperCase()}
                            </span>
                            {att.size && (
                              <span className="text-[10px] text-slate-400">{att.size}</span>
                            )}
                          </div>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleRemoveAttachment(att.id)}
                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer shrink-0"
                        title="ลบไฟล์นี้"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Tips notification */}
          <div className="flex items-start gap-2 bg-emerald-50/70 border border-emerald-200/60 p-3 rounded-xl text-xs text-emerald-900">
            <AlertCircle className="w-4 h-4 text-[#0e5d32] shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              <strong>คำแนะนำ:</strong> ข่าวสารที่บันทึกจะแสดงในหน้า <strong>&quot;ข่าวสารและประกาศ&quot;</strong> โดยพนักงานทุกคนสามารถเปิดอ่าน ดาวน์โหลดเอกสาร PDF หรือเปิดดูรูปภาพได้แบบเรียลไทม์
            </p>
          </div>

          {/* Modal Footer Buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting || isProcessingFiles}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              disabled={isSubmitting || isProcessingFiles}
              className="bg-[#0e5d32] hover:bg-[#0b4a28] text-white px-5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md hover:shadow-lg transition-all cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>กำลังบันทึก...</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>{initialData ? 'บันทึกการแก้ไข' : 'เผยแพร่ข่าวสาร'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
