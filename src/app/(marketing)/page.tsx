import { Button } from '@/components/ui/button'
import { Bot, Code, Rocket, ArrowRight, LayoutDashboard } from 'lucide-react'
import { Link } from '@/components/layout/page-loader'
import Image from 'next/image'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Card, CardContent } from '@/components/ui/card'

const testimonials = [
  {
    quote: "BotPilot revolutionized my workflow. I went from spending hours managing servers to deploying bots in minutes. The AI-powered insights are a game-changer.",
    name: "Alex T.",
    title: "Algorithmic Trader",
    avatar: "https://i.pravatar.cc/150?u=a042581f4e29026704a"
  },
  {
    quote: "As a developer, I love that I can just bring my own code. The platform is robust, secure, and incredibly easy to use. I can't recommend it enough.",
    name: "Samantha K.",
    title: "Freelance Developer",
    avatar: "https://i.pravatar.cc/150?u=a042581f4e29026704b"
  },
  {
    quote: "The uptime and reliability are top-notch. I sleep better at night knowing my trading strategies are running on BotPilot's solid infrastructure.",
    name: "David L.",
    title: "Crypto Fund Manager",
    avatar: "https://i.pravatar.cc/150?u=a042581f4e29026704c"
  },
];

const faqs = [
  {
    question: "What languages can I use for my bots?",
    answer: "BotPilot is language-agnostic. As long as your script can run in a standard Linux container, you can host it with us. We have pre-configured environments for Python, JavaScript/TypeScript (Node.js), and Rust, but you can customize your environment."
  },
  {
    question: "How is my code kept secure?",
    answer: "Your code is stored in encrypted repositories and runs in isolated, sandboxed environments. We prioritize security with regular audits, vulnerability scanning, and secure networking practices. Your bot's environment is private to you."
  },
  {
    question: "Can I try the platform for free?",
    answer: "Absolutely! We offer a free tier that allows you to deploy one bot with sufficient resources for testing and hobby projects. It's a great way to experience the power of BotPilot without any commitment."
  },
  {
    question: "What makes the AI insights special?",
    answer: "Our AI doesn't just summarize logs. It actively looks for patterns, detects anomalies that could indicate bugs or security threats, and even suggests concrete code fixes based on the errors it finds, helping you iterate and improve your bots faster."
  }
]

export default async function LandingPage() {
  // In a real app, you would check the user's auth state here
  const user = null; // Mocked for now

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground overflow-x-hidden">
       <div className="absolute top-0 left-0 w-full h-full bg-grid-white/[0.05] z-0">
         <div className="absolute inset-0 bg-gradient-to-b from-background via-background/80 to-transparent pointer-events-none"></div>
         <div className="absolute top-[-20%] left-[10%] w-[40rem] h-[40rem] bg-primary/20 rounded-full blur-[150px] animate-pulse" />
         <div className="absolute bottom-[-20%] right-[10%] w-[40rem] h-[40rem] bg-secondary/30 rounded-full blur-[150px] animate-pulse delay-500" />
       </div>
      <header className="px-4 lg:px-6 h-16 flex items-center bg-transparent backdrop-blur-sm sticky top-0 z-50 border-b border-border/50">
        <Link className="flex items-center justify-center" href="/">
          <Bot className="h-6 w-6 text-primary" />
          <span className="ml-2 text-xl font-semibold tracking-wider font-headline">BotPilot</span>
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
            href="#testimonials"
          >
            Reviews
          </Link>
           <Link
            className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            href="#faq"
          >
            FAQ
          </Link>
          <Link
            className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            href="/pricing"
          >
            Pricing
          </Link>
          <div className="flex items-center gap-2">
            {user ? (
              <Button asChild>
                <Link href="/dashboard">
                  <LayoutDashboard className="mr-2 h-4 w-4" />
                  Dashboard
                </Link>
              </Button>
            ) : (
              <Button asChild>
                <Link href="/sign-in">
                  Get Started
                </Link>
              </Button>
            )}
          </div>
        </nav>
      </header>
      <main className="flex-1 z-10">
        <section className="w-full py-24 md:py-32 lg:py-40 xl:py-56">
          <div className="container px-4 md:px-6">
            <div className="grid gap-6 lg:grid-cols-2 lg:gap-12 xl:gap-16 items-center">
              <div className="flex flex-col justify-center space-y-6 animate-fade-in-up">
                <div className="space-y-4">
                  <h1 className="text-4xl font-bold tracking-tighter sm:text-6xl xl:text-7xl/none bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400 font-headline">
                    Deploy Your Trading Bots, Effortlessly.
                  </h1>
                  <p className="max-w-[600px] text-muted-foreground md:text-xl font-body">
                    Focus on your strategy. We handle the infrastructure.
                    BotPilot provides a secure, reliable, and easy-to-use
                    platform for hosting your crypto trading bots.
                  </p>
                </div>
                <div className="flex flex-col gap-4 min-[400px]:flex-row">
                   <Button asChild size="lg" className="group glow-shadow transition-all duration-300 ease-in-out hover:glow-shadow-lg">
                    <Link href={user ? "/dashboard" : "/sign-in"}>
                      Get Started Free
                      <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                    </Link>
                  </Button>
                </div>
              </div>
              <div className="relative animate-fade-in group">
                 <div className="absolute -inset-0.5 bg-gradient-to-r from-primary to-purple-600 rounded-xl blur opacity-50 group-hover:opacity-75 transition duration-1000 group-hover:duration-200 animate-tilt"></div>
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
                <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl font-headline">
                  Everything You Need to Succeed
                </h2>
                <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed font-body">
                  Our platform is packed with features to help you deploy,
                  monitor, and manage your trading bots with ease.
                </p>
              </div>
            </div>
            <div className="mx-auto grid max-w-5xl items-start gap-8 lg:grid-cols-3 lg:gap-12">
               <div className="grid gap-4 p-6 rounded-lg bg-card/50 border border-border/50 transition-all hover:border-primary/50 hover:bg-card animate-fade-in-up delay-100 backdrop-blur-sm">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-full bg-primary/10 text-primary glow-shadow">
                    <Rocket className="h-6 w-6" />
                  </div>
                  <h3 className="text-xl font-bold font-headline">Instant Deployment</h3>
                </div>
                <p className="text-muted-foreground font-body">
                  Go from code to live bot in minutes. Just paste your script,
                  and we'll handle the rest.
                </p>
              </div>
               <div className="grid gap-4 p-6 rounded-lg bg-card/50 border border-border/50 transition-all hover:border-primary/50 hover:bg-card animate-fade-in-up delay-200 backdrop-blur-sm">
                <div className="flex items-center gap-4">
                   <div className="p-3 rounded-full bg-primary/10 text-primary glow-shadow">
                    <Code className="h-6 w-6" />
                  </div>
                  <h3 className="text-xl font-bold font-headline">Bring Your Own Code</h3>
                </div>
                <p className="text-muted-foreground font-body">
                  We support popular languages and libraries. No need to learn a
                  new framework.
                </p>
              </div>
               <div className="grid gap-4 p-6 rounded-lg bg-card/50 border border-border/50 transition-all hover:border-primary/50 hover:bg-card animate-fade-in-up delay-300 backdrop-blur-sm">
                 <div className="flex items-center gap-4">
                     <div className="p-3 rounded-full bg-primary/10 text-primary glow-shadow">
                        <Bot className="h-6 w-6" />
                    </div>
                    <h3 className="text-xl font-bold font-headline">AI-Powered Insights</h3>
                 </div>
                <p className="text-muted-foreground font-body">
                  Leverage AI to summarize logs, detect anomalies, and even
                  suggest code fixes.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section id="testimonials" className="w-full py-12 md:py-24 lg:py-32">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center mb-12">
              <div className="space-y-2">
                <div className="inline-block rounded-lg bg-secondary px-3 py-1 text-sm font-semibold text-primary">
                  What Our Users Say
                </div>
                <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl font-headline">
                  Trusted by Traders and Developers
                </h2>
                <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed font-body">
                  Hear from our community about how BotPilot has transformed their trading and development process.
                </p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {testimonials.map((testimonial, index) => (
                <Card key={index} className="bg-card/50 border-border/50 backdrop-blur-sm p-6 flex flex-col justify-between animate-fade-in-up" style={{ animationDelay: `${index * 150}ms` }}>
                  <CardContent className="p-0">
                    <blockquote className="text-lg font-semibold leading-snug">
                      “{testimonial.quote}”
                    </blockquote>
                  </CardContent>
                  <div className="flex items-center gap-4 mt-6">
                    <Avatar>
                      <AvatarImage src={testimonial.avatar} alt={testimonial.name} />
                      <AvatarFallback>{testimonial.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-semibold">{testimonial.name}</p>
                      <p className="text-sm text-muted-foreground">{testimonial.title}</p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section id="faq" className="w-full py-12 md:py-24 lg:py-32">
          <div className="container px-4 md:px-6 max-w-4xl mx-auto">
            <div className="flex flex-col items-center justify-center space-y-4 text-center mb-12">
              <div className="space-y-2">
                <div className="inline-block rounded-lg bg-secondary px-3 py-1 text-sm font-semibold text-primary">
                  FAQ
                </div>
                <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl font-headline">
                  Frequently Asked Questions
                </h2>
                <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed font-body">
                  Have questions? We've got answers. If you can't find what you're looking for, feel free to contact us.
                </p>
              </div>
            </div>
            <Accordion type="single" collapsible className="w-full">
              {faqs.map((faq, index) => (
                <AccordionItem key={index} value={`item-${index}`} className="bg-card/50 border-border/50 backdrop-blur-sm rounded-lg mb-2 px-4">
                  <AccordionTrigger className="text-lg font-semibold hover:no-underline">{faq.question}</AccordionTrigger>
                  <AccordionContent className="text-base text-muted-foreground">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </section>

        <section className="w-full py-12 md:py-24 lg:py-32">
          <div className="container text-center">
             <div className="max-w-3xl mx-auto p-8 rounded-xl bg-gradient-to-r from-primary/30 to-purple-600/30 border border-primary/50 shadow-2xl">
                <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl font-headline text-white">
                    Ready to Automate Your Strategy?
                </h2>
                <p className="mt-4 max-w-xl mx-auto text-muted-foreground md:text-xl">
                    Join hundreds of developers and traders who trust BotPilot.
                    Deploy your first bot for free and experience the future of automated trading.
                </p>
                <div className="mt-8">
                   <Button asChild size="lg" className="group glow-shadow transition-all duration-300 ease-in-out hover:glow-shadow-lg">
                    <Link href={user ? "/dashboard" : "/sign-in"}>
                      Start Deploying Now
                      <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                    </Link>
                  </Button>
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
          <Link className="text-xs hover:underline underline-offset-4" href="/terms">
            Terms of Service
          </Link>
          <Link className="text-xs hover:underline underline-offset-4" href="/privacy">
            Privacy
          </Link>
        </nav>
      </footer>
    </div>
  )
}
