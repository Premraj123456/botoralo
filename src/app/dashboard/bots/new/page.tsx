import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Bot, Save } from "lucide-react";

export default function NewBotPage() {
  return (
    <div className="max-w-2xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-2xl">
            <Bot className="h-6 w-6" />
            Create a New Bot
          </CardTitle>
          <CardDescription>
            Paste your bot's code below, give it a name, and deploy it.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="bot-name">Bot Name</Label>
              <Input id="bot-name" placeholder="e.g., My Arbitrage Bot" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bot-code">Bot Code</Label>
              <Textarea
                id="bot-code"
                placeholder="Paste your bot script here..."
                className="font-mono min-h-[300px] text-sm"
              />
            </div>
            <div className="flex justify-end">
              <Button type="submit">
                <Save className="mr-2 h-4 w-4" />
                Deploy Bot
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
