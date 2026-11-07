"use client";

import type { ComponentProps } from "react";
import { SubmitButton } from "@/components/ui/submit-button";

// A submit button that asks first. Use for deletes and other steps that can't be undone.
export function ConfirmButton({ message, ...props }: ComponentProps<typeof SubmitButton> & { message: string }) {
  return (
    <SubmitButton
      {...props}
      onClick={(e) => {
        if (!window.confirm(message)) e.preventDefault();
      }}
    />
  );
}
