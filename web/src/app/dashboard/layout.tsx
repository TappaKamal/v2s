"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, CheckSquare, Calendar as CalendarIcon, Target, BarChart3, Repeat, Settings, Stethoscope, LogOut, MessageCircle, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { signOutAction } from "@/app/actions/auth";
import { useState } from "react";
import AiChat from "@/components/ai-chat";

const navItems = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/dashboard/tasks", icon: CheckSquare, label: "Tasks" },
  { href: "/dashboard/calendar", icon: CalendarIcon, label: "Calendar" },
  { href: "/dashboard/goals", icon: Target, label: "Goals" },
  { href: "/dashboard/habits", icon: Repeat, label: "Habits" },
  { href: "/dashboard/analytics", icon: BarChart3, label: "Analytics" },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Desktop Sidebar */}
      <aside className="w-64 border-r border-border/50 bg-card/30 backdrop-blur-md hidden md:flex flex-col">
        <div className="h-16 flex items-center gap-2 px-6 border-b border-border/50">
          <div className="bg-gradient-to-br from-green-500 to-teal-600 p-1.5 rounded-lg">
            <Stethoscope className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-bold tracking-tight">LifeSaver AI</span>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1">
          {navItems.map(({ href, icon: Icon, label }) => {
            const isActive = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium text-base transition-all duration-200 ${
                  isActive
                    ? "bg-gradient-to-r from-green-500/15 to-teal-500/10 text-green-600 shadow-sm"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                }`}
              >
                <Icon className="w-5 h-5" />
                {label}
              </Link>
            );
          })}
        </nav>
        <div className="p-3 border-t border-border/50 space-y-1">
          <Link href="/dashboard/settings" className={`flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium text-base text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors ${pathname === '/dashboard/settings' ? 'bg-secondary/50 text-foreground' : ''}`}>
            <Settings className="w-5 h-5" /> Settings
          </Link>
          <form action={signOutAction}>
            <button type="submit" className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium text-base text-muted-foreground hover:text-red-400 hover:bg-red-500/10 transition-colors">
              <LogOut className="w-5 h-5" /> Sign Out
            </button>
          </form>
        </div>
      </aside>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setMobileMenuOpen(false)} />
          <aside className="absolute left-0 top-0 bottom-0 w-72 bg-card border-r border-border/50 flex flex-col animate-in slide-in-from-left">
            <div className="h-16 flex items-center justify-between px-6 border-b border-border/50">
              <div className="flex items-center gap-2">
                <div className="bg-gradient-to-br from-green-500 to-teal-600 p-1.5 rounded-lg">
                  <Stethoscope className="w-5 h-5 text-white" />
                </div>
                <span className="text-xl font-bold">LifeSaver AI</span>
              </div>
              <button onClick={() => setMobileMenuOpen(false)}>
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>
            <nav className="flex-1 px-3 py-4 space-y-1">
              {navItems.map(({ href, icon: Icon, label }) => {
                const isActive = pathname === href;
                return (
                  <Link
                    key={href}
                    href={href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium text-base transition-all ${
                      isActive
                        ? "bg-gradient-to-r from-green-500/15 to-teal-500/10 text-green-600"
                        : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    {label}
                  </Link>
                );
              })}
            </nav>
          </aside>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        {/* Watermark */}
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center opacity-[0.02] z-0 overflow-hidden">
          <Stethoscope className="w-[40rem] h-[40rem] text-green-900 -rotate-12" />
        </div>
        <header className="h-16 border-b border-border/50 flex items-center justify-between px-6 bg-background/80 backdrop-blur-md relative z-10">
          <button className="md:hidden" onClick={() => setMobileMenuOpen(true)}>
            <Menu className="w-6 h-6 text-muted-foreground" />
          </button>
          <div className="flex-1" />
          <Button
            onClick={() => setChatOpen(!chatOpen)}
            variant="outline"
            size="sm"
            className="gap-2 rounded-full border-green-500/30 hover:bg-green-500/10 hover:text-green-600"
          >
            <MessageCircle className="w-4 h-4" />
            <span className="hidden sm:inline">AI Assistant</span>
          </Button>
        </header>
        <div className="flex-1 overflow-auto p-4 md:p-6 relative z-10">
          {children}
        </div>
      </main>

      {/* AI Chat Panel */}
      <AiChat isOpen={chatOpen} onClose={() => setChatOpen(false)} />
    </div>
  );
}



