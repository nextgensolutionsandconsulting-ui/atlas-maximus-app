
import { LoginForm } from "./_components/login-form"
import { Suspense } from "react"
import { AtlasLogo } from "@/components/ui/atlas-logo"

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="mx-auto mb-6 flex justify-center drop-shadow-xl">
            <AtlasLogo width={160} height={160} />
          </div>
          <h2 className="mt-6 text-3xl font-bold tracking-tight text-gray-900">
            Welcome back to Atlas Maximus
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Sign in to continue your Agile learning journey
          </p>
        </div>
        <Suspense fallback={<div>Loading...</div>}>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  )
}
