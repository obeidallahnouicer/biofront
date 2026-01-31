"use client"

import * as React from "react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useAuthStore } from "@/stores/authStore"

export default function SettingsPage() {
  const { user, updateUser, isLoading } = useAuthStore()
  const [fullName, setFullName] = React.useState(user?.full_name || "")
  const [orcidId, setOrcidId] = React.useState(user?.orcid_id || "")
  const [status, setStatus] = React.useState<string | null>(null)

  React.useEffect(() => {
    setFullName(user?.full_name || "")
    setOrcidId(user?.orcid_id || "")
  }, [user])

  const handleSave = async () => {
    setStatus(null)
    try {
      await updateUser({ full_name: fullName, orcid_id: orcidId || undefined })
      setStatus("Profile updated")
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to update profile"
      setStatus(message)
    }
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground">Manage your account details</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
          <CardDescription>Update your personal information</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="full_name">Full Name</Label>
            <Input
              id="full_name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Your name"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" value={user?.email || ""} readOnly />
          </div>
          <div className="space-y-2">
            <Label htmlFor="orcid">ORCID iD</Label>
            <Input
              id="orcid"
              value={orcidId}
              onChange={(e) => setOrcidId(e.target.value)}
              placeholder="0000-0000-0000-0000"
            />
          </div>
          {status && (
            <p className={status === "Profile updated" ? "text-sm text-green-600" : "text-sm text-destructive"}>
              {status}
            </p>
          )}
          <Button onClick={handleSave} disabled={isLoading}>
            {isLoading ? "Saving..." : "Save Changes"}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
