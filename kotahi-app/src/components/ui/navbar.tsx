"use client";

import * as React from "react";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ThemeToggleDropdown } from "@/components/theme/theme_toggle_dropdown";
import { cn } from "@/lib/utils";
import type { User } from "@/lib/types";
import {
  User as UserIcon,
  LogOut,
  Library,
  BookOpen,
  List,
  Settings,
} from "lucide-react";

interface NavbarProps {
  className?: string;
}

export function Navbar({ className }: NavbarProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Check if user is authenticated
    const token = localStorage.getItem("token");
    const userData = localStorage.getItem("user");

    if (token && userData) {
      try {
        setUser(JSON.parse(userData));
      } catch (error) {
        console.error("Error parsing user data:", error);
        // Clear invalid data
        localStorage.removeItem("token");
        localStorage.removeItem("user");
      }
    }
  }, []);

  const handleSignOut = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
    router.push("/");
  };

  // Close user dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isUserDropdownOpen) {
        const target = event.target as Element;
        if (!target.closest(".user-dropdown")) {
          setIsUserDropdownOpen(false);
        }
      }
    };

    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, [isUserDropdownOpen]);

  return (
    <nav
      className={cn(
        "sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60",
        className
      )}
    >
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-2">
              <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-lg">
                  T
                </span>
              </div>
              <span className="font-bold text-xl">Tokotoko</span>
            </Link>
          </div>

          {/* User Actions */}
          <div className="flex items-center space-x-4 relative z-50">
            <ThemeToggleDropdown />
            {user ? (
              <div className="relative user-dropdown z-[100]">
                <Button
                  variant="ghost"
                  size="sm"
                  className="flex items-center gap-2"
                  onClick={() => setIsUserDropdownOpen(!isUserDropdownOpen)}
                >
                  <UserIcon className="h-4 w-4" />
                  <span className="hidden sm:inline text-sm">
                    {user.username}
                  </span>
                </Button>

                {/* User Dropdown Menu */}
                <div
                  className={`absolute right-0 mt-2 w-48 bg-popover border border-border rounded-md shadow-lg transition-all duration-200 z-[100] ${
                    isUserDropdownOpen
                      ? "opacity-100 visible"
                      : "opacity-0 invisible"
                  }`}
                >
                  <div className="py-1">
                    <div className="px-3 py-2 text-sm font-medium text-muted-foreground border-b border-border">
                      {user.username}
                    </div>
                    <Link
                      href="/library"
                      className="flex items-center gap-2 w-full px-3 py-2 text-sm text-left hover:bg-accent hover:text-accent-foreground"
                      onClick={() => setIsUserDropdownOpen(false)}
                    >
                      <Library className="h-4 w-4" />
                      Library
                    </Link>
                    <Link
                      href="/progress"
                      className="flex items-center gap-2 w-full px-3 py-2 text-sm text-left hover:bg-accent hover:text-accent-foreground"
                      onClick={() => setIsUserDropdownOpen(false)}
                    >
                      <BookOpen className="h-4 w-4" />
                      Progress
                    </Link>
                    <Link
                      href="/watch-list"
                      className="flex items-center gap-2 w-full px-3 py-2 text-sm text-left hover:bg-accent hover:text-accent-foreground"
                      onClick={() => setIsUserDropdownOpen(false)}
                    >
                      <List className="h-4 w-4" />
                      History
                    </Link>
                    <Link
                      href="/word-list"
                      className="flex items-center gap-2 w-full px-3 py-2 text-sm text-left hover:bg-accent hover:text-accent-foreground"
                      onClick={() => setIsUserDropdownOpen(false)}
                    >
                      <BookOpen className="h-4 w-4" />
                      Word List
                    </Link>
                    {user.role === "admin" && (
                      <Link
                        href="/admin"
                        className="flex items-center gap-2 w-full px-3 py-2 text-sm text-left hover:bg-accent hover:text-accent-foreground"
                        onClick={() => setIsUserDropdownOpen(false)}
                      >
                        <Settings className="h-4 w-4" />
                        Admin Panel
                      </Link>
                    )}
                    <div className="border-t border-border my-1"></div>
                    <button
                      onClick={() => {
                        handleSignOut();
                        setIsUserDropdownOpen(false);
                      }}
                      className="flex items-center gap-2 w-full px-3 py-2 text-sm text-left hover:bg-accent hover:text-accent-foreground text-red-600 dark:text-red-400"
                    >
                      <LogOut className="h-4 w-4" />
                      Sign Out
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <>
                <Button asChild size="sm" variant="outline">
                  <Link href="/auth/login">Sign In</Link>
                </Button>
                <Button asChild size="sm">
                  <Link href="/auth/register">Sign Up</Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
