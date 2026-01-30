"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Microscope, Users, FlaskConical, Sparkles, ArrowRight } from "lucide-react"

import { Button } from "@/components/ui/button"
import { useAuthStore } from "@/stores/authStore"

export default function HomePage() {
  const router = useRouter()
  const { isAuthenticated, isLoading, initializeAuth } = useAuthStore()

  useEffect(() => {
    initializeAuth()
  }, [initializeAuth])

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.push("/dashboard")
    }
  }, [isAuthenticated, isLoading, router])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse">
          <Microscope className="h-16 w-16 text-primary" />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted">
      <header className="border-b bg-background/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Microscope className="h-8 w-8 text-primary" />
            <span className="text-2xl font-bold">BioLoupe</span>
          </div>
          <div className="flex items-center gap-4">
            <Button variant="ghost" asChild>
              <Link href="/login">Sign In</Link>
            </Button>
            <Button asChild>
              <Link href="/register">Get Started</Link>
            </Button>
          </div>
        </div>
      </header>

      <section className="container mx-auto px-4 py-24 text-center">
        <h1 className="text-5xl md:text-6xl font-bold tracking-tight mb-6">
          Collaborative Research
          <br />
          <span className="text-primary">Reimagined</span>
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
          BioLoupe is a powerful platform for biotechnology researchers to collaborate
          in real-time, manage research materials, and leverage AI-powered insights.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button size="lg" asChild>
            <Link href="/register">
              Start Free Trial
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
          <Button size="lg" variant="outline" asChild>
            <Link href="/login">Sign In</Link>
          </Button>
        </div>
      </section>

      <section className="container mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-center mb-12">
          Everything You Need for Research Excellence
        </h2>
        <div className="grid md:grid-cols-3 gap-8">
          <FeatureCard
            icon={Users}
            title="Real-Time Collaboration"
            description="Work together with your team in real-time with CRDT-powered sync."
          />
          <FeatureCard
            icon={FlaskConical}
            title="Material Management"
            description="Upload and organize papers, sequences, images, and experiments."
          />
          <FeatureCard
            icon={Sparkles}
            title="AI-Powered Insights"
            description="Generate hypotheses and rank variants using advanced AI."
          />
        </div>
      </section>

      <footer className="border-t bg-background py-8">
        <div className="container mx-auto px-4 text-center text-muted-foreground">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Microscope className="h-5 w-5" />
            <span className="font-semibold">BioLoupe</span>
          </div>
          <p className="text-sm">Built for researchers, by researchers.</p>
        </div>
      </footer>
    </div>
  )
}

function FeatureCard({
  icon: Icon,
  title,
  description,
}: {
  readonly icon: React.ElementType
  readonly title: string
  readonly description: string
}) {
  return (
    <div className="bg-background border rounded-xl p-6 shadow-sm">
      <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
        <Icon className="h-6 w-6 text-primary" />
      </div>
      <h3 className="text-xl font-semibold mb-2">{title}</h3>
      <p className="text-muted-foreground">{description}</p>
    </div>
  )
}
