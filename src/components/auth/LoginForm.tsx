"use client"

import * as React from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Eye, EyeOff, Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { useAuthStore } from "@/stores/authStore"

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email"),
  password: z.string().min(1, "Password is required"),
})

type LoginFormData = z.infer<typeof loginSchema>

export function LoginForm() {
  const [showPassword, setShowPassword] = React.useState(false)
  const router = useRouter()
  const { login, isLoading, error, clearError } = useAuthStore()

  const rawDemoEmail = process.env.NEXT_PUBLIC_DEMO_EMAIL ?? "demo@example.com"
  // Sanitize known-invalid local domains (some environments use .local for dev hosts)
  const demoEmail = rawDemoEmail.includes(".local") ? rawDemoEmail.replace(/@[^@]+$/, "@example.com") : rawDemoEmail
  if (rawDemoEmail !== demoEmail) {
    console.warn(`Sanitized demo email from ${rawDemoEmail} to ${demoEmail}`)
  }
  const demoPassword = process.env.NEXT_PUBLIC_DEMO_PASSWORD ?? "DemoPass1!"

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: demoEmail, password: demoPassword },
  })

  const onSubmit = async (data: LoginFormData) => {
    try {
      clearError()
      await login(data.email, data.password)
      router.push("/dashboard")
    } catch {
      // Error is handled by the store
    }
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold text-center">Welcome back</CardTitle>
        <CardDescription className="text-center">
          Sign in to your BioLoupe account
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit(onSubmit)}>
        <CardContent className="space-y-4">
          {error && (
            <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="researcher@example.com"
              {...register("email")}
              disabled={isLoading}
            />
            {errors.email && (
              <p className="text-sm text-destructive">{errors.email.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                {...register("password")}
                disabled={isLoading}
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-0 top-0 h-full px-3"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </Button>
            </div>
            {errors.password && (
              <p className="text-sm text-destructive">{errors.password.message}</p>
            )}
          </div>
        </CardContent>
        <CardFooter className="flex flex-col space-y-4">
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Signing in...
              </>
            ) : (
              "Sign in"
            )}
          </Button>

          <div className="relative w-full">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                Or continue with
              </span>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <OAuthButton provider="google" label="Google" />
            <OAuthButton provider="microsoft" label="Microsoft" />
            <OAuthButton provider="orcid" label="ORCID" />
          </div>

          <div className="mt-2">
            <Button
              variant="secondary"
              onClick={async () => {
                try {
                  clearError()
                  await login(demoEmail, demoPassword)
                  // router push handled by store on success
                } catch {
                  // Handled via store
                }
              }}
            >
              Sign in as Demo Account
            </Button>
          </div>

          <p className="text-center text-sm text-muted-foreground">
            Don&apos;t have an account?{" "}
            <Link href="/register" className="text-primary hover:underline">
              Sign up
            </Link>
          </p>
        </CardFooter>
      </form>
    </Card>
  )
}

function OAuthButton({ provider, label }: Readonly<{ provider: string; label: string }>) {
  const handleOAuth = async () => {
    try {
      const apiClient = (await import("@/lib/api/client")).default
      const authorizationUrl = await apiClient.getOAuthAuthorizationUrl(
        provider as "google" | "microsoft" | "orcid"
      )
      globalThis.window.location.href = authorizationUrl
    } catch (error) {
      console.error("OAuth start failed:", error)
    }
  }

  return (
    <Button variant="outline" type="button" onClick={handleOAuth}>
      {label}
    </Button>
  )
}
