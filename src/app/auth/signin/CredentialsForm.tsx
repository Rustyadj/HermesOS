"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, EyeOff, Loader2 } from "lucide-react";

export function CredentialsForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/dashboard";

  const [mode, setMode] = useState<"signin" | "register">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSignIn(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });
    setLoading(false);
    if (result?.error) {
      setError("Invalid email or password.");
    } else {
      router.push(callbackUrl);
    }
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, name }),
    });
    if (!res.ok) {
      const data = await res.json() as { error?: string };
      setError(data.error ?? "Registration failed.");
      setLoading(false);
      return;
    }
    // Auto sign-in after registration
    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });
    setLoading(false);
    if (result?.error) {
      setError("Registered but sign-in failed. Try signing in manually.");
    } else {
      router.push(callbackUrl);
    }
  }

  return (
    <div className="space-y-3">
      {/* Divider */}
      <div className="flex items-center gap-3">
        <div className="flex-1 h-px bg-[--border]" />
        <span className="text-[10px] text-[--muted-foreground] uppercase tracking-widest">or</span>
        <div className="flex-1 h-px bg-[--border]" />
      </div>

      {/* Mode toggle */}
      <div className="flex bg-[--muted] border border-[--border] rounded-lg p-0.5">
        {(["signin", "register"] as const).map((m) => (
          <button
            key={m}
            onClick={() => { setMode(m); setError(""); }}
            className={`flex-1 text-xs py-1.5 rounded-md font-medium transition-colors ${
              mode === m
                ? "bg-[--card] text-[--foreground] shadow-sm"
                : "text-[--muted-foreground] hover:text-[--foreground]"
            }`}
          >
            {m === "signin" ? "Sign In" : "Register"}
          </button>
        ))}
      </div>

      <form onSubmit={mode === "signin" ? handleSignIn : handleRegister} className="space-y-2.5">
        {mode === "register" && (
          <input
            type="text"
            placeholder="Name"
            value={name}
            onChange={e => setName(e.target.value)}
            className="w-full h-10 px-3 rounded-lg border border-[--border] bg-[--muted] text-sm text-[--foreground] placeholder:text-[--muted-foreground] outline-none focus:border-[--primary]/60 transition-colors"
          />
        )}

        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
          className="w-full h-10 px-3 rounded-lg border border-[--border] bg-[--muted] text-sm text-[--foreground] placeholder:text-[--muted-foreground] outline-none focus:border-[--primary]/60 transition-colors"
        />

        <div className="relative">
          <input
            type={showPw ? "text" : "password"}
            placeholder="Password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            minLength={8}
            className="w-full h-10 px-3 pr-9 rounded-lg border border-[--border] bg-[--muted] text-sm text-[--foreground] placeholder:text-[--muted-foreground] outline-none focus:border-[--primary]/60 transition-colors"
          />
          <button
            type="button"
            onClick={() => setShowPw(v => !v)}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[--muted-foreground] hover:text-[--foreground] transition-colors"
          >
            {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>

        {error && (
          <div className="px-3 py-2 rounded-lg bg-[--destructive]/10 border border-[--destructive]/20 text-xs text-[--destructive]">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full h-10 flex items-center justify-center gap-2 rounded-lg bg-[--primary] hover:bg-[--primary]/90 disabled:opacity-60 text-white text-sm font-medium transition-colors"
        >
          {loading && <Loader2 className="w-4 h-4 animate-spin" />}
          {mode === "signin" ? "Sign in" : "Create account"}
        </button>
      </form>
    </div>
  );
}
