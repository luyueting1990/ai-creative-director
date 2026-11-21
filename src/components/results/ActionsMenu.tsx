"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { Icons } from "../ui";

export interface MenuItem {
  label: string;
  icon: ReactNode;
  onSelect: () => void;
}

/** Small secondary menu for less frequent actions. */
export function ActionsMenu({ items }: { items: MenuItem[] }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && setOpen(false);
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDown);
    window.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-label="More actions"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className="grid h-10 w-10 place-items-center rounded-full border border-bone/15 text-bone transition hover:border-bone/50"
      >
        <Icons.More className="h-5 w-5" />
      </button>
      {open && (
        <ul role="menu" className="absolute left-0 z-40 sm:left-auto sm:right-0 mt-2 w-52 overflow-hidden rounded-xl border border-bone/10 bg-char py-1 shadow-2xl">
          {items.map((item) => (
            <li key={item.label} role="none">
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  setOpen(false);
                  item.onSelect();
                }}
                className="flex w-full items-center gap-2.5 px-3.5 py-2.5 text-left text-sm text-bone/85 hover:bg-bone/5 hover:text-bone"
              >
                <span className="text-mute">{item.icon}</span>
                {item.label}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
