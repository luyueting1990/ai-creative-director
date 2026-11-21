"use client";

import {
  forwardRef,
  useLayoutEffect,
  useRef,
  type ButtonHTMLAttributes,
  type ReactNode,
  type TextareaHTMLAttributes,
} from "react";

export function cx(...classes: (string | false | null | undefined)[]): string {
  return classes.filter(Boolean).join(" ");
}

type Variant = "primary" | "signal" | "secondary" | "ghost" | "danger";

const VARIANTS: Record<Variant, string> = {
  primary: "bg-bone text-ink hover:bg-white",
  signal: "bg-signal text-ink hover:bg-[#ff6a4f] shadow-[0_12px_40px_-12px_rgba(255,77,46,0.7)]",
  secondary: "border border-bone/20 text-bone hover:border-bone/60 hover:bg-bone/5",
  ghost: "text-bone/70 hover:text-bone hover:bg-bone/5",
  danger: "text-signal hover:bg-signal/10",
};

export const Button = forwardRef<
  HTMLButtonElement,
  ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: "sm" | "md" | "lg" }
>(function Button({ variant = "secondary", size = "md", className, type = "button", ...props }, ref) {
  return (
    <button
      ref={ref}
      type={type}
      className={cx(
        "inline-flex items-center justify-center gap-2 rounded-full font-medium transition-all duration-200",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-acid",
        "disabled:cursor-not-allowed disabled:opacity-40 active:scale-[0.98]",
        size === "sm" && "h-8 px-3.5 text-xs",
        size === "md" && "h-10 px-5 text-sm",
        size === "lg" && "h-14 px-8 text-base tracking-wide",
        VARIANTS[variant],
        className,
      )}
      {...props}
    />
  );
});

export const IconButton = forwardRef<
  HTMLButtonElement,
  ButtonHTMLAttributes<HTMLButtonElement> & { label: string; children: ReactNode }
>(function IconButton({ label, children, className, ...props }, ref) {
  return (
    <button
      ref={ref}
      type="button"
      aria-label={label}
      title={label}
      className={cx(
        "inline-flex h-8 w-8 items-center justify-center rounded-full text-current opacity-60 transition hover:bg-current/10 hover:opacity-100",
        "focus-visible:outline-2 focus-visible:outline-acid disabled:opacity-20 disabled:hover:bg-transparent",
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
});

/** Borderless, auto-growing textarea used for inline editing. Inherits colour from its parent. */
export function EditableText({
  value,
  onChange,
  className,
  label,
  placeholder,
  ...props
}: Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, "onChange" | "value"> & {
  value: string;
  onChange: (value: string) => void;
  label: string;
}) {
  const ref = useRef<HTMLTextAreaElement>(null);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "0px";
    el.style.height = `${el.scrollHeight}px`;
  }, [value]);

  return (
    <textarea
      ref={ref}
      aria-label={label}
      rows={1}
      value={value}
      placeholder={placeholder ?? "—"}
      onChange={(e) => onChange(e.target.value)}
      className={cx(
        "-mx-1.5 block w-[calc(100%+0.75rem)] resize-none overflow-hidden rounded-md bg-transparent px-1.5 py-1 text-inherit",
        "transition-colors hover:bg-current/[0.06] focus:bg-current/[0.08] focus:outline-none focus:ring-1 focus:ring-signal/70",
        "placeholder:text-current placeholder:opacity-30",
        className,
      )}
      {...props}
    />
  );
}

export function Eyebrow({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <p className={cx("font-mono text-[11px] uppercase tracking-[0.22em] text-mute", className)}>{children}</p>
  );
}

export function DemoBadge({ className }: { className?: string }) {
  return (
    <span
      className={cx(
        "inline-flex items-center gap-1.5 rounded-full border border-acid/40 bg-acid/10 px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.18em] text-acid",
        className,
      )}
    >
      <span className="h-1.5 w-1.5 animate-pulse-dot rounded-full bg-acid" aria-hidden />
      Illustrative demo
    </span>
  );
}

export function Spinner({ className }: { className?: string }) {
  return (
    <svg className={cx("h-4 w-4 animate-spin", className)} viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeOpacity="0.25" strokeWidth="3" />
      <path d="M22 12a10 10 0 0 0-10-10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

/* Small inline icon set (stroke icons, 16px). */
const icon = (d: ReactNode) =>
  function Icon({ className }: { className?: string }) {
    return (
      <svg
        className={cx("h-4 w-4", className)}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
      >
        {d}
      </svg>
    );
  };

export const Icons = {
  Sparkle: icon(<path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3zM19 16l.8 2.2L22 19l-2.2.8L19 22l-.8-2.2L16 19l2.2-.8L19 16z" />),
  Plus: icon(<path d="M12 5v14M5 12h14" />),
  Trash: icon(<path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3" />),
  Up: icon(<path d="M12 19V5M6 11l6-6 6 6" />),
  Down: icon(<path d="M12 5v14M6 13l6 6 6-6" />),
  Left: icon(<path d="M19 12H5M11 6l-6 6 6 6" />),
  Right: icon(<path d="M5 12h14M13 6l6 6-6 6" />),
  Copy: icon(<><rect x="9" y="9" width="11" height="11" rx="2" /><path d="M5 15V5a2 2 0 0 1 2-2h8" /></>),
  Check: icon(<path d="M5 12l5 5 9-10" />),
  Folder: icon(<path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7z" />),
  Save: icon(<><path d="M5 3h11l3 3v13a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z" /><path d="M7 3v5h8V3M7 21v-7h10v7" /></>),
  Download: icon(<path d="M12 4v11M7 10l5 5 5-5M5 20h14" />),
  Upload: icon(<path d="M12 20V9M7 14l5-5 5 5M5 4h14" />),
  Refresh: icon(<path d="M20 11a8 8 0 0 0-14.9-3.5M4 4v4h4M4 13a8 8 0 0 0 14.9 3.5M20 20v-4h-4" />),
  X: icon(<path d="M6 6l12 12M18 6L6 18" />),
  Edit: icon(<path d="M4 20h4L19 9l-4-4L4 16v4zM13 7l4 4" />),
  Film: icon(<><rect x="3" y="4" width="18" height="16" rx="2" /><path d="M7 4v16M17 4v16M3 9h4M17 9h4M3 15h4M17 15h4" /></>),
  Alert: icon(<path d="M12 9v4M12 17h.01M10.3 3.9L2.4 18a2 2 0 0 0 1.7 3h15.8a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z" />),
  Image: icon(<><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="9" cy="9" r="2" /><path d="M21 15l-5-5L5 21" /></>),
  Link: icon(<path d="M10 14a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-1 1M14 10a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l1-1" />),
  Video: icon(<><rect x="2" y="6" width="14" height="12" rx="2" /><path d="M16 10l6-3v10l-6-3" /></>),
  Star: icon(<path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9L12 3z" />),
  Info: icon(<><circle cx="12" cy="12" r="9" /><path d="M12 11v5M12 8h.01" /></>),
  External: icon(<path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5" />),
};
