import { forwardRef } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center rounded-2xl font-semibold transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400 focus-visible:ring-offset-2 focus-visible:ring-offset-elegant-950 disabled:pointer-events-none disabled:opacity-50 tracking-wide',
  {
    variants: {
      variant: {
        primary: 'bg-gradient-gold text-black hover:shadow-gold-glow hover:scale-105 active:scale-95 shadow-elegant',
        secondary: 'border border-elegant-600 bg-elegant-800/50 backdrop-blur-sm text-white hover:border-gold-400 hover:bg-elegant-700/50 hover:text-gold-400 shadow-elegant',
        ghost: 'hover:bg-elegant-800/50 text-elegant-300 hover:text-white backdrop-blur-sm',
        outline: 'border border-gold-400/30 bg-transparent text-gold-400 hover:bg-gold-400 hover:text-black hover:shadow-gold-glow',
      },
      size: {
        sm: 'h-10 px-5 text-sm font-medium',
        md: 'h-12 px-6 text-base',
        lg: 'h-14 px-8 text-lg',
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
  ({ className, variant, size, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);

Button.displayName = 'Button';

export { Button, buttonVariants };