'use client';

type Variant = 'default' | 'success' | 'warning' | 'danger';

const variantStyles: Record<Variant, string> = {
  default: 'border-l-4 border-l-[#C8A951]',
  success: 'border-l-4 border-l-emerald-500',
  warning: 'border-l-4 border-l-amber-500',
  danger: 'border-l-4 border-l-red-500',
};

export function MetricCard({
  label,
  value,
  subtitle,
  variant = 'default',
}: {
  label: string;
  value: string | number;
  subtitle?: string;
  variant?: Variant;
}) {
  return (
    <div className={`bg-white rounded-lg shadow-sm p-4 ${variantStyles[variant]}`}>
      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</p>
      <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
      {subtitle && <p className="text-xs text-gray-400 mt-1">{subtitle}</p>}
    </div>
  );
}
