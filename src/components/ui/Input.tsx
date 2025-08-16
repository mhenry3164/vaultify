import { forwardRef } from 'react';
import { cn } from '@/lib/utils';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          'flex h-12 w-full rounded-xl border border-elegant-600 bg-elegant-800/50 backdrop-blur-sm px-4 py-2 text-white placeholder:text-elegant-400 focus:border-gold-400 focus:outline-none focus:ring-2 focus:ring-gold-400/20 focus:bg-elegant-700/50 disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-200 font-medium tracking-wide shadow-elegant',
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);

Input.displayName = 'Input';

export { Input };