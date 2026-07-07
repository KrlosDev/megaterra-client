import * as React from "react"
import { ClockIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

type Meridiem = "AM" | "PM"
type Mode = "hour" | "minute"

const CLOCK_SIZE = 256
const CENTER = CLOCK_SIZE / 2
const NUMBER_RADIUS = 104

/** Parse a 24h "HH:mm" string into 12h clock parts. */
function parse(value: string): {
  hour12: number
  minute: number
  meridiem: Meridiem
} {
  const [hStr = "9", mStr = "0"] = (value || "09:00").split(":")
  const h24 = Math.min(23, Math.max(0, parseInt(hStr, 10) || 0))
  const minute = Math.min(59, Math.max(0, parseInt(mStr, 10) || 0))
  const meridiem: Meridiem = h24 >= 12 ? "PM" : "AM"
  const hour12 = h24 % 12 === 0 ? 12 : h24 % 12
  return { hour12, minute, meridiem }
}

/** Build a 24h "HH:mm" string from 12h clock parts. */
function to24(hour12: number, minute: number, meridiem: Meridiem): string {
  let hour24 = hour12 % 12
  if (meridiem === "PM") hour24 += 12
  return `${String(hour24).padStart(2, "0")}:${String(minute).padStart(2, "0")}`
}

/** Human label, e.g. "09:00 AM". */
function label(value: string): string {
  const { hour12, minute, meridiem } = parse(value)
  return `${String(hour12).padStart(2, "0")}:${String(minute).padStart(2, "0")} ${meridiem}`
}

/** Position of a point on the clock, `fraction` of a full turn from the top. */
function pointAt(fraction: number, radius: number) {
  const angle = fraction * 2 * Math.PI
  return {
    x: CENTER + radius * Math.sin(angle),
    y: CENTER - radius * Math.cos(angle),
  }
}

export function TimePicker({
  value,
  onChange,
  id,
  placeholder = "Pick a time",
  className,
}: {
  value: string
  onChange: (value: string) => void
  id?: string
  placeholder?: string
  className?: string
}) {
  const [open, setOpen] = React.useState(false)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          id={id}
          variant="outline"
          className={cn(
            "w-full justify-start text-left font-normal",
            !value && "text-muted-foreground",
            className
          )}
        >
          <ClockIcon />
          {value ? label(value) : <span>{placeholder}</span>}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-xs">
        <DialogHeader>
          <DialogTitle className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
            Select time
          </DialogTitle>
        </DialogHeader>
        {/* Key by value so the draft re-initializes each time it opens. */}
        <ClockEditor
          key={open ? value : "closed"}
          value={value}
          onConfirm={(next) => {
            onChange(next)
            setOpen(false)
          }}
        />
      </DialogContent>
    </Dialog>
  )
}

function ClockEditor({
  value,
  onConfirm,
}: {
  value: string
  onConfirm: (value: string) => void
}) {
  const initial = parse(value)
  const [hour12, setHour12] = React.useState(initial.hour12)
  const [minute, setMinute] = React.useState(initial.minute)
  const [meridiem, setMeridiem] = React.useState<Meridiem>(initial.meridiem)
  const [mode, setMode] = React.useState<Mode>("hour")

  // Numbers shown around the face for the active mode.
  const numbers =
    mode === "hour"
      ? Array.from({ length: 12 }, (_, index) => index + 1) // 1..12
      : Array.from({ length: 12 }, (_, index) => index * 5) // 0,5,…,55

  // Fraction of a full turn the hand points to.
  const handFraction =
    mode === "hour" ? (hour12 % 12) / 12 : minute / 60
  const hand = pointAt(handFraction, NUMBER_RADIUS)

  function selectNumber(clockNumber: number) {
    if (mode === "hour") {
      setHour12(clockNumber)
      setMode("minute") // advance to minutes, like a native material picker
    } else {
      setMinute(clockNumber)
    }
  }

  return (
    <div className="flex flex-col items-center gap-5">
      {/* Time display + AM/PM */}
      <div className="flex items-center gap-2">
        <DisplaySegment
          active={mode === "hour"}
          onClick={() => setMode("hour")}
        >
          {String(hour12).padStart(2, "0")}
        </DisplaySegment>
        <span className="text-3xl font-light text-muted-foreground">:</span>
        <DisplaySegment
          active={mode === "minute"}
          onClick={() => setMode("minute")}
        >
          {String(minute).padStart(2, "0")}
        </DisplaySegment>
        <div className="ml-2 flex flex-col overflow-hidden rounded-md border">
          {(["AM", "PM"] as Meridiem[]).map((meridiemOption) => (
            <Button
              key={meridiemOption}
              variant={meridiem === meridiemOption ? "default" : "ghost"}
              onClick={() => setMeridiem(meridiemOption)}
              className="h-auto rounded-none px-3 py-1 text-sm font-medium"
            >
              {meridiemOption}
            </Button>
          ))}
        </div>
      </div>

      {/* Clock face */}
      <div
        className="relative"
        style={{ width: CLOCK_SIZE, height: CLOCK_SIZE }}
      >
        <div className="absolute inset-0 rounded-full bg-muted" />
        <svg
          className="absolute inset-0 text-primary"
          width={CLOCK_SIZE}
          height={CLOCK_SIZE}
        >
          <line
            x1={CENTER}
            y1={CENTER}
            x2={hand.x}
            y2={hand.y}
            stroke="currentColor"
            strokeWidth={2}
          />
          <circle cx={CENTER} cy={CENTER} r={3} fill="currentColor" />
          <circle cx={hand.x} cy={hand.y} r={20} fill="currentColor" />
        </svg>
        {numbers.map((clockNumber, index) => {
          const fraction =
            mode === "hour" ? ((index + 1) % 12) / 12 : clockNumber / 60
          const { x, y } = pointAt(fraction, NUMBER_RADIUS)
          const selected =
            mode === "hour" ? clockNumber === hour12 : clockNumber === minute
          return (
            <Button
              key={clockNumber}
              variant="ghost"
              size="icon"
              onClick={() => selectNumber(clockNumber)}
              className={cn(
                "absolute size-8 -translate-x-1/2 -translate-y-1/2 rounded-full text-sm font-normal",
                selected
                  ? "font-semibold text-primary-foreground hover:bg-transparent"
                  : "hover:bg-background/60"
              )}
              style={{ left: x, top: y }}
            >
              {mode === "hour" ? clockNumber : String(clockNumber).padStart(2, "0")}
            </Button>
          )
        })}
      </div>

      <DialogFooter className="w-full flex-row justify-end gap-2 sm:justify-end">
        <DialogClose asChild>
          <Button variant="ghost">Cancel</Button>
        </DialogClose>
        <Button onClick={() => onConfirm(to24(hour12, minute, meridiem))}>
          OK
        </Button>
      </DialogFooter>
    </div>
  )
}

function DisplaySegment({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <Button
      variant="ghost"
      onClick={onClick}
      className={cn(
        "h-auto px-3 py-1 text-4xl font-light tabular-nums",
        active
          ? "bg-primary/15 text-primary hover:bg-primary/15"
          : "text-foreground hover:bg-muted"
      )}
    >
      {children}
    </Button>
  )
}
