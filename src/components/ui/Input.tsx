import { forwardRef } from 'react';
import { cn } from '@/lib/utils';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <div className="relative">
        <input
          type={type}
          className={cn(
            'flex h-12 w-full rounded-2xl border border-gray-600/50 bg-dark-800/80 backdrop-blur-sm px-4 py-3 text-white placeholder:text-gray-400 transition-all duration-300 focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-400/20 focus:bg-dark-800 hover:border-gray-500 hover:bg-dark-800/90 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:border-gray-600/50',
            className
          )}
          ref={ref}
          {...props}
        />
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-primary-400/0 via-primary-400/5 to-primary-400/0 opacity-0 transition-opacity duration-300 pointer-events-none peer-focus:opacity-100" />
      </div>
    );
  }
);

Input.displayName = 'Input';

export { Input };
