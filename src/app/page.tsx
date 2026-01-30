"use client""use client"import Image from "next/image";



import { useEffect } from "react"

import { useRouter } from "next/navigation"

import Link from "next/link"import { useEffect } from "react"export default function Home() {

import { Microscope, Users, FlaskConical, Sparkles, ArrowRight } from "lucide-react"

import { useRouter } from "next/navigation"  return (

import { Button } from "@/components/ui/button"

import { useAuthStore } from "@/stores/authStore"import Link from "next/link"    <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black">



export default function HomePage() {import { Microscope, Users, FlaskConical, Sparkles, ArrowRight } from "lucide-react"      <main className="flex min-h-screen w-full max-w-3xl flex-col items-center justify-between py-32 px-16 bg-white dark:bg-black sm:items-start">

  const router = useRouter()

  const { isAuthenticated, isLoading, initializeAuth } = useAuthStore()        <Image



  useEffect(() => {import { Button } from "@/components/ui/button"          className="dark:invert"

    initializeAuth()

  }, [initializeAuth])import { useAuthStore } from "@/stores/authStore"          src="/next.svg"



  useEffect(() => {          alt="Next.js logo"

    if (!isLoading && isAuthenticated) {

      router.push("/dashboard")export default function HomePage() {          width={100}

    }

  }, [isAuthenticated, isLoading, router])  const router = useRouter()          height={20}



  if (isLoading) {  const { isAuthenticated, isLoading, initializeAuth } = useAuthStore()          priority

    return (

      <div className="min-h-screen flex items-center justify-center bg-background">        />

        <div className="animate-pulse">

          <Microscope className="h-16 w-16 text-primary" />  useEffect(() => {        <div className="flex flex-col items-center gap-6 text-center sm:items-start sm:text-left">

        </div>

      </div>    initializeAuth()          <h1 className="max-w-xs text-3xl font-semibold leading-10 tracking-tight text-black dark:text-zinc-50">

    )

  }  }, [initializeAuth])            To get started, edit the page.tsx file.



  return (          </h1>

    <div className="min-h-screen bg-gradient-to-b from-background to-muted">

      {/* Header */}  useEffect(() => {          <p className="max-w-md text-lg leading-8 text-zinc-600 dark:text-zinc-400">

      <header className="border-b bg-background/80 backdrop-blur-sm sticky top-0 z-50">

        <div className="container mx-auto px-4 py-4 flex items-center justify-between">    if (!isLoading && isAuthenticated) {            Looking for a starting point or more instructions? Head over to{" "}

          <div className="flex items-center gap-2">

            <Microscope className="h-8 w-8 text-primary" />      router.push("/dashboard")            <a

            <span className="text-2xl font-bold">BioLoupe</span>

          </div>    }              href="https://vercel.com/templates?framework=next.js&utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"

          <div className="flex items-center gap-4">

            <Button variant="ghost" asChild>  }, [isAuthenticated, isLoading, router])              className="font-medium text-zinc-950 dark:text-zinc-50"

              <Link href="/login">Sign In</Link>

            </Button>            >

            <Button asChild>

              <Link href="/register">Get Started</Link>  if (isLoading) {              Templates

            </Button>

          </div>    return (            </a>{" "}

        </div>

      </header>      <div className="min-h-screen flex items-center justify-center bg-background">            or the{" "}



      {/* Hero Section */}        <div className="animate-pulse">            <a

      <section className="container mx-auto px-4 py-24 text-center">

        <h1 className="text-5xl md:text-6xl font-bold tracking-tight mb-6">          <Microscope className="h-16 w-16 text-primary" />              href="https://nextjs.org/learn?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"

          Collaborative Research

          <br />        </div>              className="font-medium text-zinc-950 dark:text-zinc-50"

          <span className="text-primary">Reimagined</span>

        </h1>      </div>            >

        <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">

          BioLoupe is a powerful platform for biotechnology researchers to collaborate    )              Learning

          in real-time, manage research materials, and leverage AI-powered insights.

        </p>  }            </a>{" "}

        <div className="flex flex-col sm:flex-row gap-4 justify-center">

          <Button size="lg" asChild>            center.

            <Link href="/register">

              Start Free Trial  return (          </p>

              <ArrowRight className="ml-2 h-5 w-5" />

            </Link>    <div className="min-h-screen bg-gradient-to-b from-background to-muted">        </div>

          </Button>

          <Button size="lg" variant="outline" asChild>      {/* Header */}        <div className="flex flex-col gap-4 text-base font-medium sm:flex-row">

            <Link href="/login">Sign In</Link>

          </Button>      <header className="border-b bg-background/80 backdrop-blur-sm sticky top-0 z-50">          <a

        </div>

      </section>        <div className="container mx-auto px-4 py-4 flex items-center justify-between">            className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-foreground px-5 text-background transition-colors hover:bg-[#383838] dark:hover:bg-[#ccc] md:w-[158px]"



      {/* Features Section */}          <div className="flex items-center gap-2">            href="https://vercel.com/new?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"

      <section className="container mx-auto px-4 py-16">

        <h2 className="text-3xl font-bold text-center mb-12">            <Microscope className="h-8 w-8 text-primary" />            target="_blank"

          Everything You Need for Research Excellence

        </h2>            <span className="text-2xl font-bold">BioLoupe</span>            rel="noopener noreferrer"

        <div className="grid md:grid-cols-3 gap-8">

          <FeatureCard          </div>          >

            icon={Users}

            title="Real-Time Collaboration"          <div className="flex items-center gap-4">            <Image

            description="Work together with your team in real-time. See cursor positions, selections, and changes as they happen with CRDT-powered sync."

          />            <Button variant="ghost" asChild>              className="dark:invert"

          <FeatureCard

            icon={FlaskConical}              <Link href="/login">Sign In</Link>              src="/vercel.svg"

            title="Material Management"

            description="Upload and organize papers, sequences, images, and experiments. Powerful viewers for each material type with annotation support."            </Button>              alt="Vercel logomark"

          />

          <FeatureCard            <Button asChild>              width={16}

            icon={Sparkles}

            title="AI-Powered Insights"              <Link href="/register">Get Started</Link>              height={16}

            description="Generate research hypotheses and rank sequence variants using advanced AI. Get scientific insights in seconds."

          />            </Button>            />

        </div>

      </section>          </div>            Deploy Now



      {/* Material Types Section */}        </div>          </a>

      <section className="bg-muted py-16">

        <div className="container mx-auto px-4">      </header>          <a

          <h2 className="text-3xl font-bold text-center mb-12">

            Support for All Your Research Materials            className="flex h-12 w-full items-center justify-center rounded-full border border-solid border-black/[.08] px-5 transition-colors hover:border-transparent hover:bg-black/[.04] dark:border-white/[.145] dark:hover:bg-[#1a1a1a] md:w-[158px]"

          </h2>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 max-w-3xl mx-auto">      {/* Hero Section */}            href="https://nextjs.org/docs?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"

            <MaterialTypeCard name="Papers" emoji="📄" />

            <MaterialTypeCard name="Sequences" emoji="🧬" />      <section className="container mx-auto px-4 py-24 text-center">            target="_blank"

            <MaterialTypeCard name="Images" emoji="🔬" />

            <MaterialTypeCard name="Experiments" emoji="🧪" />        <h1 className="text-5xl md:text-6xl font-bold tracking-tight mb-6">            rel="noopener noreferrer"

            <MaterialTypeCard name="Notes" emoji="📝" />

          </div>          Collaborative Research          >

        </div>

      </section>          <br />            Documentation



      {/* CTA Section */}          <span className="text-primary">Reimagined</span>          </a>

      <section className="container mx-auto px-4 py-24 text-center">

        <h2 className="text-3xl font-bold mb-4">        </h1>        </div>

          Ready to Transform Your Research?

        </h2>        <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">      </main>

        <p className="text-lg text-muted-foreground mb-8">

          Join teams of researchers already using BioLoupe          BioLoupe is a powerful platform for biotechnology researchers to collaborate    </div>

        </p>

        <Button size="lg" asChild>          in real-time, manage research materials, and leverage AI-powered insights.  );

          <Link href="/register">

            Get Started Free        </p>}

            <ArrowRight className="ml-2 h-5 w-5" />

          </Link>        <div className="flex flex-col sm:flex-row gap-4 justify-center">

        </Button>          <Button size="lg" asChild>

      </section>            <Link href="/register">

              Start Free Trial

      {/* Footer */}              <ArrowRight className="ml-2 h-5 w-5" />

      <footer className="border-t bg-background py-8">            </Link>

        <div className="container mx-auto px-4 text-center text-muted-foreground">          </Button>

          <div className="flex items-center justify-center gap-2 mb-4">          <Button size="lg" variant="outline" asChild>

            <Microscope className="h-5 w-5" />            <Link href="/login">Sign In</Link>

            <span className="font-semibold">BioLoupe</span>          </Button>

          </div>        </div>

          <p className="text-sm">      </section>

            © {new Date().getFullYear()} BioLoupe. Built for researchers, by researchers.

          </p>      {/* Features Section */}

        </div>      <section className="container mx-auto px-4 py-16">

      </footer>        <h2 className="text-3xl font-bold text-center mb-12">

    </div>          Everything You Need for Research Excellence

  )        </h2>

}        <div className="grid md:grid-cols-3 gap-8">

          <FeatureCard

function FeatureCard({            icon={Users}

  icon: Icon,            title="Real-Time Collaboration"

  title,            description="Work together with your team in real-time. See cursor positions, selections, and changes as they happen with CRDT-powered sync."

  description,          />

}: {          <FeatureCard

  readonly icon: React.ElementType            icon={FlaskConical}

  readonly title: string            title="Material Management"

  readonly description: string            description="Upload and organize papers, sequences, images, and experiments. Powerful viewers for each material type with annotation support."

}) {          />

  return (          <FeatureCard

    <div className="bg-background border rounded-xl p-6 shadow-sm">            icon={Sparkles}

      <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">            title="AI-Powered Insights"

        <Icon className="h-6 w-6 text-primary" />            description="Generate research hypotheses and rank sequence variants using advanced AI. Get scientific insights in seconds."

      </div>          />

      <h3 className="text-xl font-semibold mb-2">{title}</h3>        </div>

      <p className="text-muted-foreground">{description}</p>      </section>

    </div>

  )      {/* Material Types Section */}

}      <section className="bg-muted py-16">

        <div className="container mx-auto px-4">

function MaterialTypeCard({          <h2 className="text-3xl font-bold text-center mb-12">

  name,            Support for All Your Research Materials

  emoji,          </h2>

}: {          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 max-w-3xl mx-auto">

  readonly name: string            <MaterialTypeCard name="Papers" emoji="📄" />

  readonly emoji: string            <MaterialTypeCard name="Sequences" emoji="🧬" />

}) {            <MaterialTypeCard name="Images" emoji="🔬" />

  return (            <MaterialTypeCard name="Experiments" emoji="🧪" />

    <div className="bg-background border rounded-lg p-4 text-center shadow-sm">            <MaterialTypeCard name="Notes" emoji="📝" />

      <div className="text-3xl mb-2">{emoji}</div>          </div>

      <div className="font-medium">{name}</div>        </div>

    </div>      </section>

  )

}      {/* CTA Section */}

      <section className="container mx-auto px-4 py-24 text-center">
        <h2 className="text-3xl font-bold mb-4">
          Ready to Transform Your Research?
        </h2>
        <p className="text-lg text-muted-foreground mb-8">
          Join teams of researchers already using BioLoupe
        </p>
        <Button size="lg" asChild>
          <Link href="/register">
            Get Started Free
            <ArrowRight className="ml-2 h-5 w-5" />
          </Link>
        </Button>
      </section>

      {/* Footer */}
      <footer className="border-t bg-background py-8">
        <div className="container mx-auto px-4 text-center text-muted-foreground">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Microscope className="h-5 w-5" />
            <span className="font-semibold">BioLoupe</span>
          </div>
          <p className="text-sm">
            © {new Date().getFullYear()} BioLoupe. Built for researchers, by researchers.
          </p>
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

function MaterialTypeCard({
  name,
  emoji,
}: {
  readonly name: string
  readonly emoji: string
}) {
  return (
    <div className="bg-background border rounded-lg p-4 text-center shadow-sm">
      <div className="text-3xl mb-2">{emoji}</div>
      <div className="font-medium">{name}</div>
    </div>
  )
}
