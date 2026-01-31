"use client"

import * as React from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import apiClient from "@/lib/api/client"

export default function AcceptInvitationPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get("token")

  const [status, setStatus] = React.useState<"idle" | "loading" | "success" | "error">("idle")
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    if (!token) return
    const accept = async () => {
      setStatus("loading")
      try {
        await apiClient.acceptTeamInvitation(token)
        setStatus("success")
        setTimeout(() => router.push("/dashboard/teams"), 1200)
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to accept invitation"
        setError(message)
        setStatus("error")
      }
    }
    accept()
  }, [token, router])

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <Card className="max-w-md w-full">
        <CardHeader>
          <CardTitle>Accept Invitation</CardTitle>
          <CardDescription>Join your team workspace in BioLoupe</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {!token && (
            <p className="text-sm text-muted-foreground">No invitation token found.</p>
          )}
          {status === "loading" && (
            <p className="text-sm text-muted-foreground">Accepting invitation...</p>
          )}
          {status === "success" && (
            <p className="text-sm text-green-600">Invitation accepted. Redirecting...</p>
          )}
          {status === "error" && (
            <p className="text-sm text-destructive">{error}</p>
          )}
          <Button variant="outline" onClick={() => router.push("/dashboard/teams")}>Go to Teams</Button>
        </CardContent>
      </Card>
    </div>
  )
}
