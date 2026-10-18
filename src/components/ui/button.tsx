import * as React from "react";
import Link from "next/link";
import { Slot } from "radix-ui";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-full font-semibold transition-all outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50 aria-invalid:ring-destructive/20 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground shadow-sm hover:bg-primary/90 active:translate-y-px",
        destructive: "bg-destructive text-white shadow-sm hover:bg-destructive/90",
        outline: "border-2 border-border bg-card text-foreground hover:border-foreground/30 hover:bg-muted",
        secondary: "bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80",
        ghost: "text-foreground/80 hover:bg-muted hover:text-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "min-h-11 px-5 text-sm",
        sm: "min-h-9 gap-1.5 px-3.5 text-sm",
        lg: "min-h-12 px-7 text-base",
        icon: "size-11",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  },
);

type ButtonProps = React.ComponentProps<"button"> & VariantProps<typeof buttonVariants> & { asChild?: boolean };

function Button({ className, variant, size, asChild = false, ...props }: ButtonProps) {
  const Comp = asChild ? Slot.Root : "button";
  return <Comp data-slot="button" className={cn(buttonVariants({ variant, size, className }))} {...props} />;
}

function ButtonLink({ className, variant, size, ...props }: React.ComponentProps<typeof Link> & VariantProps<typeof buttonVariants>) {
  return <Link data-slot="button" className={cn(buttonVariants({ variant, size, className }))} {...props} />;
}

export { Button, ButtonLink, buttonVariants };
