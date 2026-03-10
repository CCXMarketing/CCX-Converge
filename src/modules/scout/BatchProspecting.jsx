import React, { useState } from 'react';
import { useScout } from '../../shared/hooks/useScout';

export default function BatchProspecting() {
  const [urls, setUrls] = useState('');
  const { batchProcess, results, loading, error } = useScout();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const urlList = urls
      .split('\n')
      .map(url => url.trim())
      .filter(url => url.length > 0);

    if (urlList.length === 0) return;

    await batchProcess(urlList);
  };

  const urlCount = urls.split('\n').filter(url => url.trim().length > 0).length;

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold text-[#02475A] mb-4">Batch Prospecting</h2>
        <p className="text-sm text-gray-600 mb-6">
          Enter multiple website URLs (one per line) to research companies in bulk.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="urls" className="block text-sm font-medium text-gray-700 mb-2">
              Company URLs
            </label>
            <textarea
              id="urls"
              value={urls}
              onChange={(e) => setUrls(e.target.value)}
              placeholder="Enter one URL per line"
              rows={8}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#ADC837] focus:border-[#ADC837] outline-none"
            />
            <p className="text-sm text-gray-500 mt-2">{urlCount} URLs</p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={loading || urlCount === 0}
              className="px-6 py-2 bg-[#ADC837] text-white font-semibold rounded-lg hover:bg-[#9AB830] disabled:bg-gray-300 transition-colors"
            >
              {loading ? 'Processing...' : 'Process URLs'}
            </button>
            
            <button
              type="button"
              onClick={() => setUrls('')}
              className="px-6 py-2 bg-gray-100 text-gray-700 font-semibold rounded-lg hover:bg-gray-200 transition-colors"
            >
              Clear
            </button>
          </div>
        </form>
      </div>

      {results && Array.isArray(results) && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-[#02475A] mb-4">Results</h3>
          <div className="space-y-3">
            {results.map((result, index) => (
              <div key={index} className="p-4 border border-gray-200 rounded-lg">
                {result.success ? (
                  <div>
                    <p className="font-semibold">{result.data.companyName}</p>
                    <p className="text-sm text-gray-600">{result.data.url}</p>
                  </div>
                ) : (
                  <p className="text-red-600 text-sm">Error: {result.error}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}