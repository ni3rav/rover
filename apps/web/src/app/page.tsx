import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <main className="container flex flex-1 flex-col items-start justify-center gap-2">
      <h1 className="text-3xl font-semibold">Rover</h1>
      <p className="text-sm text-muted-foreground">Open your dashboard to manage GitHub App access.</p>

      <div className="flex flex-wrap gap-2">
        <Button asChild>
          <Link href="/login">Sign in</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/dashboard">Open dashboard</Link>
        </Button>
      </div>
    </main>
  );
}
