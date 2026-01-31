"use client"

import * as React from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Loader2 } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useAuthStore } from "@/stores/authStore"
import apiClient from "@/lib/api/client"

export function OAuthCallback({ provider }: { readonly provider: "google" | "microsoft" | "orcid" }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { fetchCurrentUser } = useAuthStore()
  const [error, setError] = React.useState<string | null>(null)
  const processed = React.useRef(false)

  React.useEffect(() => {
    if (processed.current) return
    processed.current = true

    const handleCallback = async () => {
      const errorParam = searchParams.get("error")
      const code = searchParams.get("code")
      const state = searchParams.get("state")

      if (errorParam) {
        setError(errorParam)
        return
      }

      if (!code || !state) {
        setError("Missing OAuth authorization parameters")
        return
      }

      try {
        const tokens = await apiClient.exchangeOAuthCode(provider, code, state)
        apiClient.setTokens(tokens.access_token, tokens.refresh_token)

        // Fetch user info
        await fetchCurrentUser()

        // Redirect to dashboard
        router.push("/dashboard")
      } catch (err) {
        console.error("OAuth callback error:", err)
        setError("Failed to complete authentication")
      }
    }

    handleCallback()
  }, [searchParams, fetchCurrentUser, router])

  if (error) {
    return (
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-destructive">Authentication Error</CardTitle>
          <CardDescription>{error}</CardDescription>
        </CardHeader>
        <CardContent>
          <a href="/login" className="text-primary hover:underline">
            Return to login
          </a>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Completing Sign In</CardTitle>
        <CardDescription>Please wait while we complete your authentication...</CardDescription>
      </CardHeader>
      <CardContent className="flex justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </CardContent>
    </Card>
  )
}
