import React, { useState, useEffect, useRef } from 'react';
import {
  FileText, Download, X, ExternalLink, ZoomIn, ZoomOut, ChevronLeft,
  ChevronRight, RotateCw, Loader2, AlertCircle
} from 'lucide-react';
import * as pdfjsLib from 'pdfjs-dist';
// @ts-expect-error Vite ?url asset import
import pdfWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

// Initialize PDF.js worker using Vite's static asset URL
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

interface PdfViewerModalProps {
  name: string;
  url: string;
  onClose: () => void;
}

function base64ToUint8Array(base64: string): Uint8Array {
  const base64Clean = base64.includes(',') ? base64.split(',')[1] : base64;
  const binaryString = window.atob(base64Clean);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

export const PdfViewerModal: React.FC<PdfViewerModalProps> = ({ name, url, onClose }) => {
  const [numPages, setNumPages] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [scale, setScale] = useState<number>(1.2);
  const [rotation, setRotation] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const pdfDocRef = useRef<any>(null);
  const renderTaskRef = useRef<any>(null);

  // Load PDF Document
  useEffect(() => {
    let isCancelled = false;
    setLoading(true);
    setError(null);
    setCurrentPage(1);

    async function loadPdf() {
      try {
        let loadingTask;
        if (url.startsWith('data:application/pdf') || url.startsWith('data:;base64,') || !url.startsWith('http')) {
          const bytes = base64ToUint8Array(url);
          loadingTask = pdfjsLib.getDocument({ data: bytes });
        } else {
          loadingTask = pdfjsLib.getDocument({ url });
        }

        const pdf = await loadingTask.promise;
        if (isCancelled) return;

        pdfDocRef.current = pdf;
        setNumPages(pdf.numPages);
        setLoading(false);
      } catch (err: any) {
        console.error('Error loading PDF document:', err);
        if (!isCancelled) {
          setError(err?.message || 'ไม่สามารถโหลดไฟล์ PDF ได้');
          setLoading(false);
        }
      }
    }

    loadPdf();

    return () => {
      isCancelled = true;
      if (renderTaskRef.current) {
        renderTaskRef.current.cancel();
      }
    };
  }, [url]);

  // Render current page to Canvas whenever page, scale, or rotation changes
  useEffect(() => {
    if (!pdfDocRef.current || numPages === 0) return;

    let isCancelled = false;

    async function renderPage() {
      try {
        const page = await pdfDocRef.current.getPage(currentPage);
        if (isCancelled || !canvasRef.current) return;

        const canvas = canvasRef.current;
        const context = canvas.getContext('2d');
        if (!context) return;

        // Cancel previous rendering task if running
        if (renderTaskRef.current) {
          try {
            renderTaskRef.current.cancel();
          } catch {
            // ignore cancel error
          }
        }

        const dpr = window.devicePixelRatio || 1;
        const viewport = page.getViewport({ scale: scale * dpr, rotation });

        canvas.width = viewport.width;
        canvas.height = viewport.height;
        canvas.style.width = `${viewport.width / dpr}px`;
        canvas.style.height = `${viewport.height / dpr}px`;

        const renderContext = {
          canvasContext: context,
          viewport: viewport
        };

        const renderTask = page.render(renderContext);
        renderTaskRef.current = renderTask;

        await renderTask.promise;
      } catch (err: any) {
        if (err?.name !== 'RenderingCancelledException') {
          console.error('Page render error:', err);
        }
      }
    }

    renderPage();

    return () => {
      isCancelled = true;
    };
  }, [currentPage, scale, rotation, numPages]);

  // Open in new browser tab
  const handleOpenInNewTab = () => {
    try {
      if (url.startsWith('data:')) {
        const bytes = base64ToUint8Array(url);
        const blob = new Blob([bytes], { type: 'application/pdf' });
        const blobUrl = URL.createObjectURL(blob);
        window.open(blobUrl, '_blank');
      } else {
        window.open(url, '_blank');
      }
    } catch (e) {
      console.error('Failed to open PDF in new tab:', e);
      window.open(url, '_blank');
    }
  };

  // Download PDF file
  const handleDownload = () => {
    try {
      if (url.startsWith('data:')) {
        const bytes = base64ToUint8Array(url);
        const blob = new Blob([bytes], { type: 'application/pdf' });
        const blobUrl = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = blobUrl;
        a.download = name || 'document.pdf';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(() => URL.revokeObjectURL(blobUrl), 3000);
      } else {
        const a = document.createElement('a');
        a.href = url;
        a.download = name || 'document.pdf';
        a.target = '_blank';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      }
    } catch (e) {
      console.error('Failed to download PDF:', e);
    }
  };

  return (
    <div className="fixed inset-0 z-60 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-5xl h-[92vh] flex flex-col overflow-hidden">
        
        {/* Top Header / Bar */}
        <div className="px-4 py-3 bg-[#0f2c59] text-white flex flex-wrap items-center justify-between gap-3 shadow-md z-10">
          <div className="flex items-center gap-2.5 truncate max-w-[280px] sm:max-w-md">
            <div className="p-1.5 bg-red-500/20 text-red-400 rounded-lg">
              <FileText className="w-5 h-5 shrink-0" />
            </div>
            <span className="text-sm font-bold truncate text-slate-100" title={name}>
              {name}
            </span>
          </div>

          {/* Controls: Zoom, Page Navigation, Open, Download, Close */}
          <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap ml-auto">
            {/* Page Navigation */}
            {numPages > 1 && (
              <div className="flex items-center bg-white/10 rounded-xl px-1.5 py-1 text-xs text-white">
                <button
                  type="button"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage <= 1}
                  className="p-1 hover:bg-white/20 disabled:opacity-30 rounded-lg transition-colors cursor-pointer"
                  title="หน้าก่อนหน้า"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="px-2 font-semibold">
                  {currentPage} / {numPages}
                </span>
                <button
                  type="button"
                  onClick={() => setCurrentPage((p) => Math.min(numPages, p + 1))}
                  disabled={currentPage >= numPages}
                  className="p-1 hover:bg-white/20 disabled:opacity-30 rounded-lg transition-colors cursor-pointer"
                  title="หน้าถัดไป"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Zoom In / Out */}
            <div className="hidden sm:flex items-center bg-white/10 rounded-xl px-1 py-1 text-xs text-white">
              <button
                type="button"
                onClick={() => setScale((s) => Math.max(0.6, Number((s - 0.2).toFixed(1))))}
                className="p-1 hover:bg-white/20 rounded-lg transition-colors cursor-pointer"
                title="ย่อขนาด"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <span className="px-2 font-mono font-medium text-[11px] min-w-[45px] text-center">
                {Math.round(scale * 100)}%
              </span>
              <button
                type="button"
                onClick={() => setScale((s) => Math.min(2.5, Number((s + 0.2).toFixed(1))))}
                className="p-1 hover:bg-white/20 rounded-lg transition-colors cursor-pointer"
                title="ขยายขนาด"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
            </div>

            {/* Rotate */}
            <button
              type="button"
              onClick={() => setRotation((r) => (r + 90) % 360)}
              className="p-1.5 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-colors cursor-pointer"
              title="หมุนหน้าเอกสาร 90°"
            >
              <RotateCw className="w-4 h-4" />
            </button>

            {/* Open in New Tab */}
            <button
              type="button"
              onClick={handleOpenInNewTab}
              className="bg-white/10 hover:bg-white/20 text-white px-2.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              title="เปิดในแท็บใหม่"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span className="hidden md:inline">แท็บใหม่</span>
            </button>

            {/* Download */}
            <button
              type="button"
              onClick={handleDownload}
              className="bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
              title="ดาวน์โหลดไฟล์ PDF"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">ดาวน์โหลด</span>
            </button>

            {/* Close */}
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 bg-white/15 hover:bg-red-600 text-white rounded-xl transition-colors cursor-pointer ml-1"
              title="ปิด"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Viewer Area */}
        <div className="flex-1 bg-slate-200/90 overflow-auto p-4 sm:p-8 flex items-center justify-center custom-scrollbar select-none">
          {loading && (
            <div className="flex flex-col items-center justify-center gap-3 text-slate-600 bg-white/80 p-8 rounded-3xl shadow-lg">
              <Loader2 className="w-10 h-10 animate-spin text-[#0e5d32]" />
              <p className="text-sm font-bold">กำลังประมวลผลและเรนเดอร์เอกสาร PDF...</p>
              <p className="text-xs text-slate-400">โปรดรอสักครู่</p>
            </div>
          )}

          {error && (
            <div className="flex flex-col items-center justify-center p-8 bg-white rounded-3xl shadow-xl border border-red-100 max-w-md text-center">
              <div className="p-3 bg-red-100 text-red-600 rounded-2xl mb-3">
                <AlertCircle className="w-8 h-8" />
              </div>
              <h4 className="text-base font-bold text-slate-800">ไม่สามารถแสดงผลเอกสารได้โดยตรง</h4>
              <p className="text-xs text-slate-500 mt-1 mb-5">
                {error} หรือเบราว์เซอร์ติดการตั้งค่าความปลอดภัย
              </p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleOpenInNewTab}
                  className="bg-[#0f2c59] hover:bg-[#0b2245] text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>เปิดดูในแท็บใหม่</span>
                </button>
                <button
                  type="button"
                  onClick={handleDownload}
                  className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>ดาวน์โหลดไฟล์</span>
                </button>
              </div>
            </div>
          )}

          {/* PDF Canvas Rendering */}
          <div
            className={`transition-all duration-150 flex items-center justify-center ${
              loading || error ? 'hidden' : 'block'
            }`}
          >
            <div className="shadow-2xl rounded-lg overflow-hidden border border-slate-300 bg-white">
              <canvas ref={canvasRef} className="block mx-auto" />
            </div>
          </div>
        </div>

        {/* Bottom Page Indicator on Mobile */}
        {numPages > 1 && !loading && !error && (
          <div className="sm:hidden px-4 py-2 bg-slate-900 text-white flex items-center justify-between text-xs">
            <button
              type="button"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage <= 1}
              className="px-3 py-1 bg-white/10 rounded-lg disabled:opacity-30"
            >
              ก่อนหน้า
            </button>
            <span className="font-semibold">
              หน้า {currentPage} จาก {numPages}
            </span>
            <button
              type="button"
              onClick={() => setCurrentPage((p) => Math.min(numPages, p + 1))}
              disabled={currentPage >= numPages}
              className="px-3 py-1 bg-white/10 rounded-lg disabled:opacity-30"
            >
              ถัดไป
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
