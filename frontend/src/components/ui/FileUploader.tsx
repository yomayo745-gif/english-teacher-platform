import React, { useState, useRef } from 'react';
import { UploadCloud, CheckCircle2, FileText, X, AlertCircle, Loader2 } from 'lucide-react';
import { api } from '../../api/client';
import { useLanguage } from '../../context/LanguageContext';

interface FileUploaderProps {
  onFileUploaded: (url: string, filename: string) => void;
  accept?: string;
  maxSizeMb?: number;
  initialUrl?: string | null;
  label?: string;
  isAdmin?: boolean;
}

export const FileUploader: React.FC<FileUploaderProps> = ({
  onFileUploaded,
  accept = 'image/*,.pdf',
  maxSizeMb = 25,
  initialUrl,
  label,
  isAdmin = false,
}) => {
  const { t, tr, localizeError } = useLanguage();
  const [fileUrl, setFileUrl] = useState<string | null>(initialUrl || null);
  const [fileName, setFileName] = useState<string>('');
  const [isUploading, setIsUploading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const displayLabel = label || t('media.uploadFile', isAdmin);

  const handleFile = async (file: File) => {
    setErrorMsg(null);

    if (file.size > maxSizeMb * 1024 * 1024) {
      setErrorMsg(`${t('media.fileExceedsLimit', isAdmin)} ${maxSizeMb}MB`);
      return;
    }

    setIsUploading(true);
    setFileName(file.name);

    try {
      const res = await api.uploadFile(file);
      setFileUrl(res.file_url);
      onFileUploaded(res.file_url, res.filename);
    } catch (err: any) {
      setErrorMsg(localizeError(err, isAdmin));
    } finally {
      setIsUploading(false);
    }
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const removeFile = () => {
    setFileUrl(null);
    setFileName('');
    onFileUploaded('', '');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const isImage = fileUrl && (fileUrl.endsWith('.jpg') || fileUrl.endsWith('.jpeg') || fileUrl.endsWith('.png') || fileUrl.endsWith('.webp'));

  return (
    <div className="space-y-3">
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(e) => {
          if (e.target.files && e.target.files[0]) {
            handleFile(e.target.files[0]);
          }
        }}
      />

      {!fileUrl && !isUploading && (
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={onDrop}
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-slate-300 hover:border-brand-500 hover:bg-brand-50/20 bg-slate-50/60 rounded-2xl p-6 text-center cursor-pointer transition-all duration-200 group"
        >
          <div className="w-11 h-11 mx-auto rounded-full bg-brand-50 group-hover:bg-brand-100 flex items-center justify-center text-brand-600 mb-2.5 transition-colors">
            <UploadCloud className="w-5 h-5 text-brand-600" />
          </div>
          <p className="text-xs font-semibold text-slate-800 mb-1">{displayLabel}</p>
          <p className="text-[11px] text-slate-500">
            {t('media.dragDrop', isAdmin)}
          </p>
          <p className="text-[10px] text-slate-400 mt-1 font-mono">
            {t('media.allowedFormats', isAdmin)}
          </p>
        </div>
      )}

      {isUploading && (
        <div className="border border-brand-200 bg-brand-50/40 rounded-2xl p-5 text-center flex flex-col items-center justify-center gap-2">
          <Loader2 className="w-6 h-6 animate-spin text-brand-600" />
          <p className="text-xs font-semibold text-slate-800">
            {t('media.uploading', isAdmin)}
          </p>
          <p className="text-[11px] text-slate-500 font-mono truncate max-w-[240px]">{fileName}</p>
        </div>
      )}

      {errorMsg && (
        <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {fileUrl && (
        <div className="relative border border-slate-200 bg-white rounded-2xl p-3 shadow-sm flex items-center justify-between">
          <div className="flex items-center gap-3 overflow-hidden">
            {isImage ? (
              <img
                src={fileUrl}
                alt="Preview"
                className="w-14 h-14 object-cover rounded-xl border border-slate-200 shrink-0"
              />
            ) : (
              <div className="w-14 h-14 rounded-xl bg-indigo-50 text-brand-600 flex items-center justify-center shrink-0">
                <FileText className="w-6 h-6" />
              </div>
            )}
            <div className="overflow-hidden">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>{t('media.uploaded', isAdmin)}</span>
              </div>
              <p className="text-xs text-slate-700 truncate font-mono mt-0.5 max-w-[200px]">
                {fileName || fileUrl.split('/').pop()}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={removeFile}
            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
            title={t('common.delete', isAdmin)}
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
};
export default FileUploader;
