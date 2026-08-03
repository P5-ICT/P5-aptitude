import type { ButtonHTMLAttributes, ReactNode } from "react";

type Variant = "primary" | "secondary" | "ghost" | "gold";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  children: ReactNode;
};

const variants: Record<Variant, string> = {
  primary:
    "bg-p5-navy text-white hover:bg-p5-navy/90 active:bg-p5-navy/80",
  secondary:
    "bg-p5-teal text-white hover:bg-p5-teal-hover active:bg-p5-teal/90",
  ghost:
    "bg-transparent text-p5-teal hover:text-p5-navy hover:underline",
  gold:
    "bg-p5-gold text-p5-navy hover:bg-p5-gold-hover active:bg-p5-gold/90",
};

export function Button({
  variant = "primary",
  className = "",
  type = "button",
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={`focus-ring inline-flex items-center justify-center rounded px-6 py-3 text-sm font-medium transition-colors duration-150 disabled:cursor-not-allowed disabled:opacity-50 ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
