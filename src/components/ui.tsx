import type { ButtonHTMLAttributes, HTMLAttributes, ReactNode } from 'react';

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'subtle' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg' | 'icon';
type BadgeVariant = 'default' | 'red' | 'muted' | 'strong';

export function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ');
}

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: ReactNode;
}

export function Button({
  variant = 'primary',
  size = 'md',
  icon,
  children,
  className,
  type = 'button',
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cn('ui-button', `ui-button--${variant}`, `ui-button--${size}`, className)}
      {...props}
    >
      {icon}
      {children ? <span>{children}</span> : null}
    </button>
  );
}

interface SectionProps extends Omit<HTMLAttributes<HTMLElement>, 'title'> {
  eyebrow?: ReactNode;
  title?: ReactNode;
  subtitle?: ReactNode;
  align?: 'start' | 'center';
  compact?: boolean;
  fullHeight?: boolean;
}

export function Section({
  eyebrow,
  title,
  subtitle,
  align = 'start',
  compact = false,
  fullHeight = false,
  className,
  children,
  ...props
}: SectionProps) {
  return (
    <section
      className={cn(
        'turathi-section',
        compact && 'turathi-section--compact',
        fullHeight && 'turathi-section--screen',
        className
      )}
      {...props}
    >
      <div className="turathi-container">
        {(eyebrow || title || subtitle) && (
          <header className={cn('turathi-section-header', align === 'center' && 'center')}>
            {eyebrow ? <span className="section-eyebrow">{eyebrow}</span> : null}
            {title ? <h2>{title}</h2> : null}
            {subtitle ? <p>{subtitle}</p> : null}
          </header>
        )}
        {children}
      </div>
    </section>
  );
}

export function Card({ className, children, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('ui-card', className)} {...props}>
      {children}
    </div>
  );
}

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
}

export function Badge({ variant = 'default', className, children, ...props }: BadgeProps) {
  return (
    <span
      className={cn('ui-badge', variant !== 'default' && `ui-badge--${variant}`, className)}
      {...props}
    >
      {children}
    </span>
  );
}

export function LoadingSpinner({ className }: { className?: string }) {
  return <span className={cn('loading-spinner', className)} aria-hidden="true" />;
}

interface EmptyStateProps {
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  icon?: ReactNode;
  className?: string;
}

export function EmptyState({ title, description, action, icon, className }: EmptyStateProps) {
  return (
    <div className={cn('empty-state', className)}>
      {icon}
      <h3>{title}</h3>
      {description ? <p>{description}</p> : null}
      {action ? <div>{action}</div> : null}
    </div>
  );
}
