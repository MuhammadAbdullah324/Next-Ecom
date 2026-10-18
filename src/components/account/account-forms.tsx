"use client";

import { useActionState, useEffect, useRef } from "react";
import { addAddress, updateProfile, type AccountFormState } from "@/features/account/actions";
import { Alert } from "@/components/ui/alert";
import { Field } from "@/components/ui/field";
import { SubmitButton } from "@/components/ui/submit-button";

export function ProfileForm({ fullName, phone }: { fullName: string; phone: string }) {
  const [state, action] = useActionState<AccountFormState, FormData>(updateProfile, {});
  const err = state.fieldErrors ?? {};
  return (
    <form action={action} className="grid gap-4 sm:grid-cols-2">
      <Field label="Full name" name="full_name" defaultValue={fullName} autoComplete="name" required error={err.full_name} />
      <Field label="Phone" name="phone" type="tel" defaultValue={phone} autoComplete="tel" error={err.phone} />
      <div className="flex items-center gap-3 sm:col-span-2">
        <SubmitButton variant="outline" pendingLabel="Saving…">Save</SubmitButton>
        <span aria-live="polite" className="text-sm">
          {state.ok ? <span className="text-success">Saved</span> : state.error ? <span className="text-danger">{state.error}</span> : null}
        </span>
      </div>
    </form>
  );
}

export function AddAddressForm() {
  const [state, action] = useActionState<AccountFormState, FormData>(addAddress, {});
  const formRef = useRef<HTMLFormElement>(null);
  const err = state.fieldErrors ?? {};
  useEffect(() => {
    if (state.ok) formRef.current?.reset();
  }, [state]);

  return (
    <form ref={formRef} action={action} className="grid gap-4 sm:grid-cols-2" noValidate>
      {state.error ? <Alert variant="destructive" className="sm:col-span-2">{state.error}</Alert> : null}
      {state.ok ? <Alert variant="success" className="sm:col-span-2">Address saved.</Alert> : null}
      <Field label="Label" name="label" placeholder="Home, Office…" className="sm:col-span-2" />
      <Field label="Full name" name="full_name" autoComplete="name" required error={err.full_name} />
      <Field label="Phone" name="phone" type="tel" autoComplete="tel" required error={err.phone} />
      <Field label="Address" name="address_line_1" autoComplete="address-line1" required error={err.address_line_1} className="sm:col-span-2" />
      <Field label="Apartment, suite, etc." name="address_line_2" autoComplete="address-line2" className="sm:col-span-2" />
      <Field label="City" name="city" autoComplete="address-level2" required error={err.city} />
      <Field label="State or province" name="state" autoComplete="address-level1" />
      <Field label="Postal code" name="postal_code" autoComplete="postal-code" required error={err.postal_code} />
      <Field label="Country" name="country" autoComplete="country-name" required defaultValue="Pakistan" error={err.country} />
      <label className="flex items-center gap-2 text-sm sm:col-span-2">
        <input type="checkbox" name="is_default" className="size-4 accent-primary" /> Make this my default address
      </label>
      <div className="sm:col-span-2">
        <SubmitButton pendingLabel="Saving…">Save address</SubmitButton>
      </div>
    </form>
  );
}
