import React from "react";
import { MessageCircle, Database, Users, Bell, ChevronDown } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export function Navbar() {
  return (
    <header className="sticky top-0 z-30 w-full border-b border-slate-200/80 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 dark:border-slate-800">
      <div className="flex h-16 max-w-[1400px] mx-auto items-center justify-between px-6">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-700 text-emerald-300 font-bold text-lg shadow-md ring-1 ring-emerald-400/30">
              ৳
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-base tracking-tight text-slate-900 dark:text-slate-100">
                  FundBot
                </span>
                <span className="text-xs uppercase tracking-widest text-emerald-600 font-semibold dark:text-emerald-400">
                  Room Manager
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                Telegram-first group fund management
              </p>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-2 pl-4 border-l border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-2 rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-700 dark:bg-slate-800/80 dark:text-slate-300">
              <Users className="h-3.5 w-3.5 text-slate-500" />
              <span>FVMAS-16 · Room 302</span>
              <ChevronDown className="h-3 w-3 text-slate-400" />
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700 ring-1 ring-emerald-600/20 dark:bg-emerald-950/40 dark:text-emerald-300">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <Database className="h-3 w-3 mr-0.5 text-emerald-600 dark:text-emerald-400" />
            <span>D1 Ledger Active</span>
          </div>

          <Badge variant="secondary" className="hidden lg:inline-flex gap-1 py-1 text-xs">
            <MessageCircle className="h-3.5 w-3.5" />
            <span>Telegram Connected</span>
          </Badge>

          <Button variant="outline" size="icon" aria-label="Notifications" className="h-9 w-9">
            <Bell className="h-4 w-4" />
          </Button>

          <div className="flex items-center gap-2 pl-2">
            <div className="h-8 w-8 rounded-full bg-slate-900 text-emerald-300 flex items-center justify-center text-xs font-semibold ring-1 ring-emerald-400/40">
              AS
            </div>
            <div className="hidden text-left sm:block">
              <p className="text-xs font-semibold leading-none text-slate-900 dark:text-slate-100">
                Adnan Shahria
              </p>
              <p className="text-[10px] text-muted-foreground">Treasurer</p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
