import { Link, useLocation } from "wouter";
import { useState } from "react";
import {
  LayoutDashboard,
  PlusCircle,
  ScrollText,
  ChevronLeft,
  ChevronRight,
  Menu,
} from "lucide-react";
import { cn } from "@/lib/utils";

const OMD_LOGO = "/manus-storage/OMDLogo_8cc3ac67.svg";
const MSC_LOGO = "/manus-storage/MSCCruisesUSA-BlueLogo_5e8365c6.png";

const NAV_ITEMS = [
  { href: "/", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/new", icon: PlusCircle, label: "New Workflow" },
  { href: "/log", icon: ScrollText, label: "Activity Log" },
];

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const [location] = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {mobileOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 flex flex-col transition-all duration-200 ease-in-out lg:relative lg:translate-x-0",
          collapsed ? "w-16" : "w-60",
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
        style={{ backgroundColor: "#000033" }}
      >
        <div
          className={cn(
            "flex items-center border-b px-4 py-4",
            collapsed ? "justify-center" : "justify-between"
          )}
          style={{ borderColor: "rgba(255,255,255,0.1)" }}
        >
          {!collapsed && (
            <div className="flex flex-col gap-2">
              <img src={OMD_LOGO} alt="OMD" className="h-6 w-auto" />
              <div
                className="text-xs font-mono tracking-widest uppercase"
                style={{ color: "rgba(255,255,255,0.45)", fontSize: "10px" }}
              >
                Campaign QA
              </div>
            </div>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="hidden lg:flex items-center justify-center w-6 h-6 rounded transition-colors"
            style={{ color: "rgba(255,255,255,0.5)" }}
          >
            {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
          </button>
        </div>

        {!collapsed && (
          <div
            className="mx-3 mt-4 mb-2 rounded flex items-center gap-2 px-3 py-2"
            style={{ backgroundColor: "rgba(255,255,255,0.06)" }}
          >
            <img src={MSC_LOGO} alt="MSC Cruises" className="h-5 w-auto" />
          </div>
        )}

        <nav className="flex-1 px-2 py-3 space-y-0.5">
          {NAV_ITEMS.map(({ href, icon: Icon, label }) => {
            const isActive = location === href || (href !== "/" && location.startsWith(href));
            return (
              <Link key={href} href={href}>
                <div
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded text-sm font-medium transition-all duration-150 cursor-pointer",
                    collapsed ? "justify-center" : "",
                    isActive ? "text-white" : "text-white/60 hover:text-white hover:bg-white/5"
                  )}
                  style={isActive ? { backgroundColor: "#E8321A" } : {}}
                  title={collapsed ? label : undefined}
                >
                  <Icon size={16} className="shrink-0" />
                  {!collapsed && <span>{label}</span>}
                </div>
              </Link>
            );
          })}
        </nav>

        {!collapsed && (
          <div
            className="px-4 py-3 text-xs font-mono"
            style={{ color: "rgba(255,255,255,0.25)", borderTop: "1px solid rgba(255,255,255,0.08)" }}
          >
            v1.0 · Jump450 / OMD
          </div>
        )}
      </aside>

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header
          className="flex items-center justify-between px-4 py-3 border-b shrink-0"
          style={{ borderColor: "#E5E7EB", backgroundColor: "#fff" }}
        >
          <div className="flex items-center gap-3">
            <button
              className="lg:hidden p-1.5 rounded hover:bg-gray-100"
              onClick={() => setMobileOpen(true)}
            >
              <Menu size={18} />
            </button>
            <div>
              <h1
                className="text-xs font-mono tracking-widest uppercase font-semibold"
                style={{ color: "#000033", letterSpacing: "0.1em" }}
              >
                Campaign QA Dashboard
              </h1>
              <p className="text-xs" style={{ color: "#94A3B8" }}>
                OMD · MSC Cruises · Jump450
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <img src={MSC_LOGO} alt="MSC Cruises" className="h-7 w-auto hidden sm:block" />
          </div>
        </header>

        <main className="flex-1 overflow-y-auto bg-gray-50">
          {children}
        </main>
      </div>
    </div>
  );
}
