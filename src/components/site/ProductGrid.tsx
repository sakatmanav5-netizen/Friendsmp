import { useState } from "react";
import { ArrowRight, Check, Crown, Loader2, X } from "lucide-react";
import { toast } from "sonner";

import type { Product } from "@/lib/catalog";

const USERNAME_RE = /^[A-Za-z0-9_]{3,16}$/;

export function ProductGrid({ items }: { items: Product[] }) {
  const [selected, setSelected] = useState<Product | null>(null);

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((p) => (
          <article
            key={p.id}
            className={`flex flex-col rounded-3xl glass p-5 transition-transform duration-300 hover:-translate-y-1 ${
              p.featured ? "neon-ring" : ""
            }`}
          >
            {p.featured && (
              <span className="mb-3 inline-flex w-fit items-center gap-1.5 rounded-full bg-accent px-2.5 py-1 text-[10px] font-bold text-neon-soft">
                <Crown className="h-3 w-3 text-gold" /> Most Popular
              </span>
            )}
            <h3 className="font-display text-2xl font-black tracking-tight">{p.name}</h3>
            <p className="mt-1 text-[13px] text-muted-foreground">{p.blurb}</p>
            <ul className="mt-4 space-y-1.5">
              {p.perks.map((perk) => (
                <li key={perk} className="flex items-start gap-2 text-[12px]">
                  <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-online" />
                  <span className="min-w-0">{perk}</span>
                </li>
              ))}
            </ul>
            <div className="mt-5 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
              <span className="font-display text-xl font-black">${p.price.toFixed(2)}</span>
              <button
                onClick={() => setSelected(p)}
                className="flex shrink-0 items-center gap-2 rounded-full btn-neon px-4 py-2 text-[11px] font-bold"
              >
                Buy Now <ArrowRight className="h-3 w-3" />
              </button>
            </div>
          </article>
        ))}
      </div>

      {selected && <CheckoutDialog product={selected} onClose={() => setSelected(null)} />}
    </>
  );
}

function CheckoutDialog({ product, onClose }: { product: Product; onClose: () => void }) {
  const [username, setUsername] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const name = username.trim();
    if (!USERNAME_RE.test(name)) {
      setError("Enter a valid Minecraft username (3-16 letters, numbers or underscores).");
      return;
    }
    if (name.toLowerCase() !== confirm.trim().toLowerCase()) {
      setError("Both usernames must match exactly — rewards are delivered to this account.");
      return;
    }
    setError(null);
    setBusy(true);
    setTimeout(() => {
      setBusy(false);
      onClose();
      toast.success("Order saved", {
        description: `${product.name} for ${name} — payment checkout is being connected.`,
      });
    }, 700);
  };

  return (
    <div className="fixed inset-0 z-[60] grid place-items-center bg-background/80 p-4 backdrop-blur-sm">
      <form
        onSubmit={submit}
        className="w-full max-w-md rounded-3xl glass neon-ring p-6"
        aria-label={`Checkout for ${product.name}`}
      >
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
          <div className="min-w-0">
            <span className="text-[10px] font-bold tracking-widest text-neon-soft">CHECKOUT</span>
            <h2 className="truncate font-display text-2xl font-black">{product.name}</h2>
            <p className="text-[12px] text-muted-foreground">
              ${product.price.toFixed(2)} — delivered in-game automatically
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close checkout"
            className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-accent"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <label className="mt-5 block text-[11px] font-bold text-muted-foreground">
          Minecraft Username
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            maxLength={16}
            autoComplete="off"
            placeholder="Notch"
            className="mt-1.5 w-full rounded-xl border border-input bg-background/60 px-3 py-2.5 text-sm font-semibold text-foreground outline-none focus:border-primary"
          />
        </label>
        <label className="mt-3 block text-[11px] font-bold text-muted-foreground">
          Confirm Username
          <input
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            maxLength={16}
            autoComplete="off"
            placeholder="Notch"
            className="mt-1.5 w-full rounded-xl border border-input bg-background/60 px-3 py-2.5 text-sm font-semibold text-foreground outline-none focus:border-primary"
          />
        </label>

        {error && <p className="mt-3 text-[12px] font-semibold text-destructive">{error}</p>}

        <button
          type="submit"
          disabled={busy}
          className="mt-5 flex w-full items-center justify-center gap-2 rounded-full btn-neon px-4 py-3 text-sm font-bold disabled:opacity-60"
        >
          {busy && <Loader2 className="h-4 w-4 animate-spin" />}
          Continue to payment
        </button>
        <p className="mt-3 text-[11px] leading-relaxed text-muted-foreground">
          Double-check your username. Wrong usernames can be corrected by staff through the refund
          and re-delivery process.
        </p>
      </form>
    </div>
  );
}
