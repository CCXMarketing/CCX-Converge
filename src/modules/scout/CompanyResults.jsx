import React from 'react';
import { useScout } from '../../shared/hooks/useScout';

/**
 * CompanyResults - Display scraped company data
 */
export default function CompanyResults() {
  const { results, saveAsProspect, loading } = useScout();

  if (!results) return null;

  const handleSaveToProspects = async () => {
    const result = await saveAsProspect(results);
    if (result.success) {
      alert('Company saved to Prospect List!');
    } else {
      alert('Error saving: ' + result.error);
    }
  };

  const confidenceColor = results.confidence >= 0.7 ? 'text-green-600' : 'text-yellow-600';
  const fitColor = results.competitorFlag === 'Partner Fit' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800';

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-[#02475A]">Research Results</h2>
        <span className={`px-3 py-1 rounded-full text-sm font-medium ${fitColor}`}>
          {results.competitorFlag}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Company Info */}
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-500">Company Name</label>
            <p className="text-lg font-semibold text-gray-900">{results.companyName}</p>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-500">Website</label>
            <p className="text-gray-900">
              <a href={results.url} target="_blank" rel="noopener noreferrer" className="text-[#ADC837] hover:underline">
                {results.url}
              </a>
            </p>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-500">CEO/Leadership</label>
            <p className="text-gray-900">{results.ceo || 'Not found'}</p>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-500">Headquarters</label>
            <p className="text-gray-900">{results.headquarters || 'Not found'}</p>
          </div>
        </div>

        {/* Contact Info */}
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-500">Email</label>
            <p className="text-gray-900">{results.email || 'Not found'}</p>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-500">Phone</label>
            <p className="text-gray-900">{results.phone || 'Not found'}</p>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-500">Confidence Score</label>
            <p className={`text-lg font-semibold ${confidenceColor}`}>
              {(results.confidence * 100).toFixed(0)}%
            </p>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-500">Scraped At</label>
            <p className="text-gray-900">
              {new Date(results.scrapedAt).toLocaleString()}
            </p>
          </div>
        </div>
      </div>

      {/* Description */}
      <div className="mb-6">
        <label className="text-sm font-medium text-gray-500">Company Description</label>
        <p className="text-gray-900 mt-2">{results.description || 'No description available'}</p>
      </div>

      {/* Product Categories */}
      {results.productCategories && results.productCategories.length > 0 && (
        <div className="mb-6">
          <label className="text-sm font-medium text-gray-500 mb-2 block">Product Categories</label>
          <div className="flex flex-wrap gap-2">
            {results.productCategories.map((category, index) => (
              <span
                key={index}
                className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm"
              >
                {category}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3 pt-6 border-t">
        <button
          onClick={handleSaveToProspects}
          disabled={loading || results.competitorFlag === 'Competitor'}
          className="px-6 py-2 bg-[#ADC837] text-white font-semibold rounded-lg hover:bg-[#9AB830] disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? 'Saving...' : 'Save to Prospect List'}
        </button>

        {results.competitorFlag === 'Competitor' && (
          <span className="px-6 py-2 bg-red-50 text-red-600 rounded-lg text-sm font-medium flex items-center">
            Cannot save competitor to prospects
          </span>
        )}
      </div>
    </div>
  );
}