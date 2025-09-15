// src/components/ui/button.tsx
import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { Loader2 } from 'lucide-react';

import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-[10px] xs:text-xs sm:text-sm md:text-base font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-3 xs:[&_svg]:size-4 sm:[&_svg]:size-5 [&_svg]:shrink-0 hover:scale-105',
  {
    variants: {
      variant: {
        default: 'bg-accent text-white shadow hover:bg-accent/90',
        destructive: 'bg-danger text-white shadow-sm hover:bg-danger/90',
        outline: 'border border-border bg-surface shadow-sm hover:bg-accent/10 hover:text-accent',
        secondary: 'bg-secondary text-text shadow-sm hover:bg-secondary/80',
        ghost: 'hover:bg-accent/10 hover:text-accent data-[state=inactive]:text-text data-[state=inactive]:bg-transparent',
        link: 'text-accent underline-offset-4 hover:underline',
        loading: 'bg-accent text-white cursor-not-allowed',
      },
      size: {
        default: 'h-7 xs:h-8 sm:h-9 px-2 xs:px-3 sm:px-4 py-1 xs:py-1.5 sm:py-2',
        sm: 'h-6 xs:h-7 sm:h-8 px-2 xs:px-3 py-1 text-[10px] xs:text-xs',
        lg: 'h-8 xs:h-9 sm:h-10 px-4 xs:px-6 py-1.5 xs:py-2',
        icon: 'h-7 xs:h-8 sm:h-9 w-7 xs:w-8 sm:w-9',
        xl: 'h-9 xs:h-10 sm:h-12 px-4 xs:px-6 py-2 text-xs xs:text-sm sm:text-base',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  loading?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, loading = false, children, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    const classNames = cn(buttonVariants({ variant: loading ? 'loading' : variant, size, className }));

    if (asChild && React.isValidElement(children)) {
      return (
        <Comp ref={ref} {...props}>
          {React.cloneElement(children as React.ReactElement, {
            className: cn((children as React.ReactElement).props.className, classNames),
            disabled: loading || props.disabled,
            'aria-busy': loading,
            ...props,
            children: (
              <>
                {loading && <Loader2 className="mr-1 xs:mr-2 h-3 w-3 xs:h-4 xs:w-4 sm:h-5 sm:w-5 animate-spin" />}
                {(children as React.ReactElement).props.children}
              </>
            ),
          })}
        </Comp>
      );
    }

    return (
      <Comp
        className={classNames}
        ref={ref}
        disabled={loading || props.disabled}
        aria-busy={loading}
        {...props}
      >
        {loading && <Loader2 className="mr-1 xs:mr-2 h-3 w-3 xs:h-4 xs:w-4 sm:h-5 sm:w-5 animate-spin" />}
        {children}
      </Comp>
    );
  }
);
Button.displayName = 'Button';

export { Button, buttonVariants };