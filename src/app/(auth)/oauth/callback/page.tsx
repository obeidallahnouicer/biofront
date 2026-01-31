export default function OAuthCallbackPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <div className="text-center max-w-md bg-background border rounded-lg p-6 shadow-sm">
        <h1 className="text-2xl font-bold mb-2">OAuth Callback</h1>
        <p className="text-muted-foreground">
          This callback route is deprecated. Please sign in again to continue.
        </p>
        <a href="/login" className="text-primary hover:underline inline-block mt-4">
          Return to login
        </a>
      </div>
    </div>
  )
}
