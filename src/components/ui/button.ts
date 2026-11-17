import { cn } from "@/lib/utils";

type Variant = "primary" | "cream" | "dark" | "outline" | "outlineLight" | "whatsapp" | "ghost";
type Size = "md" | "lg";

const base =
  "inline-flex items-center justify-center gap-2 rounded-lg font-semibold whitespace-nowrap " +
  "transition-[transform,background-color,border-color,color] duration-150 ease-out " +
  "active:scale-[0.97] disabled:opacity-60 disabled:pointer-events-none cursor-pointer select-none";

const variants: Record<Variant, string> = {
  // Main action on light backgrounds. White on green: 8:1
  primary: "bg-green text-white hover:bg-ink",
  // Main action on green or photo backgrounds. Ink on cream: 13:1
  cream: "bg-cream text-ink hover:bg-white",
  dark: "bg-ink text-white hover:bg-green",
  outline: "border-2 border-green text-green hover:bg-green hover:text-white",
  outlineLight: "border-2 border-white/70 text-white hover:bg-white hover:text-ink",
  // White on this green: 5.6:1 (WhatsApp's brand green fails AA with white text)
  whatsapp: "bg-[#0f7a45] text-white hover:bg-[#0b6237]",
  ghost: "text-green hover:bg-mist",
};

const sizes: Record<Size, string> = {
  md: "min-h-11 px-5 text-[0.9375rem]",
  lg: "min-h-13 px-7 text-base",
};

/** Class names for buttons and button-styled links. Use on <button>, <a> or <Link>. */
export function buttonClass(variant: Variant = "primary", size: Size = "md", extra?: string) {
  return cn(base, variants[variant], sizes[size], extra);
}
