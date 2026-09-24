import { Link } from "@tanstack/react-router";
import {
  Home,
  Store,
  Shield,
  KeyRound,
  Coins,
  Newspaper,
  Headset,
  Info,
  X,
  Crown,
} from "lucide-react";

import crystal from "@/assets/sidebar-crystal.jpg";
import { defaultContent } from "@/lib/site-content";

export const navItems = [
  { label: "Home", to: "/", icon: Home },
  { label: "Store", to: "/store", icon: Store },
  { label: "Ranks", to: "/ranks", icon: Shield },
  { label: "Crate Keys", to: "/crate-keys", icon: KeyRound },
  { label: "Coins", to: "/coins", icon: Coins },
  { label: "News", to: "/news", icon: Newspaper },
  { label: "Staff", to: "/staff", icon: Headset },
  { label: "About", to: "/about", icon: Info },
] as const;

type Props = {
  brandPrefix?: string;
  brandSuffix?: string;
  open: boolean;
  onClose: () => void;
};

export function Sidebar({
  brandPrefix = defaultContent.brandPrefix,
  brandSuffix = defaultContent.brandSuffix,
  open,
  onClose,
}: Props) {
  return (
    <>
      {open && (
        <button
          aria-label="Close menu"
          onClick={onClose}
          className="fixed inset-0 z-40 bg-background/70 backdrop-blur-sm lg:hidden"
        />
      )}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-[228px] flex-col overflow-hidden bg-sidebar transition-transform duration-300 lg:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 bottom-0 h-1/2 opacity-70"
          style={{
            backgroundImage: `linear-gradient(to top, transparent, transparent), url(${crystal})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            maskImage: "linear-gradient(to top, black 35%, transparent 90%)",
          }}
        />

        <div className="relative flex items-center justify-between px-5 pt-6 pb-2">
          <Link to="/" className="flex items-center gap-2">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl btn-neon">
              <Crown className="h-4.5 w-4.5" />
            </span>
            <span className="font-display text-lg font-extrabold tracking-tight">
              {brandPrefix}
              <span className="text-neon-soft text-glow">{brandSuffix}</span>
            </span>
          </Link>
          <button
            onClick={onClose}
            aria-label="Close menu"
            className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-muted-foreground nav-item lg:hidden"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <nav className="relative mt-4 flex flex-col gap-1 px-3">
          {navItems.map(({ label, to, icon: Icon }) => (
            <Link
              key={label}
              to={to}
              onClick={onClose}
              activeOptions={{ exact: to === "/" }}
              activeProps={{
                className:
                  "btn-neon text-primary-foreground shadow-none [&_svg]:text-primary-foreground",
              }}
              inactiveProps={{ className: "text-muted-foreground nav-item" }}
              className="flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-[13px] font-semibold"
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span className="truncate">{label}</span>
            </Link>
          ))}
        </nav>

        <div className="relative mx-5 mt-6 border-t border-sidebar-border pt-4">
          <Link
            to="/store"
            onClick={onClose}
            className="flex items-center gap-3 rounded-xl px-1 py-1.5 text-left"
          >
            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-accent text-[11px] font-bold">
              G
            </span>
            <span className="min-w-0">
              <span className="block truncate text-[12px] font-semibold">Guest</span>
              <span className="block truncate text-[11px] text-neon-soft">Join Now</span>
            </span>
          </Link>
        </div>

        <div className="relative mt-auto px-5 pb-6 text-[11px] font-medium text-muted-foreground">
          Play <span className="text-neon-soft">•</span> Build{" "}
          <span className="text-neon-soft">•</span> Survive
        </div>
      </aside>
    </>
  );
}
