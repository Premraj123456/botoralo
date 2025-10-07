
import { ArrowRight, Bot, Code, Rocket } from 'lucide-react'
import Image from 'next/image'
import { Link } from '@/components/layout/page-loader';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Card, CardContent } from '@/components/ui/card'
import { GetStartedButton } from '@/components/marketing/get-started-button'

const testimonials = [
  {
    quote: "Botoralo is a lifesaver. My Discord bot used to go offline constantly. Now it runs 24/7 without a hitch, and the AI log analysis helped me fix a recurring bug I couldn't find.",
    name: "Alex T.",
    title: "Discord Bot Developer",
    avatar: "https://i.pravatar.cc/150?u=a042581f4e29026704a"
  },
  {
    quote: "As a Python dev, I love how easy it is to deploy my Telegram bots. I just push my code and Botoralo handles the rest. No more fighting with VPS configurations.",
    name: "Samantha K.",
    title: "Python Developer",
    avatar: "https://i.pravatar.cc/150?u=a042581f4e29026704b"
  },
  {
    quote: "The uptime is incredible, and the pricing is super fair for the peace of mind it gives me. My community can count on my bots being online. 10/10 service.",
    name: "David L.",
    title: "Community Manager",
    avatar: "https://i.pravatar.cc/150?u=a042581f4e29026704c"
  },
];

const faqs = [
  {
    question: "What languages and libraries do you support?",
    answer: "Our pre-configured environments are optimized for Node.js (for discord.js) and Python (for discord.py, py-cord, and python-telegram-bot). However, our platform is language-agnostic. As long as your script can run in a standard Linux container, you can host it with us."
  },
  {
    question: "How do I deploy my bot?",
    answer: "You can simply upload your code file (like a `bot.py` or `index.js`) or a whole project folder. We are actively working on 1-click deployment from GitHub repositories to make the process even faster."
  },
  {
    question: "Can I try the platform for free?",
    answer: "Absolutely! We offer a generous free tier that allows you to deploy one bot with sufficient resources for most community bots. It's the perfect way to see how Botoralo works without any commitment."
  },
  {
    question: "What makes the AI insights special?",
    answer: "Our AI doesn't just summarize logs. It actively looks for patterns, detects anomalies that could indicate bugs or rate-limiting issues, and even suggests concrete code fixes based on the errors it finds, helping you iterate and improve your bots faster."
  }
]

export default function LandingPage() {
  return (
    <>
        <section className="w-full py-24 md:py-32 lg:py-40 xl:py-56">
          <div className="container px-4 md:px-6">
            <div className="grid gap-6 lg:grid-cols-2 lg:gap-12 xl:gap-16 items-center">
              <div className="flex flex-col justify-center space-y-6 animate-fade-in-up">
                <div className="space-y-4">
                  <h1 className="text-4xl font-bold tracking-tighter sm:text-6xl xl:text-7xl/none bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400 font-headline">
                    Keep your Discord & Telegram bots alive 24/7.
                  </h1>
                  <p className="max-w-[600px] text-muted-foreground md:text-xl font-body">
                    No VPS, no DevOps, just code. Focus on building great community bots. We handle the infrastructure, ensuring your bots run 24/7 without interruption.
                  </p>
                </div>
                <div className="flex flex-col gap-4 min-[400px]:flex-row">
                   <GetStartedButton />
                </div>
              </div>
              <div className="relative animate-fade-in group">
                 <div className="absolute -inset-0.5 bg-gradient-to-r from-primary to-purple-600 rounded-xl blur opacity-50 group-hover:opacity-75 transition duration-1000 group-hover:duration-200 animate-tilt"></div>
                <Image
                  alt="Hero"
                  className="mx-auto aspect-video overflow-hidden rounded-xl object-cover"
                  height="400"
                  src="https://picsum.photos/seed/1/600/400"
                  data-ai-hint="discord telegram bots"
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
                  Everything Your Bot Needs to Thrive
                </h2>
                <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed font-body">
                  Our platform is packed with features designed to help you deploy, monitor, and manage your Discord and Telegram bots with ease.
                </p>
              </div>
            </div>
            <div className="mx-auto grid max-w-5xl items-start gap-8 lg:grid-cols-3 lg:gap-12">
               <div className="grid gap-4 p-6 rounded-lg bg-card/50 border border-border/50 transition-all hover:border-primary/50 hover:bg-card animate-fade-in-up delay-100 backdrop-blur-sm">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-full bg-primary/10 text-primary glow-shadow">
                    <Rocket className="h-6 w-6" />
                  </div>
                  <h3 className="text-xl font-bold font-headline">1-Click Deployment</h3>
                </div>
                <p className="text-muted-foreground font-body">
                  Go from code to live bot in minutes. Upload your script or project folder, and we'll handle the rest.
                </p>
              </div>
               <div className="grid gap-4 p-6 rounded-lg bg-card/50 border border-border/50 transition-all hover:border-primary/50 hover:bg-card animate-fade-in-up delay-200 backdrop-blur-sm">
                <div className="flex items-center gap-4">
                   <div className="p-3 rounded-full bg-primary/10 text-primary glow-shadow">
                    <Code className="h-6 w-6" />
                  </div>
                  <h3 className="text-xl font-bold font-headline">Optimized Environments</h3>
                </div>
                <p className="text-muted-foreground font-body">
                  We support popular libraries like discord.js, discord.py, and python-telegram-bot out-of-the-box. No need to fight with dependencies.
                </p>
              </div>
               <div className="grid gap-4 p-6 rounded-lg bg-card/50 border border-border/50 transition-all hover:border-primary/50 hover:bg-card animate-fade-in-up delay-300 backdrop-blur-sm">
                 <div className="flex items-center gap-4">
                     <div className="p-3 rounded-full bg-primary/10 text-primary glow-shadow">
                        <Bot className="h-6 w-6" />
                    </div>
                    <h3 className="text-xl font-bold font-headline">AI-Powered Debugging</h3>
                 </div>
                <p className="text-muted-foreground font-body">
                  Leverage AI to summarize logs, detect anomalies like rate-limiting, and even get code fix suggestions.
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
                  Trusted by Bot Developers & Communities
                </h2>
                <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed font-body">
                  Hear from our community about how Botoralo has transformed their bot development and management process.
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
                    Ready to Bring Your Bot to Life?
                </h2>
                <p className="mt-4 max-w-xl mx-auto text-muted-foreground md:text-xl">
                    Join hundreds of developers who trust Botoralo. Deploy your first Discord or Telegram bot for free and say goodbye to downtime.
                </p>
                <div className="mt-8">
                   <GetStartedButton ctaText="Start Deploying Now" />
                </div>
             </div>
          </div>
        </section>
    </>
  )
}
