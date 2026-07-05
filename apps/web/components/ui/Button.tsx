import { cn } from '@/lib/utils';
import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';

/* ─────────────────────────────────────────────
   Button component terpusat — sesuai design-system.md
   Variants: primary, secondary, dark, dashboard, dashboard-secondary
   Sizes: sm, md, lg
   ───────────────────────────────────────────── */

type ButtonVariant = 'primary' | 'secondary' | 'dark' | 'dashboard' | 'dashboard-secondary';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  children: ReactNode;
  loading?: boolean;
  fullWidth?: boolean;
}

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary: cn(
    'bg-brand-red text-white rounded-full',
    'hover:bg-brand-black active:bg-brand-dark',
    'transition-all duration-200'
  ),
  secondary: cn(
    'rounded-full border border-gray-200/80 bg-white/90',
    'text-brand-text-muted shadow-sm',
    'hover:border-brand-red/30 hover:text-brand-red',
    'dark:border-white/10 dark:bg-white/[0.03] dark:text-brand-text-muted',
    'dark:hover:border-brand-red/30 dark:hover:text-brand-red',
    'transition-all duration-200'
  ),
  dark: cn(
    'bg-brand-black text-white rounded-sm',
    'hover:bg-brand-red',
    'dark:bg-white dark:text-brand-black dark:hover:bg-brand-red dark:hover:text-white',
    'transition-all duration-200'
  ),
  dashboard: cn(
    'bg-brand-red text-white rounded-lg',
    'hover:bg-red-600 active:bg-red-700',
    'transition-colors duration-200'
  ),
  'dashboard-secondary': cn(
    'bg-gray-50 text-gray-700 rounded-lg border border-gray-200',
    'hover:bg-gray-100 active:bg-gray-200',
    'dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700',
    'dark:hover:bg-gray-700 dark:active:bg-gray-600',
    'transition-colors duration-200'
  ),
};

const SIZE_CLASSES: Record<ButtonSize, string> = {
  sm: 'px-3.5 py-1.5 text-[9px] tracking-[0.12em]',
  md: 'px-5 py-2.5 text-[10px] tracking-[0.15em]',
  lg: 'px-8 py-3.5 text-[11px] tracking-[0.2em]',
};

const DASHBOARD_SIZE_CLASSES: Record<ButtonSize, string> = {
  sm: 'px-3 py-1.5 text-xs',
  md: 'px-5 py-2.5 text-sm',
  lg: 'px-6 py-3 text-base',
};

/**
 * Button — komponen button terpusat untuk seluruh app.
 *
 * @param variant - Style variant:
 *   - 'primary': Brand red → black on hover (public pages)
 *   - 'secondary': Bordered ghost (public pages)
 *   - 'dark': Dark CTA with red hover (public pages)
 *   - 'dashboard': Flat red (dashboard/admin)
 *   - 'dashboard-secondary': Flat bordered (dashboard/admin)
 * @param size - Ukuran button: 'sm' | 'md' | 'lg'
 * @param loading - Tampilkan spinner dan disable button
 * @param fullWidth - Button memenuhi lebar parent
 *
 * @example
 * // Primary button
 * <Button variant="primary">Simpan</Button>
 *
 * @example
 * // Dashboard secondary, loading state
 * <Button variant="dashboard-secondary" loading>Menyimpan...</Button>
 *
 * @example
 * // Full width dark CTA
 * <Button variant="dark" fullWidth>Baca Selengkapnya</Button>
 */
const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    variant = 'primary',
    size = 'md',
    children,
    loading = false,
    fullWidth = false,
    disabled,
    className,
    ...props
  },
  ref
) {
  const isDashboard = variant === 'dashboard' || variant === 'dashboard-secondary';
  const sizeClass = isDashboard ? DASHBOARD_SIZE_CLASSES[size] : SIZE_CLASSES[size];

  return (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={cn(
        'inline-flex items-center justify-center gap-2',
        'font-black uppercase',
        'select-none cursor-pointer',
        'focus-visible:outline-2 focus-visible:outline-brand-red focus-visible:outline-offset-2',
        'disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none',
        VARIANT_CLASSES[variant],
        sizeClass,
        fullWidth && 'w-full',
        className
      )}
      {...props}
    >
      {loading && (
        <svg
          className="animate-spin h-3.5 w-3.5"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      )}
      {children}
    </button>
  );
});

export default Button;
