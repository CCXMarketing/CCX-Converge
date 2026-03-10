import { useState } from 'react';
import { generateUpdateReport, exportToPDF, getPortfolioSummary } from '../../shared/services/reportingService';

const UpdateGenerator = () => {
  const [timeRange, setTimeRange] = useState('Last Month');
  const [report, setReport] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedReport, setEditedReport] = useState('');

  const timeRanges = ['Last Week', 'Last Month', 'Last Quarter', 'Year to Date', 'Custom'];

  const handleGenerate = async () => {
    setIsLoading(true);
    setError(null);
    setReport('');
    setIsEditing(false);

    try {
      const result = await generateUpdateReport(timeRange);
      setReport(result);
      setEditedReport(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportPDF = () => {
    const content = isEditing ? editedReport : report;
    exportToPDF(`Partnership Update — ${timeRange}`, content);
  };

  const handleCopy = () => {
    const content = isEditing ? editedReport : report;
    navigator.clipboard.writeText(content);
  };

  const summary = getPortfolioSummary();

  const formatReport = (text) => {
    if (!text) return null;
    const lines = text.split('\n');
    const elements = [];

    lines.forEach((line, idx) => {
      const trimmed = line.trim();
      if (trimmed.startsWith('# ')) {
        elements.push(<h2 key={idx} className="text-lg font-bold text-[#02475A] mt-4 mb-2">{trimmed.replace(/^#+\s*/, '')}</h2>);
      } else if (trimmed.startsWith('## ')) {
        elements.push(<h3 key={idx} className="text-base font-semibold text-[#02475A] mt-3 mb-1 border-b border-gray-200 pb-1">{trimmed.replace(/^#+\s*/, '')}</h3>);
      } else if (trimmed.startsWith('### ')) {
        elements.push(<h4 key={idx} className="text-sm font-semibold text-[#404041] mt-2 mb-1">{trimmed.replace(/^#+\s*/, '')}</h4>);
      } else if (trimmed.startsWith('- ') || trimmed.startsWith('• ')) {
        const content = trimmed.replace(/^[-•]\s*/, '');
        const parts = content.split(/(\*\*[^*]+\*\*)/g);
        const processed = parts.map((part, pi) => {
          if (part.startsWith('**') && part.endsWith('**')) {
            return <strong key={pi} className="text-[#02475A]">{part.replace(/\*\*/g, '')}</strong>;
          }
          return part;
        });
        elements.push(
          <div key={idx} className="flex items-start gap-2 ml-2 my-0.5">
            <span className="text-[#ADC837] mt-0.5 shrink-0">•</span>
            <span className="text-sm text-[#404041]">{processed}</span>
          </div>
        );
      } else if (trimmed.startsWith('---')) {
        elements.push(<hr key={idx} className="my-3 border-gray-200" />);
      } else if (trimmed.startsWith('*') && trimmed.endsWith('*') && !trimmed.startsWith('**')) {
        elements.push(<p key={idx} className="text-xs text-gray-400 italic my-1">{trimmed.replace(/\*/g, '')}</p>);
      } else if (trimmed === '') {
        elements.push(<div key={idx} className="h-1.5" />);
      } else {
        const parts = trimmed.split(/(\*\*[^*]+\*\*)/g);
        const processed = parts.map((part, pi) => {
          if (part.startsWith('**') && part.endsWith('**')) {
            return <strong key={pi} className="text-[#02475A]">{part.replace(/\*\*/g, '')}</strong>;
          }
          return part;
        });
        elements.push(<p key={idx} className="text-sm text-[#404041] my-1 leading-relaxed">{processed}</p>);
      }
    });

    return elements;
  };

  return (
    <div className="space-y-6">
      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Active Partners', value: summary.partners.active, color: 'text-[#02475A]' },
          { label: 'Avg Health', value: `${summary.partners.avgHealthScore}%`, color: summary.partners.avgHealthScore >= 60 ? 'text-green-600' : 'text-amber-600' },
          { label: 'Active Prospects', value: summary.prospects.total, color: 'text-[#02475A]' },
          { label: 'Interactions (30d)', value: summary.activity.last30Days, color: 'text-[#02475A]' }
        ].map((stat, i) => (
          <div key={i} className="bg-white rounded-xl p-3 border border-gray-200 shadow-sm text-center">
            <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
            <p className="text-xs text-gray-500 mt-0.5">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Generator Controls */}
      <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm">
        <h3 className="text-[#02475A] font-semibold text-sm mb-1 flex items-center gap-2">
          <svg className="w-4 h-4 text-[#ADC837]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Update Generator
        </h3>
        <p className="text-xs text-gray-500 mb-4">Generate AI-written narrative summaries of recent partnership activity.</p>

        <div className="flex flex-wrap items-end gap-3">
          <div className="flex-1 min-w-[200px]">
            <label className="text-xs text-gray-500 block mb-1">Time Range</label>
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="w-full bg-gray-50 border border-gray-300 rounded-lg px-3 py-2 text-[#404041] text-sm focus:outline-none focus:border-[#ADC837]"
            >
              {timeRanges.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <button
            onClick={handleGenerate}
            disabled={isLoading}
            className="bg-[#02475A] hover:bg-[#035d77] text-white px-5 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {isLoading ? (
              <>
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                Generating...
              </>
            ) : (
              <>Generate Report</>
            )}
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3">
          <p className="text-red-600 text-sm">{error}</p>
        </div>
      )}

      {/* Report Output */}
      {report && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          {/* Toolbar */}
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-200 bg-gray-50">
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500 font-medium">Partnership Update — {timeRange}</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setIsEditing(!isEditing);
                  if (!isEditing) setEditedReport(report);
                }}
                className={`text-xs px-3 py-1 rounded-md font-medium transition-colors ${
                  isEditing
                    ? 'bg-[#ADC837] text-white'
                    : 'text-gray-500 hover:text-[#02475A] hover:bg-gray-100'
                }`}
              >
                {isEditing ? 'Preview' : 'Edit'}
              </button>
              <button
                onClick={handleCopy}
                className="text-xs text-gray-500 hover:text-[#02475A] px-3 py-1 rounded-md hover:bg-gray-100 transition-colors font-medium"
              >
                Copy
              </button>
              <button
                onClick={handleExportPDF}
                className="text-xs bg-[#02475A] text-white px-3 py-1 rounded-md hover:bg-[#035d77] transition-colors font-medium flex items-center gap-1"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Export PDF
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-6">
            {isEditing ? (
              <textarea
                value={editedReport}
                onChange={(e) => setEditedReport(e.target.value)}
                className="w-full min-h-[400px] bg-gray-50 border border-gray-300 rounded-lg px-4 py-3 text-sm text-[#404041] font-mono leading-relaxed focus:outline-none focus:border-[#ADC837] resize-y"
              />
            ) : (
              <div className="prose-converge">{formatReport(report)}</div>
            )}
          </div>
        </div>
      )}

      {/* Empty State */}
      {!report && !isLoading && !error && (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
          <svg className="w-12 h-12 mx-auto text-gray-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <p className="text-gray-400 text-sm">Select a time range and generate your partnership update report.</p>
          <p className="text-gray-400 text-xs mt-1">Reports use AI to create narrative summaries from your Converge data.</p>
        </div>
      )}
    </div>
  );
};

export default UpdateGenerator;