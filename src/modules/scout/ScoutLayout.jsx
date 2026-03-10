import React, { useState } from 'react';
import WebScraper from './WebScraper';
import CompanyResults from './CompanyResults';
import BatchProspecting from './BatchProspecting';
import PartnerProspectingSearch from './PartnerProspectingSearch';

/**
 * ScoutLayout - AI-powered web research and prospecting
 */
export default function ScoutLayout() {
  const [activeTab, setActiveTab] = useState('single');

  return (
    <div className="p-8 bg-gray-50 min-h-full">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-[#02475A]">Scout</h1>
        <p className="text-gray-600 mt-2">AI-powered web research and partner prospecting</p>
      </div>

      {/* Tabs */}
      <div className="mb-6 border-b border-gray-200">
        <div className="flex gap-8">
          <button
            onClick={() => setActiveTab('single')}
            className={`pb-4 px-2 font-medium transition-colors ${
              activeTab === 'single'
                ? 'text-[#ADC837] border-b-2 border-[#ADC837]'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Single URL Research
          </button>
          <button
            onClick={() => setActiveTab('search')}
            className={`pb-4 px-2 font-medium transition-colors ${
              activeTab === 'search'
                ? 'text-[#ADC837] border-b-2 border-[#ADC837]'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Partner Search
          </button>
          <button
            onClick={() => setActiveTab('batch')}
            className={`pb-4 px-2 font-medium transition-colors ${
              activeTab === 'batch'
                ? 'text-[#ADC837] border-b-2 border-[#ADC837]'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Batch Prospecting
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="space-y-6">
        {activeTab === 'single' && (
          <>
            <WebScraper />
            <CompanyResults />
          </>
        )}
        
        {activeTab === 'search' && <PartnerProspectingSearch />}
        
        {activeTab === 'batch' && <BatchProspecting />}
      </div>
    </div>
  );
}