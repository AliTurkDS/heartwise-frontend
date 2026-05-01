import { Link, useLocation } from "react-router-dom";
import { Heart, LogOut } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import NotificationBell from "@/components/NotificationBell";

type NavLink = { to: string; icon: React.ElementType; label: string };

const DashboardSidebar = ({ role, links }: { role: string; links: NavLink[] }) => {
  const location = useLocation();
  const { signOut, user } = useAuth();

  const handleSignOut = async () => {
    await signOut();
    window.location.href = "/login";
  };

  return (
    <aside className="fixed left-0 top-0 z-40 flex h-screen w-64 flex-col border-r border-border/50 bg-card">
      <div className="flex h-16 items-center gap-2 border-b border-border/50 px-6">
        <Heart className="h-5 w-5 text-heart fill-heart/20" />
        <span className="font-display text-lg font-bold text-gradient-blue">AI HeartCare</span>
      </div>
      <div className="px-3 py-2">
        <span className="px-3 text-xs font-semibold uppercase text-muted-foreground">{role}</span>
      </div>
      <nav className="flex-1 space-y-1 px-3">
        {links.map((l) => (
          <Link
            key={l.to}
            to={l.to}
            className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
              location.pathname === l.to
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:bg-secondary hover:text-foreground"
            }`}
          >
            <l.icon className="h-4 w-4" />
            {l.label}
          </Link>
        ))}
      </nav>
      <div className="border-t border-border/50 p-3">
        <div className="flex items-center justify-between px-3 pb-2">
          <p className="text-xs text-muted-foreground truncate flex-1">{user?.email}</p>
          <NotificationBell />
        </div>
        <button
          onClick={handleSignOut}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
        >
          <LogOut className="h-4 w-4" />
          Sign Out
        </button>
      </div>
    </aside>
  );
};

export { type NavLink };
export default DashboardSidebar;
