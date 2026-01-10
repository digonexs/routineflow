import { Link, useLocation } from "wouter";
import { useApp } from "@/lib/store";
import { 
  LayoutDashboard, 
  LogOut, 
  Plus, 
  Menu,
  X,
  CheckCircle2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { cn } from "@/lib/utils";
import logo from "@assets/generated_images/minimalist_blue_abstract_habit_tracker_logo.png";

export function Layout({ children }: { children: React.ReactNode }) {
  const [location, setLocation] = useLocation();
  const { user, logout } = useApp();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  const handleLogout = () => {
    logout();
    setLocation("/");
  };

  // If landing page, don't show app layout
  if (location === "/" || location === "/login" || location === "/register") {
    return <main className="min-h-screen bg-background">{children}</main>;
  }

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      {/* Sidebar for Desktop */}
      <aside className="hidden md:flex flex-col w-64 border-r border-sidebar-border bg-sidebar p-6 fixed h-full z-10">
        <div className="flex items-center gap-3 mb-10 px-2">
          <img src={logo} alt="RoutineFlow" className="w-8 h-8 rounded-lg" />
          <span className="font-heading font-bold text-xl tracking-tight">RoutineFlow</span>
        </div>

        <nav className="flex-1 space-y-2">
          <Link href="/dashboard">
            <Button
              variant={location === "/dashboard" ? "secondary" : "ghost"}
              className="w-full justify-start gap-3"
            >
              <LayoutDashboard className="w-4 h-4" />
              Sua Rotina
            </Button>
          </Link>
          <Link href="/analytics">
            <Button
              variant={location === "/analytics" ? "secondary" : "ghost"}
              className="w-full justify-start gap-3"
            >
              <CheckCircle2 className="w-4 h-4" />
              Histórico
            </Button>
          </Link>
          <Link href="/setup">
            <Button
              variant={location === "/setup" ? "secondary" : "ghost"}
              className="w-full justify-start gap-3"
            >
              <Plus className="w-4 h-4" />
              Configurar Rotina
            </Button>
          </Link>
        </nav>

        <div className="pt-6 border-t border-sidebar-border mt-auto">
          <div className="flex items-center gap-3 px-2 mb-4">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
              {user?.name?.[0]?.toUpperCase()}
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="text-sm font-medium truncate">{user?.name}</p>
              <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
            </div>
          </div>
          <Button variant="outline" className="w-full justify-start gap-2" onClick={handleLogout}>
            <LogOut className="w-4 h-4" />
            Sair
          </Button>
        </div>
      </aside>

      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-background/80 backdrop-blur-md border-b z-50 flex items-center justify-between px-4">
        <div className="flex items-center gap-2">
           <img src={logo} alt="RoutineFlow" className="w-8 h-8 rounded-lg" />
           <span className="font-heading font-bold text-lg">RoutineFlow</span>
        </div>
        <Button variant="ghost" size="icon" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
          {isMobileMenuOpen ? <X /> : <Menu />}
        </Button>
      </div>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-40 bg-background pt-20 px-6 animate-in slide-in-from-top-10">
          <nav className="flex flex-col gap-4">
            <Link href="/dashboard" onClick={() => setIsMobileMenuOpen(false)}>
              <Button variant="ghost" className="w-full justify-start text-lg h-12">Sua Rotina</Button>
            </Link>
            <Link href="/analytics" onClick={() => setIsMobileMenuOpen(false)}>
              <Button variant="ghost" className="w-full justify-start text-lg h-12">Histórico</Button>
            </Link>
            <Link href="/setup" onClick={() => setIsMobileMenuOpen(false)}>
              <Button variant="ghost" className="w-full justify-start text-lg h-12">Configurar Rotina</Button>
            </Link>
            <Button variant="destructive" className="w-full justify-start mt-8" onClick={handleLogout}>
              Sair
            </Button>
          </nav>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 md:ml-64 pt-16 md:pt-0 p-4 md:p-8 max-w-7xl mx-auto w-full">
        {children}
      </main>
    </div>
  );
}
