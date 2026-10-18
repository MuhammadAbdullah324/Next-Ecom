import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const alertVariants = cva("relative grid w-full gap-1 rounded-xl border px-4 py-3 text-sm", {
  variants: {
    variant: {
      default: "bg-card text-foreground",
      info: "bg-card text-foreground/80",
      success: "border-success/20 bg-success-soft text-success",
      warning: "border-warning/20 bg-warning-soft text-warning",
      destructive: "border-danger/20 bg-danger-soft text-danger",
    },
  },
  defaultVariants: { variant: "default" },
});

type AlertProps = React.ComponentProps<"div"> & VariantProps<typeof alertVariants> & { title?: string };

// Announces errors immediately and other messages politely.
function Alert({ className, variant, title, children, ...props }: AlertProps) {
  return (
    <div data-slot="alert" role={variant === "destructive" ? "alert" : "status"} className={cn(alertVariants({ variant }), className)} {...props}>
      {title ? <AlertTitle>{title}</AlertTitle> : null}
      {children ? <AlertDescription>{children}</AlertDescription> : null}
    </div>
  );
}

function AlertTitle({ className, ...props }: React.ComponentProps<"p">) {
  return <p data-slot="alert-title" className={cn("font-bold", className)} {...props} />;
}

function AlertDescription({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="alert-description" className={cn("[&_p]:leading-relaxed", className)} {...props} />;
}

export { Alert, AlertTitle, AlertDescription };
