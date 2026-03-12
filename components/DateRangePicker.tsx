'use client';

import { useState } from 'react';

function toInputDate(d: Date): string {
  return d.toISOString().split('T')[0];
}

export function DateRangePicker({
  startDate,
  endDate,
  onChange,
}: {
  startDate: Date;
  endDate: Date;
  onChange: (start: Date, end: Date) => void;
}) {
  const [start, setStart] = useState(toInputDate(startDate));
  const [end, setEnd] = useState(toInputDate(endDate));

  function handleApply() {
    onChange(new Date(start), new Date(end));
  }

  return (
    <div className="flex items-center gap-3 flex-wrap">
      <div className="flex items-center gap-2">
        <label className="text-sm text-gray-600">From</label>
        <input
          type="date"
          value={start}
          onChange={(e) => setStart(e.target.value)}
          className="border border-gray-300 rounded px-2 py-1 text-sm"
        />
      </div>
      <div className="flex items-center gap-2">
        <label className="text-sm text-gray-600">To</label>
        <input
          type="date"
          value={end}
          onChange={(e) => setEnd(e.target.value)}
          className="border border-gray-300 rounded px-2 py-1 text-sm"
        />
      </div>
      <button
        onClick={handleApply}
        className="bg-[#C8A951] text-white text-sm px-4 py-1.5 rounded hover:bg-[#B8953E] transition-colors"
      >
        Apply
      </button>
    </div>
  );
}
