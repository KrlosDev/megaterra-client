import { cn } from "@/lib/utils"

// Only the keyframes are raw CSS — Tailwind can't express @keyframes inline.
// Brand palette: emerald-500, teal-500, green-500, emerald-300.
const KEYFRAMES = `
@keyframes loader-before {
  0%   { width: 0.5em; box-shadow: 1em -0.5em rgba(16,185,129,0.85), -1em 0.5em rgba(20,184,166,0.85); }
  35%  { width: 2.5em; box-shadow: 0 -0.5em rgba(16,185,129,0.85), 0 0.5em rgba(20,184,166,0.85); }
  70%  { width: 0.5em; box-shadow: -1em -0.5em rgba(16,185,129,0.85), 1em 0.5em rgba(20,184,166,0.85); }
  100% { box-shadow: 1em -0.5em rgba(16,185,129,0.85), -1em 0.5em rgba(20,184,166,0.85); }
}
@keyframes loader-after {
  0%   { height: 0.5em; box-shadow: 0.5em 1em rgba(34,197,94,0.85), -0.5em -1em rgba(110,231,183,0.85); }
  35%  { height: 2.5em; box-shadow: 0.5em 0 rgba(34,197,94,0.85), -0.5em 0 rgba(110,231,183,0.85); }
  70%  { height: 0.5em; box-shadow: 0.5em -1em rgba(34,197,94,0.85), -0.5em 1em rgba(110,231,183,0.85); }
  100% { box-shadow: 0.5em 1em rgba(34,197,94,0.85), -0.5em -1em rgba(110,231,183,0.85); }
}
`

// Shared pseudo-element base + each bar's animation, as Tailwind utilities.
const BARS = cn(
  "before:absolute before:top-1/2 before:left-1/2 before:block before:size-[0.5em]",
  "before:rounded-[0.25em] before:content-[''] before:transform-[translate(-50%,-50%)]",
  "before:[animation:loader-before_2s_infinite]",
  "after:absolute after:top-1/2 after:left-1/2 after:block after:size-[0.5em]",
  "after:rounded-[0.25em] after:content-[''] after:transform-[translate(-50%,-50%)]",
  "after:[animation:loader-after_2s_infinite]"
)

/**
 * Animated dual-bar loader. Size is driven by font-size (the shape uses `em`
 * units), so pass a text-size class to scale it, e.g. <Loader className="text-2xl" />.
 */
export function Loader({ className }: { className?: string }) {
  return (
    <>
      <style>{KEYFRAMES}</style>
      <div
        role="status"
        aria-label="Loading"
        className={cn(
          "relative size-[2.5em] transform-[rotate(165deg)]",
          BARS,
          className
        )}
      >
        <span className="sr-only">Loading…</span>
      </div>
    </>
  )
}
