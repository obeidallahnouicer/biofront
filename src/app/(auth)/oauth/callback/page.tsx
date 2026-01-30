import { Suspense } from "react"
import { OAuthCallback } from "@/components/auth/OAuthCallback"
import { PageLoading } from "@/components/ui/loading"

export default function OAuthCallbackPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <Suspense fallback={<PageLoading />}>
        <OAuthCallback />
      </Suspense>
    </div>
  )
}
