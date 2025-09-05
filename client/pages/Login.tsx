import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function Login() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const to = params.get("to") ?? "/overview";

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    try { localStorage.setItem("auth", "1"); } catch {}
    navigate(to);
  }

  return (
    <div className="min-h-svh grid place-items-center p-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Sign in</CardTitle>
          <CardDescription>Access your dashboard</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="grid gap-3" onSubmit={onSubmit}>
            <div>
              <div className="text-xs text-muted-foreground mb-1">Email</div>
              <Input type="email" value={email} onChange={(e)=>setEmail(e.target.value)} required placeholder="you@example.com" />
            </div>
            <div>
              <div className="text-xs text-muted-foreground mb-1">Password</div>
              <Input type="password" value={password} onChange={(e)=>setPassword(e.target.value)} required placeholder="••���•••••" />
            </div>
            <Button type="submit" className="mt-2 w-full">Login</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
