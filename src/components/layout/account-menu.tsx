"use client";

import Link from "next/link";
import { ChevronDown, LayoutDashboard, LogOut, MapPin, Package, UserRound } from "lucide-react";
import { signOut } from "@/features/auth/actions";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

export function AccountMenu({ email, isAdmin = false }: { email: string | null; isAdmin?: boolean }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="px-3">
          <UserRound aria-hidden />
          <span>Account</span>
          <ChevronDown aria-hidden className="size-3.5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {email ? <DropdownMenuLabel className="truncate">{email}</DropdownMenuLabel> : null}
        <DropdownMenuItem asChild>
          <Link href="/account"><MapPin aria-hidden />Account and addresses</Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/orders"><Package aria-hidden />Orders</Link>
        </DropdownMenuItem>
        {isAdmin ? (
          <DropdownMenuItem asChild>
            <Link href="/admin"><LayoutDashboard aria-hidden />Admin dashboard</Link>
          </DropdownMenuItem>
        ) : null}
        <DropdownMenuSeparator />
        <form action={signOut}>
          <DropdownMenuItem asChild>
            <button type="submit" className="w-full"><LogOut aria-hidden />Sign out</button>
          </DropdownMenuItem>
        </form>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
