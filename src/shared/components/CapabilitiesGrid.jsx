// src/shared/components/CapabilitiesGrid.jsx
// Displays the 14 capability fields as a visual checkmark grid (view mode)
// or as toggle switches (edit mode)
// Used in: Profile Card (Radar), Prospect Detail (Prospect List)

import { useState } from 'react';
import { getCapabilityFields } from '../../config/fieldDefinitions';

const CAPABILITY_FIELDS = getCapabilityFields();

// Group capabilities into logical sections for display
const CAPABILITY_GROUPS = [
  {
    label: 'Marketing & Events',
    fields: ['cap_co_marketing', 'cap_digital_promo', 'cap_event_marketing', 'cap_thought_leadership'],
  },
  {
    label: 'Access & Intelligence',
    fields: ['cap_membership_required', 'cap_membership_available', 'cap_market_intelligence', 'cap_lobby_govt', 'cap_board_seat'],
  },
  {
    label: 'Programs & Integration',
    fields: ['cap_partner_program', 'cap_reseller_program', 'cap_marketplace', 'cap_solution_alignment', 'cap_api_available'],
  },
];

/**
 * VIEW MODE: Compact checkmark grid
 * Shows all 14 capabilities in a dense grid with ✓/✗ indicators
 */
const CapabilitiesGridView = ({ data, onEditClick }) => {
  // Count capabilities
  const totalCaps = CAPABILITY_FIELDS.length;
  const activeCaps = CAPABILITY_FIELDS.filter(f => data[f.key] === true).length;
  const unknownCaps = CAPABILITY_FIELDS.filter(f => data[f.key] === null || data[f.key] === undefined).length;

  return (
    <div className="border rounded-lg overflow-hidden">
      {/* Header with summary */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-gray-50 border-b">
        <div className="flex items-center gap-3">
          <h4 className="text-sm font-semibold text-[#02475A]">Partner Capabilities</h4>
          <div className="flex items-center gap-2 text-xs">
            <span className="text-[#ADC837] font-medium">{activeCaps} active</span>
            <span className="text-gray-400">•</span>
            <span className="text-gray-400">{unknownCaps} unknown</span>
          </div>
        </div>
        {onEditClick && (
          <button
            onClick={onEditClick}
            className="text-xs text-[#02475A] hover:underline"
          >
            Edit
          </button>
        )}
      </div>

      {/* Grid */}
      <div className="p-3">
        {CAPABILITY_GROUPS.map((group) => (
          <div key={group.label} className="mb-3 last:mb-0">
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5">
              {group.label}
            </p>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1">
              {group.fields.map(fieldKey => {
                const field = CAPABILITY_FIELDS.find(f => f.key === fieldKey);
                if (!field) return null;
                const value = data[fieldKey];
                const isTrue = value === true;
                const isFalse = value === false;
                const isUnknown = value === null || value === undefined;

                return (
                  <div key={fieldKey} className="flex items-center gap-2 py-0.5">
                    <span className={`w-4 h-4 flex items-center justify-center rounded text-xs flex-shrink-0
                      ${isTrue ? 'bg-[#ADC837]/15 text-[#ADC837]' :
                        isFalse ? 'bg-red-50 text-red-400' :
                        'bg-gray-100 text-gray-300'}`}
                    >
                      {isTrue ? '✓' : isFalse ? '✗' : '?'}
                    </span>
                    <span className={`text-xs truncate
                      ${isTrue ? 'text-gray-700' : isFalse ? 'text-gray-400' : 'text-gray-300'}`}>
                      {field.label.replace('Available', '').replace('Exists', '').trim()}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

/**
 * EDIT MODE: Toggle switches for each capability
 * Full-size with descriptions
 */
const CapabilitiesGridEdit = ({ data, onChange, onDone }) => {
  const handleToggle = (fieldKey) => {
    const currentValue = data[fieldKey];
    // Cycle: null/undefined → true → false → null
    let newValue;
    if (currentValue === true) newValue = false;
    else if (currentValue === false) newValue = null;
    else newValue = true;

    onChange(fieldKey, newValue);
  };

  return (
    <div className="border rounded-lg overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-[#02475A]/5 border-b">
        <h4 className="text-sm font-semibold text-[#02475A]">Edit Capabilities</h4>
        <button
          onClick={onDone}
          className="px-3 py-1 text-xs bg-[#02475A] text-white rounded-lg hover:bg-[#02475A]/90"
        >
          Done
        </button>
      </div>

      <div className="p-4 space-y-5">
        {CAPABILITY_GROUPS.map((group) => (
          <div key={group.label}>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
              {group.label}
            </p>
            <div className="space-y-2">
              {group.fields.map(fieldKey => {
                const field = CAPABILITY_FIELDS.find(f => f.key === fieldKey);
                if (!field) return null;
                const value = data[fieldKey];
                const isTrue = value === true;
                const isFalse = value === false;

                return (
                  <div
                    key={fieldKey}
                    className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-gray-50 cursor-pointer"
                    onClick={() => handleToggle(fieldKey)}
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-700">{field.label}</p>
                      <p className="text-xs text-gray-400 truncate">{field.description}</p>
                    </div>
                    <div className="flex items-center gap-1 ml-4">
                      {/* Three-state toggle: Yes / No / Unknown */}
                      <button
                        onClick={(e) => { e.stopPropagation(); onChange(fieldKey, true); }}
                        className={`px-2 py-1 text-xs rounded-l-lg border transition-colors
                          ${isTrue ? 'bg-[#ADC837] text-white border-[#ADC837]' : 'bg-white text-gray-400 border-gray-200 hover:border-gray-300'}`}
                      >
                        Yes
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); onChange(fieldKey, false); }}
                        className={`px-2 py-1 text-xs border-y transition-colors
                          ${isFalse ? 'bg-red-500 text-white border-red-500' : 'bg-white text-gray-400 border-gray-200 hover:border-gray-300'}`}
                      >
                        No
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); onChange(fieldKey, null); }}
                        className={`px-2 py-1 text-xs rounded-r-lg border transition-colors
                          ${!isTrue && !isFalse ? 'bg-gray-300 text-white border-gray-300' : 'bg-white text-gray-400 border-gray-200 hover:border-gray-300'}`}
                      >
                        ?
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="px-4 py-2 border-t bg-gray-50 text-xs text-gray-400">
        Tap a row to cycle through Yes → No → Unknown, or use the buttons.
      </div>
    </div>
  );
};

/**
 * MAIN COMPONENT: Combined view + edit
 * Shows grid summary by default, switches to edit mode on click
 */
const CapabilitiesGrid = ({ data = {}, onChange, readOnly = false }) => {
  const [editing, setEditing] = useState(false);

  if (editing && !readOnly) {
    return (
      <CapabilitiesGridEdit
        data={data}
        onChange={onChange}
        onDone={() => setEditing(false)}
      />
    );
  }

  return (
    <CapabilitiesGridView
      data={data}
      onEditClick={readOnly ? undefined : () => setEditing(true)}
    />
  );
};

export default CapabilitiesGrid;
export { CapabilitiesGridView, CapabilitiesGridEdit };
