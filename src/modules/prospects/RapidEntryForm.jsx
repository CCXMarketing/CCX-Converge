import React, { useState, useCallback, useEffect, useRef } from 'react';
import { X, Plus } from 'lucide-react';

const SOURCE_OPTIONS = [
  'Website',
  'Referral',
  'LinkedIn',
  'Conference',
  'Cold Outreach',
  'Other',
];

export default function RapidEntryForm({ onClose, onSubmit }) {
  const [company, setCompany] = useState('');
  const [website, setWebsite] = useState('');
  const [source, setSource] = useState('');
  const [otherSource, setOtherSource] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const companyInputRef = useRef(null);

  // Focus company input on mount
  useEffect(() => {
    companyInputRef.current?.focus();
  }, []);

  // Escape key handler
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const handleBackdropClick = useCallback(
    (e) => {
      if (e.target === e.currentTarget) {
        onClose();
      }
    },
    [onClose]
  );

  const handleSubmit = useCallback(
    async (e) => {
      e.preventDefault();
      setError('');

      // Validation
      if (!company.trim()) {
        setError('Company name is required.');
        return;
      }
      if (!source) {
        setError('Please select a source.');
        return;
      }

      setIsSubmitting(true);
      try {
        await onSubmit({
          company: company.trim(),
          website: website.trim() || null,
          source: source === 'Other' && otherSource.trim() ? `Other: ${otherSource.trim()}` : source,
        });
      } catch (err) {
        setError(err.message || 'Failed to add prospect. Please try again.');
      } finally {
        setIsSubmitting(false);
      }
    },
    [company, website, source, otherSource, onSubmit]
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-label="Add New Prospect"
    >
      <div className="w-full max-w-md rounded-2xl bg-white shadow-xl font-['Nunito_Sans',sans-serif]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
          <h2 className="text-lg font-bold text-gray-900">Add New Prospect</h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-[#ADC837]"
            aria-label="Close dialog"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="space-y-4 px-6 py-5">
          {/* Error Message */}
          {error && (
            <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {/* Company Name */}
          <div>
            <label
              htmlFor="prospect-company"
              className="mb-1 block text-xs font-medium text-gray-500"
            >
              Company Name <span className="text-red-500">*</span>
            </label>
            <input
              ref={companyInputRef}
              id="prospect-company"
              type="text"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              placeholder="e.g. Acme Healthcare"
              className="h-10 w-full rounded-lg border border-gray-300 px-3 text-sm text-gray-900 placeholder-gray-400 transition-colors focus:border-[#ADC837] focus:outline-none focus:ring-[3px] focus:ring-[rgba(173,200,55,0.2)]"
            />
          </div>

          {/* Website URL */}
          <div>
            <label
              htmlFor="prospect-website"
              className="mb-1 block text-xs font-medium text-gray-500"
            >
              Website URL
            </label>
            <input
              id="prospect-website"
              type="url"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              placeholder="https://example.com"
              className="h-10 w-full rounded-lg border border-gray-300 px-3 text-sm text-gray-900 placeholder-gray-400 transition-colors focus:border-[#ADC837] focus:outline-none focus:ring-[3px] focus:ring-[rgba(173,200,55,0.2)]"
            />
          </div>

          {/* Source Dropdown */}
          <div>
            <label
              htmlFor="prospect-source"
              className="mb-1 block text-xs font-medium text-gray-500"
            >
              Source <span className="text-red-500">*</span>
            </label>
            <select
              id="prospect-source"
              value={source}
              onChange={(e) => setSource(e.target.value)}
              className="h-10 w-full appearance-none rounded-lg border border-gray-300 px-3 text-sm text-gray-900 transition-colors focus:border-[#ADC837] focus:outline-none focus:ring-[3px] focus:ring-[rgba(173,200,55,0.2)]"
            >
              <option value="" disabled>
                Select a source...
              </option>
              {SOURCE_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
            {source === 'Other' && (
              <input
                type="text"
                value={otherSource}
                onChange={(e) => setOtherSource(e.target.value)}
                placeholder="Please specify..."
                className="mt-2 h-10 w-full rounded-lg border border-gray-300 px-3 text-sm text-gray-900 placeholder-gray-400 transition-colors focus:border-[#ADC837] focus:outline-none focus:ring-[3px] focus:ring-[rgba(173,200,55,0.2)]"
              />
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 border-t border-gray-200 px-6 py-4">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="rounded-lg border border-[#02475A] px-5 py-2.5 text-sm font-semibold text-[#02475A] transition-colors hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#ADC837] focus:ring-offset-2 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 rounded-lg bg-[#ADC837] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#9AB52F] active:bg-[#8AA228] focus:outline-none focus:ring-[3px] focus:ring-[rgba(173,200,55,0.2)] disabled:opacity-50"
            >
              <Plus className="h-4 w-4" />
              {isSubmitting ? 'Adding...' : 'Add Prospect'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}