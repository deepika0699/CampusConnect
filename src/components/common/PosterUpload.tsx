import React, { useState, useEffect } from 'react';
import { X, CheckCircle2, AlertCircle, Link as LinkIcon } from 'lucide-react';
import { Button } from './Button';

interface PosterUploadProps {
  campusId?: string;
  eventId?: string;
  currentValue?: string;
  onUploadComplete: (url: string) => void;
  label?: string;
  helperText?: string;
}

export const PosterUpload: React.FC<PosterUploadProps> = ({
  currentValue = '',
  onUploadComplete,
  label = 'Event Cover Poster',
  helperText
}) => {
  const [urlInput, setUrlInput] = useState<string>(currentValue);
  const [previewUrl, setPreviewUrl] = useState<string>(currentValue);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [imageLoadError, setImageLoadError] = useState(false);

  // Sync with prop change if currentValue changes from parent
  useEffect(() => {
    if (currentValue !== previewUrl) {
      setUrlInput(currentValue || '');
      setPreviewUrl(currentValue || '');
      setImageLoadError(false);
      setValidationError(null);
    }
  }, [currentValue]);

  const validateUrl = (url: string): { valid: boolean; error?: string } => {
    const trimmed = url.trim();
    if (!trimmed) {
      return { valid: false, error: 'Please enter an image URL.' };
    }

    if (!trimmed.startsWith('https://')) {
      return { valid: false, error: 'URL must start with https://' };
    }

    const lowercase = trimmed.toLowerCase();
    const isCloudinary = lowercase.includes('cloudinary.com');
    const hasImageExtension = /\.(jpg|jpeg|png|webp|gif)($|\?|#)/i.test(trimmed);

    if (!isCloudinary && !hasImageExtension) {
      return {
        valid: false,
        error: 'URL must point to an image file (.jpg, .jpeg, .png, .webp, .gif) or be a Cloudinary image URL.'
      };
    }

    return { valid: true };
  };

  const handleApplyUrl = (inputToValidate?: string) => {
    const val = (inputToValidate !== undefined ? inputToValidate : urlInput).trim();
    if (!val) {
      setPreviewUrl('');
      setImageLoadError(false);
      setValidationError(null);
      onUploadComplete('');
      return;
    }

    const result = validateUrl(val);
    if (!result.valid) {
      setValidationError(result.error || 'Invalid image URL.');
      return;
    }

    setValidationError(null);
    setImageLoadError(false);
    setPreviewUrl(val);
    onUploadComplete(val);
  };

  const handleRemoveImage = () => {
    setUrlInput('');
    setPreviewUrl('');
    setValidationError(null);
    setImageLoadError(false);
    onUploadComplete('');
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-xs font-bold text-slate-700 tracking-tight">{label}</label>
        {previewUrl && !imageLoadError && (
          <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-1 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
            <CheckCircle2 className="h-3 w-3" /> Image Active
          </span>
        )}
      </div>

      {/* Helper message regarding free URL mode */}
      <div className="p-3 bg-amber-50/90 border border-amber-200/90 rounded-2xl text-[11px] text-amber-800 leading-relaxed font-medium flex items-start gap-2.5 shadow-2xs">
        <AlertCircle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
        <span>
          Firebase Storage is not enabled on the current plan. Paste a public HTTPS image URL (Cloudinary, Imgur, GitHub raw, etc.) to use a poster.
        </span>
      </div>

      {/* Live Poster Image Preview */}
      {previewUrl && !imageLoadError ? (
        <div className="relative group rounded-3xl overflow-hidden border border-slate-200 bg-slate-900 shadow-xs">
          <img
            src={previewUrl}
            alt="Event cover poster preview"
            className="w-full h-48 object-cover transition-opacity duration-300"
            onError={() => setImageLoadError(true)}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent opacity-90 group-hover:opacity-100 transition-opacity" />

          <div className="absolute top-3 right-3 flex items-center gap-2">
            <button
              type="button"
              onClick={handleRemoveImage}
              className="p-1.5 rounded-full bg-slate-900/80 text-slate-200 hover:bg-rose-600 hover:text-white transition-colors cursor-pointer shadow-md"
              title="Remove poster image"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      ) : imageLoadError ? (
        <div className="p-3 bg-rose-50 border border-rose-200 rounded-2xl flex items-center justify-between text-xs text-rose-700 font-medium">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-rose-500 shrink-0" />
            <span>Failed to load image from URL. Please verify the image link is publicly accessible.</span>
          </div>
          <button
            type="button"
            onClick={handleRemoveImage}
            className="text-[10px] font-bold text-rose-600 underline cursor-pointer shrink-0 ml-2"
          >
            Clear
          </button>
        </div>
      ) : null}

      {/* Primary Action: URL Input Field */}
      <div className="space-y-2 bg-slate-50 p-3.5 border border-slate-200/80 rounded-2xl">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <input
              type="url"
              placeholder="https://images.unsplash.com/photo-... or https://res.cloudinary.com/..."
              value={urlInput}
              onChange={(e) => {
                setUrlInput(e.target.value);
                if (validationError) setValidationError(null);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleApplyUrl();
                }
              }}
              className="w-full pl-8 pr-3 py-2 border border-slate-200 rounded-xl text-xs bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
            <LinkIcon className="h-3.5 w-3.5 text-slate-400 absolute left-2.5 top-2.5" />
          </div>
          <Button size="sm" variant="outline" type="button" onClick={() => handleApplyUrl()}>
            Apply URL
          </Button>
        </div>
      </div>

      {validationError && (
        <div className="p-2.5 bg-rose-50 border border-rose-100 rounded-xl flex items-center gap-2 text-rose-700 text-xs font-semibold">
          <AlertCircle className="h-4 w-4 text-rose-500 shrink-0" />
          <span>{validationError}</span>
        </div>
      )}

      {helperText && <p className="text-[11px] text-slate-400 font-medium pl-1">{helperText}</p>}
    </div>
  );
};
