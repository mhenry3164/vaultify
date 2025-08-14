import { forwardRef } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center rounded-2xl font-semibold transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400/50 focus-visible:ring-offset-2 focus-visible:ring-offset-dark-900 disabled:pointer-events-none disabled:opacity-50 disabled:cursor-not-allowed relative overflow-hidden',
  {
    variants: {
      variant: {
        primary: 'bg-gradient-to-r from-[#ffd700] via-[#ffe699] to-[#ffcc00] text-black font-bold shadow-lg hover:shadow-xl hover:shadow-primary-400/25 hover:-translate-y-1 hover:from-[#ffcc00] hover:via-[#ffd700] hover:to-[#ffe699] active:translate-y-0 active:shadow-md',
        secondary: 'border-2 border-gray-600 bg-transparent text-white hover:border-primary-400 hover:text-primary-400 hover:bg-primary-400/5 hover:shadow-lg hover:shadow-primary-400/10 active:bg-primary-400/10',
        ghost: 'hover:bg-dark-800/80 text-gray-300 hover:text-white hover:shadow-md backdrop-blur-sm active:bg-dark-800',
        outline: 'border-2 border-primary-400/30 bg-transparent text-primary-400 hover:border-primary-400 hover:bg-primary-400/10 hover:shadow-lg hover:shadow-primary-400/20',
      },
      size: {
        sm: 'h-10 px-4 text-sm',
        md: 'h-12 px-6 text-base',
        lg: 'h-14 px-8 text-lg',
        xl: 'h-16 px-10 text-xl',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  }
);

interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, children, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size }), className)}
        ref={ref}
        {...props}
      >
        {variant === 'primary' && (
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out" />
        )}
        <span className="relative z-10 flex items-center justify-center">
          {children}
        </span>
      </button>
    );
  }
);

Button.displayName = 'Button';

export { Button, buttonVariants };
