'use client';

import * as React from 'react';

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
}

const variantClasses = {
  default: 'bg-emerald-600 text-white hover:bg-emerald-700',
  destructive: 'bg-red-600 text-white hover:bg-red-700',
  outline: 'border border-slate-300 bg-white text-slate-700 hover:bg-slate-50',
  secondary: 'bg-slate-200 text-slate-900 hover:bg-slate-300',
  ghost: 'text-slate-600 hover:text-slate-900',
  link: 'text-emerald-600 underline-offset-4 hover:underline',
};

const sizeClasses = {
  default: 'px-5 py-2 rounded-lg',
  sm: 'px-3 py-1.5 rounded-md text-sm',
  lg: 'px-8 py-3 rounded-lg text-base',
  icon: 'px-0 py-0 rounded-lg',
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'default', ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={[
          'inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 disabled:pointer-events-none disabled:opacity-50',
          variantClasses[variant],
          sizeClasses[size],
          className,
        ].join(' ')}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';

export default Button;
