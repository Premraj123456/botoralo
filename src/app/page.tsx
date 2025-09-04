import { Button } from '@/components/ui/button'
import { Bot, Code, Rocket, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground overflow-x-hidden">
       <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-background to-black/50 z-0">
          <div className="absolute top-[-20%] left-[10%] w-[40rem] h-[40rem] bg-primary/10 rounded-full blur-[120px]" />
          <div className="absolute bottom-[-20%] right-[10%] w-[40rem] h-[40rem] bg-secondary/20 rounded-full blur-[120px]" />
        </div>
      <header className="px-4 lg:px-6 h-16 flex items-center bg-transparent backdrop-blur-sm sticky top-0 z-50 border-b border-border/50">
        <Link className="flex items-center justify-center" href="#">
          <Bot className="h-6 w-6 text-primary" />
          <span className="ml-2 text-xl font-semibold tracking-wider">BotPilot</span>
        </Link>
        <nav className="ml-auto flex gap-4 sm:gap-6 items-center">
          <Link
            className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            href="#features"
          >
            Features
          </Link>
          <Link
            className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            href="/pricing"
          >
            Pricing
          </Link>
          <Button asChild variant="ghost" size="sm">
            <Link href="/login">Login</Link>
          </Button>
          <Button asChild size="sm" className="shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-shadow">
            <Link href="/signup">Get Started</Link>
          </Button>
        </nav>
      </header>
      <main className="flex-1 z-10">
        <section className="w-full py-24 md:py-32 lg:py-40 xl:py-56">
          <div className="container px-4 md:px-6">
            <div className="grid gap-6 lg:grid-cols-2 lg:gap-12 xl:gap-16 items-center">
              <div className="flex flex-col justify-center space-y-6 animate-fade-in-up">
                <div className="space-y-4">
                  <h1 className="text-4xl font-bold tracking-tighter sm:text-6xl xl:text-7xl/none bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
                    Deploy Your Trading Bots, Effortlessly.
                  </h1>
                  <p className="max-w-[600px] text-muted-foreground md:text-xl">
                    Focus on your strategy. We handle the infrastructure.
                    BotPilot provides a secure, reliable, and easy-to-use
                    platform for hosting your crypto trading bots.
                  </p>
                </div>
                <div className="flex flex-col gap-4 min-[400px]:flex-row">
                  <Button asChild size="lg" className="group glow-shadow transition-all duration-300 ease-in-out hover:glow-shadow-lg">
                    <Link href="/signup">
                      Get Started Free
                      <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                    </Link>
                  </Button>
                </div>
              </div>
              <div className="relative animate-fade-in group">
                 <div className="absolute -inset-0.5 bg-gradient-to-r from-primary to-secondary rounded-xl blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200 animate-tilt"></div>
                <Image
                  alt="Hero"
                  className="mx-auto aspect-video overflow-hidden rounded-xl object-cover"
                  height="400"
                  src="https://picsum.photos/600/338"
                  data-ai-hint="futuristic technology"
                  width="700"
                />
              </div>
            </div>
          </div>
        </section>
        <section id="features" className="w-full py-12 md:py-24 lg:py-32">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center mb-12">
              <div className="space-y-2">
                 <div className="inline-block rounded-lg bg-secondary px-3 py-1 text-sm font-semibold text-primary">
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
            <div className="mx-auto grid max-w-5xl items-start gap-8 lg:grid-cols-3 lg:gap-12">
               <div className="grid gap-4 p-6 rounded-lg bg-secondary/50 border border-border/50 transition-all hover:border-primary/50 hover:bg-secondary/80 animate-fade-in-up delay-100">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-full bg-primary/10 text-primary">
                    <Rocket className="h-6 w-6" />
                  </div>
                  <h3 className="text-xl font-bold">Instant Deployment</h3>
                </div>
                <p className="text-muted-foreground">
                  Go from code to live bot in minutes. Just paste your script,
                  and we'll handle the rest.
                </p>
              </div>
               <div className="grid gap-4 p-6 rounded-lg bg-secondary/50 border border-border/50 transition-all hover:border-primary/50 hover:bg-secondary/80 animate-fade-in-up delay-200">
                <div className="flex items-center gap-4">
                   <div className="p-3 rounded-full bg-primary/10 text-primary">
                    <Code className="h-6 w-6" />
                  </div>
                  <h3 className="text-xl font-bold">Bring Your Own Code</h3>
                </div>
                <p className="text-muted-foreground">
                  We support popular languages and libraries. No need to learn a
                  new framework.
                </p>
              </div>
               <div className="grid gap-4 p-6 rounded-lg bg-secondary/50 border border-border/50 transition-all hover:border-primary/50 hover:bg-secondary/80 animate-fade-in-up delay-300">
                 <div className="flex items-center gap-4">
                     <div className="p-3 rounded-full bg-primary/10 text-primary">
                        <Bot className="h-6 w-6" />
                    </div>
                    <h3 className="text-xl font-bold">AI-Powered Insights</h3>
                 </div>
                <p className="text-muted-foreground">
                  Leverage AI to summarize logs, detect anomalies, and even
                  suggest code fixes.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>
      <footer className="flex flex-col gap-2 sm:flex-row py-6 w-full shrink-0 items-center px-4 md:px-6 border-t border-border/50 z-10">
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
