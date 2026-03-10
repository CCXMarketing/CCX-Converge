import { useState } from 'react';
import { scrapeWebsite, batchScrape, saveToProspects, getCompetitors } from '../services/scoutService';

/**
 * useScout - Hook for Scout web research operations
 */
export function useScout() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [results, setResults] = useState(null);

  /**
   * Scrape a single URL
   */
  const scrape = async (url) => {
    setLoading(true);
    setError(null);
    
    const result = await scrapeWebsite(url);
    
    if (result.success) {
      setResults(result.data);
    } else {
      setError(result.error);
    }
    
    setLoading(false);
    return result;
  };

  /**
   * Batch scrape multiple URLs
   */
  const batchProcess = async (urls) => {
    setLoading(true);
    setError(null);
    
    const result = await batchScrape(urls);
    
    if (result.success) {
      setResults(result.results);
    } else {
      setError(result.error);
    }
    
    setLoading(false);
    return result;
  };

  /**
   * Save scraped data to prospects
   */
  const saveAsProspect = async (companyData) => {
    setLoading(true);
    setError(null);
    
    const result = await saveToProspects(companyData);
    
    setLoading(false);
    return result;
  };

  /**
   * Clear current results
   */
  const clearResults = () => {
    setResults(null);
    setError(null);
  };

  return {
    scrape,
    batchProcess,
    saveAsProspect,
    clearResults,
    results,
    loading,
    error
  };
}

export default useScout;