"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Home, 
  Trophy, 
  PlusCircle, 
  Menu, 
  User, 
  LogOut,
  LogIn
} from "lucide-react";
import { Icons } from "./icons";
import { useAuth } from "@/context/auth-context";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { useState } from "react";

const navigationItems = [
  {
    title: "Debates",
    href: "/",
    icon: Home,
  },
  {
    title: "Scoreboard",
    href: "/scoreboard",
    icon: Trophy,
  },
];

export function MobileNav() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  const handleLogout = () => {
    logout();
    router.push("/");
    setOpen(false);
  };

  const handleNavigation = () => {
    setOpen(false);
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="md:hidden"
        >
          <Menu className="h-5 w-5" />
          <span className="sr-only">Toggle navigation menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-80">
        <SheetHeader>
          <SheetTitle className="flex items-center space-x-2">
            <Icons.logo className="h-6 w-6" />
            <span className="font-bold font-headline">
              Verdict Vista
            </span>
          </SheetTitle>
        </SheetHeader>

        <div className="flex flex-col h-full mt-6">
          {/* Navigation */}
          <nav className="flex-1 space-y-2">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={handleNavigation}
                  className={cn(
                    "flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors",
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  )}
                >
                  <Icon className="mr-3 h-4 w-4" />
                  {item.title}
                </Link>
              );
            })}

            {user && (
              <Link
                href="/debates/create"
                onClick={handleNavigation}
                className={cn(
                  "flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors",
                  "text-muted-foreground hover:text-foreground hover:bg-muted"
                )}
              >
                <PlusCircle className="mr-3 h-4 w-4" />
                Create Debate
              </Link>
            )}
          </nav>

          {/* User Section */}
          <div className="border-t pt-4 mt-auto">
            {user ? (
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <Avatar className="h-8 w-8">
                    <AvatarImage
                      src={user.avatarUrl || "https://placehold.co/100x100.png"}
                      alt={user.name || "User"}
                    />
                    <AvatarFallback>
                      {user.name?.charAt(0) || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {user.name || "User"}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {user.email}
                    </p>
                  </div>
                </div>
                <div className="space-y-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start h-8"
                    onClick={handleNavigation}
                  >
                    <User className="mr-2 h-4 w-4" />
                    Profile
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start h-8"
                    onClick={handleLogout}
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    Log out
                  </Button>
                </div>
              </div>
            ) : (
              <Button asChild className="w-full" onClick={handleNavigation}>
                <Link href="/login">
                  <LogIn className="mr-2 h-4 w-4" />
                  Login
                </Link>
              </Button>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
