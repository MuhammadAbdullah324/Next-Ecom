import * as React from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

// A styled native <select>, so it works inside plain GET forms and before JavaScript loads.
function NativeSelect({ className, ...props }: React.ComponentProps<"select">) {
  return (
    <div className="relative w-fit">
      <select
        data-slot="native-select"
        className={cn(
          "min-h-10 appearance-none rounded-md border border-input bg-card py-1.5 pl-3.5 pr-10 text-sm font-medium outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/10",
          className,
        )}
        {...props}
      />
      <ChevronDown aria-hidden className="pointer-events-none absolute right-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
    </div>
  );
}

export { NativeSelect };
