import React, { useState, useCallback } from 'react';
import ProspectCard from './ProspectCard';

export default function ProspectPipeline({
  stages,
  prospectsByStage,
  onSelectProspect,
  onMoveProspect,
}) {
  const [dragOverStage, setDragOverStage] = useState(null);

  const handleDragOver = useCallback((e, stageId) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverStage(stageId);
  }, []);

  const handleDragLeave = useCallback((e) => {
    // Only reset if leaving the column container
    if (!e.currentTarget.contains(e.relatedTarget)) {
      setDragOverStage(null);
    }
  }, []);

  const handleDrop = useCallback(
    (e, stageId) => {
      e.preventDefault();
      setDragOverStage(null);
      const prospectId = e.dataTransfer.getData('text/plain');
      if (prospectId) {
        onMoveProspect(prospectId, stageId);
      }
    },
    [onMoveProspect]
  );

  return (
    <div className="flex h-full gap-4">
      {stages.map((stage) => {
        const stageProspects = prospectsByStage[stage.id] || [];
        const isDragOver = dragOverStage === stage.id;

        return (
          <div
            key={stage.id}
            className={`flex w-72 flex-shrink-0 flex-col rounded-xl transition-colors ${
              isDragOver
                ? 'bg-[rgba(173,200,55,0.08)] ring-2 ring-[#ADC837]/30'
                : 'bg-[#F3F4F6]'
            }`}
            onDragOver={(e) => handleDragOver(e, stage.id)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, stage.id)}
          >
            {/* Stage Header */}
            <div className="flex items-center justify-between px-4 py-3">
              <div className="flex items-center gap-2">
                <span
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: stage.color }}
                  aria-hidden="true"
                />
                <h3 className="text-sm font-semibold text-gray-900">
                  {stage.label}
                </h3>
              </div>
              <span className="flex h-6 min-w-[1.5rem] items-center justify-center rounded-full bg-white px-2 text-xs font-bold text-gray-600 shadow-sm">
                {stageProspects.length}
              </span>
            </div>

            {/* Stage Cards */}
            <div className="flex-1 space-y-2.5 overflow-y-auto px-3 pb-3">
              {stageProspects.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 px-4 py-8 text-center">
                  <p className="text-sm text-gray-400">
                    {isDragOver ? 'Drop here' : 'No prospects'}
                  </p>
                </div>
              ) : (
                stageProspects.map((prospect) => (
                  <ProspectCard
                    key={prospect.id}
                    prospect={prospect}
                    onClick={() => onSelectProspect(prospect)}
                  />
                ))
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
