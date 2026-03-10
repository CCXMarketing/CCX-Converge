import React, { useState } from 'react';

/**
 * PartnerProspectingSearch - Industry-based partner discovery
 */
export default function PartnerProspectingSearch() {
  const [partnerType, setPartnerType] = useState('');
  const [geography, setGeography] = useState('');
  const [companySize, setCompanySize] = useState('');
  const [customKeywords, setCustomKeywords] = useState('');
  const [searching, setSearching] = useState(false);

  const partnerTypes = [
    'EMR/EHR',
    'Practice Management',
    'Patient Engagement',
    'Healthcare IT',
    'Senior Care Technology',
    'Medical Billing',
    'Telehealth',
    'Other'
  ];

  const geographies = [
    'Canada',
    'USA',
    'UK',
    'Australia',
    'Global'
  ];

  const companySizes = [
    '1-50 employees',
    '51-200 employees',
    '201-500 employees',
    '500+ employees'
  ];

  const handleSearch = (e) => {
    e.preventDefault();
    
    if (!partnerType && !customKeywords) {
      alert('Please select a partner type or enter keywords');
      return;
    }

    setSearching(true);

    // Build Google search query
    let searchQuery = '';
    
    if (partnerType) {
      searchQuery += `"${partnerType}"`;
    }
    
    if (customKeywords) {
      searchQuery += ` ${customKeywords}`;
    }
    
    if (geography) {
      searchQuery += ` ${geography}`;
    }

    searchQuery += ' software company';

    // Open Google search in new tab
    const googleUrl = `https://www.google.com/search?q=${encodeURIComponent(searchQuery)}`;
    window.open(googleUrl, '_blank');

    setSearching(false);
  };

  const handleReset = () => {
    setPartnerType('');
    setGeography('');
    setCompanySize('');
    setCustomKeywords('');
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-semibold text-[#02475A] mb-4">Partner Prospecting Search</h2>
      <p className="text-sm text-gray-600 mb-6">
        Search for potential partners by industry, geography, and company characteristics. Opens targeted Google search results.
      </p>

      <form onSubmit={handleSearch} className="space-y-6">
        {/* Partner Type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Partner Type *
          </label>
          <select
            value={partnerType}
            onChange={(e) => setPartnerType(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#ADC837] focus:border-[#ADC837] outline-none"
          >
            <option value="">Select partner type...</option>
            {partnerTypes.map(type => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
        </div>

        {/* Geography */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Geographic Focus
          </label>
          <select
            value={geography}
            onChange={(e) => setGeography(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#ADC837] focus:border-[#ADC837] outline-none"
          >
            <option value="">Any location...</option>
            {geographies.map(geo => (
              <option key={geo} value={geo}>{geo}</option>
            ))}
          </select>
        </div>

        {/* Company Size */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Company Size
          </label>
          <select
            value={companySize}
            onChange={(e) => setCompanySize(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#ADC837] focus:border-[#ADC837] outline-none"
          >
            <option value="">Any size...</option>
            {companySizes.map(size => (
              <option key={size} value={size}>{size}</option>
            ))}
          </select>
        </div>

        {/* Custom Keywords */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Custom Keywords (Optional)
          </label>
          <input
            type="text"
            value={customKeywords}
            onChange={(e) => setCustomKeywords(e.target.value)}
            placeholder="e.g., senior care, long-term care, CCRC"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#ADC837] focus:border-[#ADC837] outline-none"
          />
          <p className="text-sm text-gray-500 mt-2">
            Add specific terms to narrow your search
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-4">
          <button
            type="submit"
            disabled={searching || (!partnerType && !customKeywords)}
            className="px-6 py-2 bg-[#ADC837] text-white font-semibold rounded-lg hover:bg-[#9AB830] disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            {searching ? 'Searching...' : 'Search Google'}
          </button>
          
          <button
            type="button"
            onClick={handleReset}
            className="px-6 py-2 bg-gray-100 text-gray-700 font-semibold rounded-lg hover:bg-gray-200 transition-colors"
          >
            Reset Filters
          </button>
        </div>
      </form>

      {/* Instructions */}
      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h4 className="text-sm font-semibold text-blue-900 mb-2">💡 How to Use:</h4>
        <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
          <li>Select partner type and optional filters</li>
          <li>Click "Search Google" to open results in new tab</li>
          <li>Review companies and copy promising URLs</li>
          <li>Paste URLs into "Batch Prospecting" tab for automated research</li>
        </ol>
      </div>
    </div>
  );
}