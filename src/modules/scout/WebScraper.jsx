import React, { useState } from 'react';
import { useScout } from '../../shared/hooks/useScout';

/**
 * WebScraper - Single URL research interface
 */
export default function WebScraper() {
  const [url, setUrl] = useState('');
  const { scrape, loading, error } = useScout();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!url.trim()) return;

    await scrape(url);
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-semibold text-[#02475A] mb-4">Web Scraper</h2>
      <p className="text-sm text-gray-600 mb-6">
        Enter a company website URL to extract contact information, company details, and assess partner fit.
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="url" className="block text-sm font-medium text-gray-700 mb-2">
            Company Website URL
          </label>
          <input
            type="url"
            id="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://example.com"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#ADC837] focus:border-[#ADC837] outline-none"
            required
          />
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 bg-[#ADC837] text-white font-semibold rounded-lg hover:bg-[#9AB830] disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Researching...' : 'Research Company'}
          </button>
          
          {url && (
            <button
              type="button"
              onClick={() => setUrl('')}
              className="px-6 py-2 bg-gray-100 text-gray-700 font-semibold rounded-lg hover:bg-gray-200 transition-colors"
            >
              Clear
            </button>
          )}
        </div>
      </form>

      {loading && (
        <div className="mt-6 p-8 bg-gray-50 rounded-lg text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#ADC837]"></div>
          <p className="text-gray-600 mt-4">Analyzing website and extracting data...</p>
        </div>
      )}
    </div>
  );
}