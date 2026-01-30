import Link from "next/link"
import { ArrowRight, FolderOpen, Users } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Welcome to BioLoupe</h1>
        <p className="text-muted-foreground mt-1">
          Your collaborative scientific research platform
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Teams
            </CardTitle>
            <CardDescription>
              Organize your research groups and collaborate with colleagues
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/dashboard/teams">
              <Button className="w-full">
                View Teams
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FolderOpen className="h-5 w-5" />
              Sessions
            </CardTitle>
            <CardDescription>
              Create workspaces to organize papers, sequences, and experiments
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/dashboard/sessions">
              <Button className="w-full">
                View Sessions
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Start</CardTitle>
            <CardDescription>
              Get started with your first research session
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-sm text-muted-foreground">
              1. Create or join a team
            </p>
            <p className="text-sm text-muted-foreground">
              2. Start a new session
            </p>
            <p className="text-sm text-muted-foreground">
              3. Upload materials and collaborate
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
