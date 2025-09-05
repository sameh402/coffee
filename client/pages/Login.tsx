import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function Login() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const to = params.get("to") ?? "/overview";

  useEffect(() => {
    try {
      if (localStorage.getItem("auth") === "1") navigate(to, { replace: true });
    } catch {}
  }, [navigate, to]);

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
              <div className="relative">
                <Input
                  type={show ? "text" : "password"}
                  value={password}
                  onChange={(e)=>setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  aria-label={show ? "Hide password" : "Show password"}
                  onClick={() => setShow((s) => !s)}
                  className="absolute inset-y-0 right-2 grid place-items-center text-muted-foreground hover:text-foreground"
                >
                  {show ? (
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4"><path d="M17.94 17.94A10.94 10.94 0 0 1 12 20C7 20 2.73 16.11 1 12c.64-1.43 1.58-2.74 2.75-3.86M9.88 9.88A3 3 0 0 0 12 15a3 3 0 0 0 2.12-5.12M6.1 6.1 1 1m22 22-5.1-5.1M14.12 14.12 9.88 9.88M22.94 12c-.69 1.66-1.86 3.14-3.35 4.31M9.88 9.88 6.1 6.1"/></svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4"><path d="M1 12S5 5 12 5s11 7 11 7-4 7-11 7S1 12 1 12Z"/><circle cx="12" cy="12" r="3"/></svg>
                  )}
                </button>
              </div>
            </div>
            <Button type="submit" className="mt-2 w-full">Login</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
