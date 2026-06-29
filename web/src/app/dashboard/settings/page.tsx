import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default async function SettingsPage() {
  const session = await getSession();
  if (!session) redirect("/auth/signin");

  const user = session.user;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-base text-muted-foreground">Manage your account</p>
      </div>

      <Card className="border-border/30">
        <CardHeader>
          <CardTitle className="text-lg">Profile</CardTitle>
          <CardDescription className="text-sm">Your account details</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between py-2">
            <span className="text-base text-muted-foreground">Name</span>
            <span className="text-base font-medium">{user.name}</span>
          </div>
          <div className="flex items-center justify-between py-2 border-t border-border/20">
            <span className="text-base text-muted-foreground">Email</span>
            <span className="text-base font-medium">{user.email}</span>
          </div>
          <div className="flex items-center justify-between py-2 border-t border-border/20">
            <span className="text-base text-muted-foreground">Timezone</span>
            <span className="text-base font-medium">{user.timezone || 'Asia/Kolkata'}</span>
          </div>
        </CardContent>
      </Card>

      <Card className="border-border/30">
        <CardHeader>
          <CardTitle className="text-lg">AI Configuration</CardTitle>
          <CardDescription className="text-sm">Powered by Google Gemini</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between py-2">
            <span className="text-base text-muted-foreground">AI Model</span>
            <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/20">Gemini 2.5 Flash</Badge>
          </div>
          <div className="flex items-center justify-between py-2 border-t border-border/20">
            <span className="text-base text-muted-foreground">API Status</span>
            <Badge variant="outline" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20">Connected</Badge>
          </div>
          <div className="flex items-center justify-between py-2 border-t border-border/20">
            <span className="text-base text-muted-foreground">Features</span>
            <div className="flex gap-1.5 flex-wrap justify-end">
              <Badge variant="outline" className="text-xs">Prioritization</Badge>
              <Badge variant="outline" className="text-xs">Scheduling</Badge>
              <Badge variant="outline" className="text-xs">Voice</Badge>
              <Badge variant="outline" className="text-xs">Analytics</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-border/30">
        <CardHeader>
          <CardTitle className="text-lg">Tech Stack</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {["Next.js", "TypeScript", "Tailwind CSS", "Gemini 2.5 Flash", "LangGraph", "Drizzle ORM", "SQLite", "Recharts", "Framer Motion", "shadcn/ui"].map(tech => (
              <Badge key={tech} variant="secondary" className="text-sm">{tech}</Badge>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}



