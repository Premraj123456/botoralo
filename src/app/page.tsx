import { Button } from '@/components/ui/button'
import { Bot, Code, Rocket } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <header className="px-4 lg:px-6 h-14 flex items-center bg-background sticky top-0 z-50 border-b">
        <Link className="flex items-center justify-center" href="#">
          <Bot className="h-6 w-6 text-primary" />
          <span className="ml-2 text-lg font-semibold">BotPilot</span>
        </Link>
        <nav className="ml-auto flex gap-4 sm:gap-6">
          <Link
            className="text-sm font-medium hover:underline underline-offset-4"
            href="#features"
          >
            Features
          </Link>
          <Link
            className="text-sm font-medium hover:underline underline-offset-4"
            href="/pricing"
          >
            Pricing
          </Link>
          <Button asChild variant="outline">
            <Link href="/login">Login</Link>
          </Button>
          <Button asChild>
            <Link href="/signup">Sign Up</Link>
          </Button>
        </nav>
      </header>
      <main className="flex-1">
        <section className="w-full py-12 md:py-24 lg:py-32 xl:py-48">
          <div className="container px-4 md:px-6">
            <div className="grid gap-6 lg:grid-cols-[1fr_400px] lg:gap-12 xl:grid-cols-[1fr_600px]">
              <div className="flex flex-col justify-center space-y-4">
                <div className="space-y-2">
                  <h1 className="text-3xl font-bold tracking-tighter sm:text-5xl xl:text-6xl/none">
                    Deploy Your Trading Bots, Effortlessly.
                  </h1>
                  <p className="max-w-[600px] text-muted-foreground md:text-xl">
                    Focus on your strategy. We handle the infrastructure.
                    BotPilot provides a secure, reliable, and easy-to-use
                    platform for hosting your crypto trading bots.
                  </p>
                </div>
                <div className="flex flex-col gap-2 min-[400px]:flex-row">
                  <Button asChild size="lg">
                    <Link href="/signup">Get Started for Free</Link>
                  </Button>
                </div>
              </div>
              <Image
                alt="Hero"
                className="mx-auto aspect-video overflow-hidden rounded-xl object-cover sm:w-full lg:order-last lg:aspect-square"
                height="550"
                src="https://picsum.photos/550/550"
                data-ai-hint="abstract technology"
                width="550"
              />
            </div>
          </div>
        </section>
        <section id="features" className="w-full py-12 md:py-24 lg:py-32 bg-muted">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <div className="inline-block rounded-lg bg-secondary px-3 py-1 text-sm">
                  Key Features
                </div>
                <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl">
                  Everything You Need to Succeed
                </h2>
                <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                  Our platform is packed with features to help you deploy,
                  monitor, and manage your trading bots with ease.
                </p>
              </div>
            </div>
            <div className="mx-auto grid max-w-5xl items-center gap-6 py-12 lg:grid-cols-3 lg:gap-12">
              <div className="grid gap-1">
                <Rocket className="h-8 w-8 text-primary" />
                <h3 className="text-xl font-bold">Instant Deployment</h3>
                <p className="text-sm text-muted-foreground">
                  Go from code to live bot in minutes. Just paste your script,
                  and we'll handle the rest.
                </p>
              </div>
              <div className="grid gap-1">
                <Code className="h-8 w-8 text-primary" />
                <h3 className="text-xl font-bold">Bring Your Own Code</h3>
                <p className="text-sm text-muted-foreground">
                  We support popular languages and libraries. No need to learn a
                  new framework.
                </p>
              </div>
              <div className="grid gap-1">
                <Bot className="h-8 w-8 text-primary" />
                <h3 className="text-xl font-bold">AI-Powered Insights</h3>
                <p className="text-sm text-muted-foreground">
                  Leverage AI to summarize logs, detect anomalies, and even
                  suggest code fixes.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>
      <footer className="flex flex-col gap-2 sm:flex-row py-6 w-full shrink-0 items-center px-4 md:px-6 border-t">
        <p className="text-xs text-muted-foreground">
          © 2024 BotPilot. All rights reserved.
        </p>
        <nav className="sm:ml-auto flex gap-4 sm:gap-6">
          <Link className="text-xs hover:underline underline-offset-4" href="#">
            Terms of Service
          </Link>
          <Link className="text-xs hover:underline underline-offset-4" href="#">
            Privacy
          </Link>
        </nav>
      </footer>
    </div>
  )
}
