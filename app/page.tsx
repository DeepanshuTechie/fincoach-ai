import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 px-4 text-center">
      <span className="text-sm font-medium text-muted-foreground">
        FinCoach AI
      </span>
      <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
        Understand your money.
        <br />
        Ask it anything.
      </h1>
      <p className="max-w-md text-muted-foreground">
        Upload your bank statement. Get instant categorization, spending
        insights, and an AI that answers questions about your own finances.
      </p>
      <div className="flex gap-3">
        <Button size="lg">Get Started</Button>
        <Button size="lg" variant="outline">
          Learn More
        </Button>
      </div>

      <Card className="mt-10 w-full max-w-md p-6 text-left text-sm text-muted-foreground">
        Dashboard preview will go here (Week 4)
      </Card>
    </main>
  );
}