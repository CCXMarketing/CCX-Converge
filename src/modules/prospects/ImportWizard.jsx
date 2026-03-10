// src/modules/prospects/ImportWizard.jsx
// Multi-step import wizard: Upload → Preview → Map Fields → Review → Import
// Handles Excel (.xlsx) and CSV files
// Requires: npm install xlsx

import { useState, useCallback, useMemo } from 'react';
import { collection, addDoc, Timestamp } from 'firebase/firestore';
import { db } from '../../config/firebase';
import {
  getImportableFields,
  suggestFieldMapping,
  parseImportValue,
  FIELD_DEFINITIONS,
} from '../../config/fieldDefinitions';

// ─────────────────────────────────────────────
// STEP INDICATOR
// ─────────────────────────────────────────────
const StepIndicator = ({ currentStep, steps }) => (
  <div className="flex items-center justify-center mb-8">
    {steps.map((step, index) => (
      <div key={step} className="flex items-center">
        <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-semibold
          ${index < currentStep ? 'bg-[#ADC837] text-white' :
            index === currentStep ? 'bg-[#02475A] text-white' :
            'bg-gray-200 text-gray-500'}`}>
          {index < currentStep ? '✓' : index + 1}
        </div>
        <span className={`ml-2 text-sm ${index === currentStep ? 'font-semibold text-[#02475A]' : 'text-gray-500'}`}>
          {step}
        </span>
        {index < steps.length - 1 && (
          <div className={`w-12 h-0.5 mx-3 ${index < currentStep ? 'bg-[#ADC837]' : 'bg-gray-200'}`} />
        )}
      </div>
    ))}
  </div>
);

// ─────────────────────────────────────────────
// STEP 1: FILE UPLOAD
// ─────────────────────────────────────────────
const StepUpload = ({ onFileLoaded }) => {
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const processFile = async (file) => {
    setError(null);
    setLoading(true);

    const ext = file.name.split('.').pop().toLowerCase();
    if (!['xlsx', 'xls', 'csv'].includes(ext)) {
      setError('Please upload an Excel (.xlsx, .xls) or CSV (.csv) file.');
      setLoading(false);
      return;
    }

    try {
      // Dynamically import xlsx library
      const XLSX = await import('xlsx');
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data, { type: 'array', cellDates: true });

      // Use first sheet
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];

      // Convert to JSON array with headers
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { defval: null });
      const headers = jsonData.length > 0 ? Object.keys(jsonData[0]) : [];

      if (headers.length === 0 || jsonData.length === 0) {
        setError('The file appears to be empty or has no headers.');
        setLoading(false);
        return;
      }

      // Filter out completely empty rows
      const filteredData = jsonData.filter(row =>
        Object.values(row).some(v => v !== null && v !== undefined && v !== '')
      );

      onFileLoaded({
        fileName: file.name,
        sheetName,
        headers,
        data: filteredData,
        totalSheets: workbook.SheetNames.length,
        allSheetNames: workbook.SheetNames,
      });
    } catch (err) {
      console.error('File parse error:', err);
      setError(`Failed to read file: ${err.message}`);
    }
    setLoading(false);
  };

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setDragActive(false);
    if (e.dataTransfer.files?.[0]) processFile(e.dataTransfer.files[0]);
  }, []);

  const handleChange = (e) => {
    if (e.target.files?.[0]) processFile(e.target.files[0]);
  };

  return (
    <div className="max-w-xl mx-auto">
      <div
        className={`border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-colors
          ${dragActive ? 'border-[#ADC837] bg-[#ADC837]/5' : 'border-gray-300 hover:border-[#02475A]/40'}`}
        onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
        onDragLeave={() => setDragActive(false)}
        onDrop={handleDrop}
        onClick={() => document.getElementById('file-input').click()}
      >
        <div className="text-4xl mb-3">{loading ? '⏳' : '📁'}</div>
        {loading ? (
          <p className="text-gray-600">Reading file...</p>
        ) : (
          <>
            <p className="text-gray-700 font-medium mb-1">
              Drag & drop your spreadsheet here
            </p>
            <p className="text-gray-400 text-sm">
              or click to browse — supports .xlsx, .xls, .csv
            </p>
          </>
        )}
      </div>
      <input
        id="file-input"
        type="file"
        accept=".xlsx,.xls,.csv"
        onChange={handleChange}
        className="hidden"
      />
      {error && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
        </div>
      )}
    </div>
  );
};

// ─────────────────────────────────────────────
// STEP 2: DATA PREVIEW
// ─────────────────────────────────────────────
const StepPreview = ({ fileInfo }) => {
  const previewRows = fileInfo.data.slice(0, 8);

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-semibold text-[#02475A]">{fileInfo.fileName}</h3>
          <p className="text-sm text-gray-500">
            Sheet: {fileInfo.sheetName} • {fileInfo.data.length} rows • {fileInfo.headers.length} columns
          </p>
        </div>
        <span className="px-3 py-1 bg-[#ADC837]/10 text-[#ADC837] rounded-full text-sm font-medium">
          Preview (first 8 rows)
        </span>
      </div>

      <div className="overflow-x-auto border rounded-lg">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50">
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 w-10">#</th>
              {fileInfo.headers.map((h, i) => (
                <th key={i} className="px-3 py-2 text-left text-xs font-medium text-gray-700 whitespace-nowrap max-w-[200px]">
                  {h?.replace(/[\n\r]/g, ' ')}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {previewRows.map((row, rowIdx) => (
              <tr key={rowIdx} className={rowIdx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}>
                <td className="px-3 py-2 text-xs text-gray-400">{rowIdx + 1}</td>
                {fileInfo.headers.map((h, colIdx) => (
                  <td key={colIdx} className="px-3 py-2 text-xs text-gray-600 whitespace-nowrap max-w-[200px] truncate">
                    {row[h] instanceof Date
                      ? row[h].toLocaleDateString()
                      : row[h] !== null && row[h] !== undefined
                        ? String(row[h]).substring(0, 50)
                        : <span className="text-gray-300">—</span>
                    }
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────
// STEP 3: FIELD MAPPING
// ─────────────────────────────────────────────
const StepMapping = ({ fileInfo, mappings, setMappings, savedTemplates, onSaveTemplate }) => {
  const importableFields = useMemo(() => getImportableFields(), []);
  const [templateName, setTemplateName] = useState('');

  // Group importable fields by category for the dropdown
  const groupedFields = useMemo(() => {
    const groups = {};
    importableFields.forEach(f => {
      const cat = f.category.charAt(0).toUpperCase() + f.category.slice(1);
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(f);
    });
    return groups;
  }, [importableFields]);

  // Count how many columns have been mapped
  const mappedCount = Object.values(mappings).filter(v => v && v !== '__skip__').length;
  const sampleData = fileInfo.data[0] || {};

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-sm text-gray-600">
            Map each spreadsheet column to a Converge field, or skip columns you don't need.
          </p>
          <p className="text-sm font-medium text-[#02475A] mt-1">
            {mappedCount} of {fileInfo.headers.length} columns mapped
          </p>
        </div>

        {/* Saved templates */}
        <div className="flex items-center gap-2">
          {savedTemplates.length > 0 && (
            <select
              className="text-sm border rounded-lg px-3 py-1.5 text-gray-600"
              onChange={(e) => {
                const template = savedTemplates.find(t => t.name === e.target.value);
                if (template) setMappings(template.mappings);
              }}
              defaultValue=""
            >
              <option value="" disabled>Load template...</option>
              {savedTemplates.map(t => (
                <option key={t.name} value={t.name}>{t.name}</option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* Mapping table */}
      <div className="border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50">
              <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500 w-1/4">
                Spreadsheet Column
              </th>
              <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500 w-1/4">
                Sample Value
              </th>
              <th className="px-4 py-2.5 text-center text-xs font-medium text-gray-400 w-8">→</th>
              <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500 w-1/3">
                Converge Field
              </th>
              <th className="px-4 py-2.5 text-center text-xs font-medium text-gray-500 w-16">
                Status
              </th>
            </tr>
          </thead>
          <tbody>
            {fileInfo.headers.map((header, idx) => {
              const cleanHeader = header?.replace(/[\n\r]/g, ' ');
              const currentMapping = mappings[header] || '';
              const sample = sampleData[header];
              const isMapped = currentMapping && currentMapping !== '__skip__';
              const isSkipped = currentMapping === '__skip__';

              return (
                <tr key={idx} className={`border-t ${isSkipped ? 'opacity-50 bg-gray-50' : ''}`}>
                  <td className="px-4 py-2.5 font-medium text-gray-700 whitespace-nowrap">
                    {cleanHeader}
                  </td>
                  <td className="px-4 py-2.5 text-gray-400 text-xs truncate max-w-[180px]">
                    {sample instanceof Date
                      ? sample.toLocaleDateString()
                      : sample !== null && sample !== undefined
                        ? String(sample).substring(0, 40)
                        : '—'
                    }
                  </td>
                  <td className="px-4 py-2.5 text-center text-gray-300">→</td>
                  <td className="px-4 py-2.5">
                    <select
                      value={currentMapping}
                      onChange={(e) => setMappings(prev => ({ ...prev, [header]: e.target.value }))}
                      className={`w-full text-sm border rounded-lg px-2.5 py-1.5 
                        ${isMapped ? 'border-[#ADC837] bg-[#ADC837]/5' : 
                          isSkipped ? 'border-gray-200 text-gray-400' : 'border-gray-300'}`}
                    >
                      <option value="">— Select field —</option>
                      <option value="__skip__">⊘ Skip this column</option>
                      {Object.entries(groupedFields).map(([category, fields]) => (
                        <optgroup key={category} label={`── ${category} ──`}>
                          {fields.map(f => (
                            <option key={f.key} value={f.key}>
                              {f.label}
                            </option>
                          ))}
                        </optgroup>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-2.5 text-center">
                    {isMapped ? (
                      <span className="text-[#ADC837] text-lg">✓</span>
                    ) : isSkipped ? (
                      <span className="text-gray-400 text-sm">skip</span>
                    ) : (
                      <span className="text-amber-400 text-lg">○</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Save template */}
      <div className="mt-4 flex items-center gap-2">
        <input
          type="text"
          placeholder="Template name (e.g., 'Partner Master List')"
          value={templateName}
          onChange={(e) => setTemplateName(e.target.value)}
          className="flex-1 text-sm border rounded-lg px-3 py-1.5"
        />
        <button
          onClick={() => {
            if (templateName.trim()) {
              onSaveTemplate(templateName.trim(), mappings);
              setTemplateName('');
            }
          }}
          disabled={!templateName.trim() || mappedCount === 0}
          className="px-4 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg disabled:opacity-40"
        >
          Save Template
        </button>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────
// STEP 4: REVIEW & IMPORT
// ─────────────────────────────────────────────
const StepReview = ({ fileInfo, mappings, importing, importResults }) => {
  const activeMappings = Object.entries(mappings).filter(([, v]) => v && v !== '__skip__');
  const skippedColumns = Object.entries(mappings).filter(([, v]) => v === '__skip__').length;
  const unmappedColumns = fileInfo.headers.length - activeMappings.length - skippedColumns;

  // Preview transformed data
  const previewRecord = {};
  if (fileInfo.data[0]) {
    activeMappings.forEach(([sourceCol, targetField]) => {
      const rawValue = fileInfo.data[0][sourceCol];
      previewRecord[targetField] = parseImportValue(rawValue, targetField);
    });
  }

  return (
    <div>
      {importResults ? (
        // ── Import complete ──
        <div className="text-center py-8">
          <div className="text-5xl mb-4">
            {importResults.errors === 0 ? '🎉' : '⚠️'}
          </div>
          <h3 className="text-xl font-bold text-[#02475A] mb-2">
            Import Complete
          </h3>
          <p className="text-gray-600 mb-4">
            <span className="font-semibold text-[#ADC837]">{importResults.success}</span> prospects imported successfully
            {importResults.skipped > 0 && (
              <span> • <span className="text-amber-500">{importResults.skipped}</span> skipped (duplicates or empty)</span>
            )}
            {importResults.errors > 0 && (
              <span> • <span className="text-red-500">{importResults.errors}</span> errors</span>
            )}
          </p>
          {importResults.errorDetails?.length > 0 && (
            <div className="mt-4 text-left max-w-lg mx-auto bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-sm font-medium text-red-700 mb-2">Errors:</p>
              {importResults.errorDetails.slice(0, 5).map((err, i) => (
                <p key={i} className="text-xs text-red-600">Row {err.row}: {err.message}</p>
              ))}
            </div>
          )}
        </div>
      ) : importing ? (
        // ── Importing ──
        <div className="text-center py-12">
          <div className="text-4xl mb-4 animate-bounce">📥</div>
          <p className="text-gray-600 font-medium">Importing prospects...</p>
          <p className="text-sm text-gray-400 mt-1">This may take a moment for large files</p>
        </div>
      ) : (
        // ── Review before import ──
        <div>
          {/* Summary */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-[#02475A]/5 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-[#02475A]">{fileInfo.data.length}</div>
              <div className="text-xs text-gray-500">Records to import</div>
            </div>
            <div className="bg-[#ADC837]/10 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-[#ADC837]">{activeMappings.length}</div>
              <div className="text-xs text-gray-500">Fields mapped</div>
            </div>
            <div className="bg-gray-100 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-gray-400">{skippedColumns + unmappedColumns}</div>
              <div className="text-xs text-gray-500">Columns skipped</div>
            </div>
          </div>

          {/* Field mapping summary */}
          <div className="mb-6">
            <h4 className="text-sm font-semibold text-gray-700 mb-2">Field Mappings</h4>
            <div className="grid grid-cols-2 gap-1">
              {activeMappings.map(([source, target]) => (
                <div key={source} className="flex items-center text-xs py-1">
                  <span className="text-gray-500 truncate w-1/2">{source.replace(/[\n\r]/g, ' ')}</span>
                  <span className="mx-2 text-gray-300">→</span>
                  <span className="font-medium text-[#02475A] truncate w-1/2">
                    {FIELD_DEFINITIONS[target]?.label || target}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Sample record preview */}
          <div>
            <h4 className="text-sm font-semibold text-gray-700 mb-2">Sample Record (Row 1)</h4>
            <div className="bg-gray-50 rounded-lg p-3 space-y-1">
              {Object.entries(previewRecord).map(([field, value]) => (
                <div key={field} className="flex text-xs">
                  <span className="text-gray-500 w-1/3">{FIELD_DEFINITIONS[field]?.label || field}:</span>
                  <span className="text-gray-800 font-medium">
                    {value === true ? '✓ Yes' : value === false ? '✗ No' : value === null ? '—' : String(value)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ─────────────────────────────────────────────
// MAIN IMPORT WIZARD
// ─────────────────────────────────────────────
const ImportWizard = ({ isOpen, onClose, onImportComplete }) => {
  const [step, setStep] = useState(0);
  const [fileInfo, setFileInfo] = useState(null);
  const [mappings, setMappings] = useState({});
  const [savedTemplates, setSavedTemplates] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('converge_import_templates') || '[]');
    } catch { return []; }
  });
  const [importing, setImporting] = useState(false);
  const [importResults, setImportResults] = useState(null);

  const steps = ['Upload', 'Preview', 'Map Fields', 'Import'];

  // When file is loaded, auto-suggest mappings
  const handleFileLoaded = (info) => {
    setFileInfo(info);

    // Auto-suggest mappings
    const autoMap = {};
    info.headers.forEach(header => {
      const suggestion = suggestFieldMapping(header);
      if (suggestion) {
        autoMap[header] = suggestion;
      }
    });
    setMappings(autoMap);

    setStep(1); // Jump to preview
  };

  // Save mapping template
  const handleSaveTemplate = (name, mappingData) => {
    const templates = [...savedTemplates.filter(t => t.name !== name), { name, mappings: mappingData }];
    setSavedTemplates(templates);
    try {
      localStorage.setItem('converge_import_templates', JSON.stringify(templates));
    } catch { /* localStorage might be full */ }
  };

  // Execute import
  const handleImport = async () => {
    setImporting(true);
    const results = { success: 0, skipped: 0, errors: 0, errorDetails: [] };
    const activeMappings = Object.entries(mappings).filter(([, v]) => v && v !== '__skip__');

    for (let i = 0; i < fileInfo.data.length; i++) {
      const row = fileInfo.data[i];

      try {
        // Build prospect record from mappings
        const prospect = {
          // System defaults
          pipeline_stage: 'New',
          source: 'Spreadsheet Import',
          status: 'Prospect',
          created_at: Timestamp.now(),
          updated_at: Timestamp.now(),
          imported_at: Timestamp.now(),
          import_file: fileInfo.fileName,
          import_row: i + 2, // +2 because row 1 is header, data is 0-indexed
        };

        // Apply mappings
        activeMappings.forEach(([sourceCol, targetField]) => {
          const rawValue = row[sourceCol];
          const parsedValue = parseImportValue(rawValue, targetField);
          if (parsedValue !== null) {
            prospect[targetField] = parsedValue;
          }
        });

        // Skip rows without a company name
        if (!prospect.company_name || prospect.company_name.trim() === '') {
          results.skipped++;
          continue;
        }

        // Write to Firestore 'prospects' collection
        await addDoc(collection(db, 'prospects'), prospect);
        results.success++;
      } catch (err) {
        results.errors++;
        results.errorDetails.push({
          row: i + 2,
          message: err.message,
        });
      }
    }

    setImportResults(results);
    setImporting(false);

    if (onImportComplete) {
      onImportComplete(results);
    }
  };

  // Reset wizard
  const handleReset = () => {
    setStep(0);
    setFileInfo(null);
    setMappings({});
    setImporting(false);
    setImportResults(null);
  };

  if (!isOpen) return null;

  const canProceed = () => {
    switch (step) {
      case 0: return false; // Upload auto-advances
      case 1: return true; // Preview always allows next
      case 2: return Object.values(mappings).some(v => v && v !== '__skip__'); // At least 1 mapped
      case 3: return !importing && !importResults; // Can import
      default: return false;
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <div>
            <h2 className="text-lg font-bold text-[#02475A]">Import Prospects</h2>
            <p className="text-xs text-gray-400">Upload a spreadsheet and map columns to Converge fields</p>
          </div>
          <button
            onClick={() => { onClose(); handleReset(); }}
            className="text-gray-400 hover:text-gray-600 text-xl"
          >
            ✕
          </button>
        </div>

        {/* Step Indicator */}
        <div className="px-6 pt-4">
          <StepIndicator currentStep={step} steps={steps} />
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {step === 0 && <StepUpload onFileLoaded={handleFileLoaded} />}
          {step === 1 && fileInfo && <StepPreview fileInfo={fileInfo} />}
          {step === 2 && fileInfo && (
            <StepMapping
              fileInfo={fileInfo}
              mappings={mappings}
              setMappings={setMappings}
              savedTemplates={savedTemplates}
              onSaveTemplate={handleSaveTemplate}
            />
          )}
          {step === 3 && fileInfo && (
            <StepReview
              fileInfo={fileInfo}
              mappings={mappings}
              importing={importing}
              importResults={importResults}
            />
          )}
        </div>

        {/* Footer Navigation */}
        <div className="flex items-center justify-between px-6 py-4 border-t bg-gray-50 rounded-b-2xl">
          <div>
            {step > 0 && step < 3 && (
              <button
                onClick={() => setStep(s => s - 1)}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
              >
                ← Back
              </button>
            )}
          </div>
          <div className="flex gap-3">
            {importResults ? (
              <>
                <button
                  onClick={handleReset}
                  className="px-4 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg"
                >
                  Import Another
                </button>
                <button
                  onClick={() => { onClose(); handleReset(); }}
                  className="px-6 py-2 text-sm bg-[#02475A] text-white rounded-lg hover:bg-[#02475A]/90"
                >
                  Done
                </button>
              </>
            ) : step === 3 ? (
              <button
                onClick={handleImport}
                disabled={importing}
                className="px-6 py-2 text-sm bg-[#ADC837] text-white rounded-lg hover:bg-[#ADC837]/90 
                  disabled:opacity-50 font-semibold"
              >
                {importing ? 'Importing...' : `Import ${fileInfo?.data.length || 0} Prospects`}
              </button>
            ) : step > 0 ? (
              <button
                onClick={() => setStep(s => s + 1)}
                disabled={!canProceed()}
                className="px-6 py-2 text-sm bg-[#02475A] text-white rounded-lg hover:bg-[#02475A]/90 
                  disabled:opacity-40 font-semibold"
              >
                Next →
              </button>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImportWizard;
