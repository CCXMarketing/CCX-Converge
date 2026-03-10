import React, { useCallback } from 'react';
import { Globe, Building2, Tag } from 'lucide-react';

export default function ProspectCard({ prospect, onClick }) {
  const handleDragStart = useCallback(
    (e) => {
      e.dataTransfer.setData('text/plain', prospect.id);
      e.dataTransfer.effectAllowed = 'move';
      // Add a slight opacity to the dragged element
      e.currentTarget.style.opacity = '0.5';
    },
    [prospect.id]
  );

  const handleDragEnd = useCallback((e) => {
    e.currentTarget.style.opacity = '1';
  }, []);

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      }}
      className="group cursor-pointer rounded-xl border border-[#E5E7EB] bg-white p-4 shadow-sm transition-all hover:border-[#ADC837]/40 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-[#ADC837] focus:ring-offset-2 active:scale-[0.98]"
      aria-label={`Prospect: ${prospect.company}`}
    >
      {/* Company Name */}
      <div className="mb-2 flex items-start justify-between">
        <div className="flex items-center gap-2">
          <Building2 className="h-4 w-4 flex-shrink-0 text-[#02475A]" />
          <h4 className="text-sm font-bold text-gray-900 leading-tight">
            {prospect.company}
          </h4>
        </div>
      </div>

      {/* Website */}
      {prospect.website && (
        <div className="mb-3 flex items-center gap-2">
          <Globe className="h-3.5 w-3.5 flex-shrink-0 text-gray-400" />
          <span className="truncate text-xs text-[#02475A] hover:text-[#ADC837]">
            {prospect.website}
          </span>
        </div>
      )}

      {/* Footer: Source Badge */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Tag className="h-3 w-3 text-[#6B8A1A]" />
          <span className="inline-block rounded-md bg-[rgba(173,200,55,0.15)] px-2 py-0.5 text-[11px] font-semibold text-[#6B8A1A]">
            {prospect.source}
          </span>
        </div>

        {/* Created date */}
        {prospect.createdAt && (
          <span className="text-[11px] text-gray-400">
            {new Date(prospect.createdAt).toLocaleDateString(undefined, {
              month: 'short',
              day: 'numeric',
            })}
          </span>
        )}
      </div>
    </div>
  );
}
