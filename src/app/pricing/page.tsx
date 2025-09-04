import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2 } from "lucide-react";

const plans = [
  {
    name: "Free",
    price: "$0",
    description: "For hobbyists and testing things out.",
    ram: "128MB RAM",
    features: ["1 Bot Slot", "24/7 Uptime", "Basic Logging", "Community Support"],
    cta: "Start for Free",
    isPrimary: false,
  },
  {
    name: "Pro",
    price: "$9",
    description: "For serious traders who need more power.",
    ram: "512MB RAM",
    features: ["5 Bot Slots", "24/7 Uptime", "Advanced Logging", "AI Log Analysis", "Email Support"],
    cta: "Upgrade to Pro",
    isPrimary: true,
  },
  {
    name: "Power",
    price: "$29",
    description: "For professionals running multiple complex bots.",
    ram: "1GB RAM",
    features: ["20 Bot Slots", "24/7 Uptime", "Advanced Logging", "AI Log Analysis", "Priority Support"],
    cta: "Go Power",
    isPrimary: false,
  },
];

export default function PricingPage() {
  return (
    <div className="flex flex-col gap-8 items-center">
      <div className="text-center max-w-2xl">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Choose the perfect plan for your bots</h1>
        <p className="mt-4 text-lg text-muted-foreground">
          Simple, transparent pricing. No hidden fees. Cancel anytime.
        </p>
      </div>
      <div className="grid gap-8 md:grid-cols-3 max-w-5xl w-full">
        {plans.map((plan) => (
          <Card key={plan.name} className={plan.isPrimary ? 'border-primary ring-2 ring-primary' : ''}>
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">{plan.name}</CardTitle>
              <p className="text-4xl font-bold">{plan.price}<span className="text-lg font-normal text-muted-foreground">/mo</span></p>
              <CardDescription>{plan.description}</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-6">
              <div className="text-center font-semibold bg-muted py-2 rounded-md">{plan.ram}</div>
              <ul className="space-y-3">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                    <span className="text-muted-foreground">{feature}</span>
                  </li>
                ))}
              </ul>
              <Button className="w-full mt-4" variant={plan.isPrimary ? 'default' : 'outline'}>
                {plan.cta}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
