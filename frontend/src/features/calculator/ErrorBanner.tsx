interface ErrorBannerProps {
  message: string
  onDismiss: () => void
}

export function ErrorBanner({ message, onDismiss }: ErrorBannerProps) {
  return (
    <div
      role="alert"
      className="flex items-center justify-between gap-3 rounded-lg bg-danger-soft px-3 py-2 text-sm text-danger"
    >
      <span>{message}</span>
      <button
        type="button"
        onClick={onDismiss}
        className="shrink-0 rounded px-2 py-1 font-medium hover:underline focus-visible:outline-2 focus-visible:outline-danger"
      >
        Dismiss
      </button>
    </div>
  )
}
