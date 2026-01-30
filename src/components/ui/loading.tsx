import { Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

interface SpinnerProps {
  className?: string
  size?: "sm" | "md" | "lg"
}

const sizeClasses = {
  sm: "h-4 w-4",
  md: "h-6 w-6",
  lg: "h-8 w-8",
}

export function Spinner({ className, size = "md" }: SpinnerProps) {
  return (
    <Loader2
      className={cn("animate-spin", sizeClasses[size], className)}
    />
  )
}

interface LoadingProps {
  message?: string
  className?: string
}

export function Loading({ message = "Loading...", className }: LoadingProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-2 p-8",
        className
      )}
    >
      <Spinner size="lg" />
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  )
}

export function PageLoading() {
  return (
    <div className="flex h-screen items-center justify-center">
      <Loading message="Loading..." />
    </div>
  )
}

export function InlineLoading({ message }: { message?: string }) {
  return (
    <div className="flex items-center gap-2">
      <Spinner size="sm" />
      {message && <span className="text-sm text-muted-foreground">{message}</span>}
    </div>
  )
}
