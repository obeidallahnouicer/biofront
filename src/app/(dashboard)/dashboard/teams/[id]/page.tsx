"use client"

import * as React from "react"
import Link from "next/link"
import { useParams, useRouter, useSearchParams } from "next/navigation"
import { ArrowLeft, UserPlus, MoreHorizontal, Trash2, Shield, FolderOpen } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { useTeamStore } from "@/stores/teamStore"
import { useSessionStore } from "@/stores/sessionStore"
import { Loading } from "@/components/ui/loading"
import { getInitials, formatRelativeTime } from "@/lib/utils"
import { TeamRole } from "@/types"

export default function TeamDetailPage() {
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const teamId = params.id as string

  const [inviteOpen, setInviteOpen] = React.useState(false)
  const [inviteEmail, setInviteEmail] = React.useState("")
  const [inviteRole, setInviteRole] = React.useState<TeamRole>(TeamRole.MEMBER)
  const [isInviting, setIsInviting] = React.useState(false)
  const [inviteToken, setInviteToken] = React.useState<string | null>(null)

  const { currentTeam, members, isLoading, fetchTeam, inviteMember, removeMember } = useTeamStore()
  const { sessions, fetchSessions } = useSessionStore()

  React.useEffect(() => {
    fetchTeam(teamId)
    fetchSessions({ team_id: teamId })
  }, [teamId, fetchTeam, fetchSessions])

  React.useEffect(() => {
    if (searchParams.get("invite") === "true") {
      setInviteOpen(true)
    }
  }, [searchParams])

  const handleInvite = async () => {
    if (!inviteEmail.trim()) return

    setIsInviting(true)
    try {
      const token = await inviteMember(teamId, inviteEmail, inviteRole)
      setInviteToken(token)
      setInviteOpen(false)
      setInviteEmail("")
      setInviteRole(TeamRole.MEMBER)
    } catch (error) {
      console.error("Failed to invite member:", error)
    } finally {
      setIsInviting(false)
    }
  }

  const handleRemoveMember = async (userId: string) => {
    if (confirm("Are you sure you want to remove this member?")) {
      await removeMember(teamId, userId)
    }
  }

  if (isLoading || !currentTeam) {
    return <Loading message="Loading team..." />
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold">{currentTeam.name}</h1>
          <p className="text-muted-foreground">
            {currentTeam.description || "No description"}
          </p>
        </div>
        <Button onClick={() => setInviteOpen(true)}>
          <UserPlus className="mr-2 h-4 w-4" />
          Invite Member
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Members */}
        <Card>
          <CardHeader>
            <CardTitle>Team Members</CardTitle>
            <CardDescription>{members.length} members</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {members.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center justify-between p-3 rounded-lg border"
                >
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarFallback>
                        {member.user ? getInitials(member.user.full_name) : "?"}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">
                        {member.user?.full_name || "Unknown"}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {member.user?.email}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={member.role === TeamRole.OWNER ? "default" : "secondary"}>
                      {member.role}
                    </Badge>
                    {member.role !== TeamRole.OWNER && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>
                            <Shield className="mr-2 h-4 w-4" />
                            Change Role
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => handleRemoveMember(member.user_id)}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Remove
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Sessions */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Sessions</CardTitle>
              <CardDescription>Research sessions in this team</CardDescription>
            </div>
            <Link href={`/dashboard/sessions?create=true&team=${teamId}`}>
              <Button size="sm">New Session</Button>
            </Link>
          </CardHeader>
          <CardContent>
            {sessions.length === 0 ? (
              <div className="text-center py-8">
                <FolderOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No sessions yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {sessions.slice(0, 5).map((session) => (
                  <Link
                    key={session.id}
                    href={`/session/${session.id}`}
                    className="block p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                  >
                    <p className="font-medium">{session.title}</p>
                    <p className="text-sm text-muted-foreground">
                      {formatRelativeTime(session.updated_at)}
                    </p>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Invite Dialog */}
      <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Invite Team Member</DialogTitle>
            <DialogDescription>
              Send an invitation to join this team
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                placeholder="colleague@example.com"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <Select value={inviteRole} onValueChange={(v) => setInviteRole(v as TeamRole)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={TeamRole.ADMIN}>Admin</SelectItem>
                  <SelectItem value={TeamRole.MEMBER}>Member</SelectItem>
                  <SelectItem value={TeamRole.VIEWER}>Viewer</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setInviteOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleInvite} disabled={isInviting || !inviteEmail.trim()}>
              {isInviting ? "Sending..." : "Send Invitation"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {inviteToken && (
        <Dialog open={!!inviteToken} onOpenChange={(open) => !open && setInviteToken(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Invitation Link</DialogTitle>
              <DialogDescription>
                Share this link with your teammate to accept the invitation.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3">
              <Input
                readOnly
                value={`${globalThis.location?.origin || ""}/dashboard/invitations/accept?token=${inviteToken}`}
              />
              <Button
                onClick={() => {
                  navigator.clipboard.writeText(
                    `${globalThis.location?.origin || ""}/dashboard/invitations/accept?token=${inviteToken}`
                  )
                }}
              >
                Copy Link
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
