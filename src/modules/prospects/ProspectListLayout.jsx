import React, { useState, useCallback } from 'react';
import { Plus, Search, Filter, Users } from 'lucide-react';
import { useProspects } from '../../shared/hooks/useProspects';
import ProspectPipeline from './ProspectPipeline';
import ProspectCard from './ProspectCard';
import RapidEntryForm from './RapidEntryForm';
import ImportWizard from './ImportWizard';

const PIPELINE_STAGES = [
  { id: 'new', label: 'New', color: '#3B82F6' },
  { id: 'researching', label: 'Researching', color: '#F59E0B' },
  { id: 'outreach_sent', label: 'Outreach Sent', color: '#8B5CF6' },
  { id: 'meeting_scheduled', label: 'Meeting Scheduled', color: '#10B981' },
  { id: 'evaluating_fit', label: 'Evaluating Fit', color: '#02475A' },
];

export default function ProspectListLayout() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [selectedProspect, setSelectedProspect] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStage, setFilterStage] = useState('all');

  // useProspects hook — future dependency
  // const { prospects, addProspect, updateProspect, moveProspect } = useProspects();

  // Placeholder data until hook is available
  const [prospects, setProspects] = useState([]);

  const handleOpenModal = useCallback(() => {
    setIsModalOpen(true);
  }, []);

  const handleCloseModal = useCallback(() => {
    setIsModalOpen(false);
  }, []);

  const handleSelectProspect = useCallback((prospect) => {
    setSelectedProspect(prospect);
  }, []);

  const handleCloseDetail = useCallback(() => {
    setSelectedProspect(null);
  }, []);

  const handleAddProspect = useCallback((newProspect) => {
    const prospect = {
      id: crypto.randomUUID(),
      ...newProspect,
      stage: 'new',
      createdAt: new Date().toISOString(),
    };
    setProspects((prev) => [...prev, prospect]);
    setIsModalOpen(false);
  }, []);

  const handleMoveProspect = useCallback((prospectId, newStage) => {
    setProspects((prev) =>
      prev.map((p) => (p.id === prospectId ? { ...p, stage: newStage } : p))
    );
  }, []);

  const filteredProspects = prospects.filter((p) => {
    const matchesSearch =
      !searchQuery ||
      p.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.website && p.website.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesStage = filterStage === 'all' || p.stage === filterStage;
    return matchesSearch && matchesStage;
  });

  const prospectsByStage = PIPELINE_STAGES.reduce((acc, stage) => {
    acc[stage.id] = filteredProspects.filter((p) => p.stage === stage.id);
    return acc;
  }, {});

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50 font-['Nunito_Sans',sans-serif]">
      {/* Main Content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Header */}
        <header className="flex items-center justify-between border-b border-gray-200 bg-white px-6 py-4">
          <div className="flex items-center gap-3">
            <Users className="h-6 w-6 text-[#02475A]" />
            <h1 className="text-2xl font-bold text-gray-900">Prospect Pipeline</h1>
            <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-sm font-medium text-gray-600">
              {prospects.length}
            </span>
          </div>

          <div className="flex items-center gap-3">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search prospects..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-10 w-64 rounded-lg border border-gray-300 pl-10 pr-4 text-sm text-gray-900 placeholder-gray-400 focus:border-[#ADC837] focus:outline-none focus:ring-[3px] focus:ring-[rgba(173,200,55,0.2)]"
              />
            </div>

            {/* Stage Filter */}
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <select
                value={filterStage}
                onChange={(e) => setFilterStage(e.target.value)}
                className="h-10 appearance-none rounded-lg border border-gray-300 pl-10 pr-8 text-sm text-gray-700 focus:border-[#ADC837] focus:outline-none focus:ring-[3px] focus:ring-[rgba(173,200,55,0.2)]"
              >
                <option value="all">All Stages</option>
                {PIPELINE_STAGES.map((stage) => (
                  <option key={stage.id} value={stage.id}>
                    {stage.label}
                  </option>
                ))}
              </select>
            </div>
            {/* Import Spreadsheet Button */}
            <button
              onClick={() => setShowImport(true)}
              className="inline-flex items-center gap-2 rounded-lg border border-[#02475A] px-5 py-2.5 text-sm font-semibold text-[#02475A] transition-colors hover:bg-[#02475A]/5"
            >
              📥 Import
            </button>

            {/* Add Prospect Button */}
            <button
              onClick={handleOpenModal}
              className="inline-flex items-center gap-2 rounded-lg bg-[#ADC837] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#9AB52F] active:bg-[#8AA228] focus:outline-none focus:ring-[3px] focus:ring-[rgba(173,200,55,0.2)]"
            >
              <Plus className="h-4 w-4" />
              Add Prospect
            </button>
          </div>
        </header>

        {/* Pipeline View */}
        <div className="flex-1 overflow-x-auto overflow-y-hidden p-6">
          <ProspectPipeline
            stages={PIPELINE_STAGES}
            prospectsByStage={prospectsByStage}
            onSelectProspect={handleSelectProspect}
            onMoveProspect={handleMoveProspect}
          />
        </div>
      </div>

      {/* Detail Panel */}
      {selectedProspect && (
        <aside className="w-96 flex-shrink-0 overflow-y-auto border-l border-gray-200 bg-white">
          <div className="border-b border-gray-200 px-6 py-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900">
                {selectedProspect.company}
              </h2>
              <button
                onClick={handleCloseDetail}
                className="rounded-md p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                aria-label="Close detail panel"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          <div className="space-y-6 p-6">
            {/* Company Info */}
            <div className="rounded-lg border border-gray-200 bg-white p-5">
              <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-900">
                Company Details
              </h3>
              <dl className="space-y-3">
                <div>
                  <dt className="text-xs font-medium text-gray-500">Website</dt>
                  <dd className="mt-0.5 text-sm text-[#02475A]">
                    {selectedProspect.website || '—'}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-medium text-gray-500">Source</dt>
                  <dd className="mt-0.5">
                    <span className="inline-block rounded-md bg-[rgba(173,200,55,0.15)] px-2.5 py-0.5 text-xs font-semibold text-[#6B8A1A]">
                      {selectedProspect.source}
                    </span>
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-medium text-gray-500">Stage</dt>
                  <dd className="mt-0.5 text-sm font-medium text-gray-900">
                    {PIPELINE_STAGES.find((s) => s.id === selectedProspect.stage)?.label || selectedProspect.stage}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-medium text-gray-500">Added</dt>
                  <dd className="mt-0.5 text-sm text-gray-700">
                    {new Date(selectedProspect.createdAt).toLocaleDateString()}
                  </dd>
                </div>
              </dl>
            </div>
          </div>
        </aside>
      )}

      {/* Rapid Entry Modal */}
      {isModalOpen && (
        <RapidEntryForm
          onClose={handleCloseModal}
          onSubmit={handleAddProspect}
        />
      )}

      {/* Import Wizard Modal */}
      <ImportWizard
        isOpen={showImport}
        onClose={() => setShowImport(false)}
        onImportComplete={(results) => {
          console.log('Import complete:', results);
          setShowImport(false);
        }}
      />
    </div>
  );
}
