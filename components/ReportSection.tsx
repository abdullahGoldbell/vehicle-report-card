'use client';

export function ReportSection({
  title,
  badge,
  children,
}: {
  title: string;
  badge?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-lg shadow-sm overflow-hidden">
      <div className="bg-[#C8A951] px-5 py-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-white uppercase tracking-wide">{title}</h3>
        {badge && (
          <span className="bg-white/20 text-white text-xs px-2 py-0.5 rounded">{badge}</span>
        )}
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}
