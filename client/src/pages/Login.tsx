import { useState } from "react";
import { useAppAuth } from "@/contexts/AppAuthContext";
import type { ReviewerRole } from "@/contexts/AppAuthContext";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { REVIEWER_LABELS } from "@/lib/checklistDefinitions";
import { Eye, EyeOff, LogIn } from "lucide-react";

const OMD_LOGO = "/manus-storage/OMDLogo_8cc3ac67.svg";
const MSC_LOGO = "/manus-storage/MSCCruisesUSA-BlueLogo_5e8365c6.png";

const ROLES: ReviewerRole[] = ["builder", "qa1", "qa2", "md", "ed"];

export default function Login() {
  const { login } = useAppAuth();
  const upsertEmail = trpc.team.upsertEmail.useMutation();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<ReviewerRole>("builder");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [shaking, setShaking] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Please enter your name.");
      return;
    }
    if (!email.trim() || !email.includes("@")) {
      setError("Please enter a valid email address.");
      return;
    }
    const ok = login(password, name, role, email);
    if (ok) {
      // Save email to DB so server can route notifications
      upsertEmail.mutate({ name: name.trim(), email: email.trim(), role });
    }
    if (!ok) {
      setError("Incorrect password. Please try again.");
      setShaking(true);
      setTimeout(() => setShaking(false), 500);
      setPassword("");
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{ backgroundColor: "#000033" }}
    >
      {/* Card */}
      <div
        className={`w-full max-w-sm bg-white rounded-lg overflow-hidden shadow-2xl transition-transform ${shaking ? "animate-shake" : ""}`}
      >
        {/* Header strip */}
        <div
          className="px-6 py-5 flex items-center justify-between"
          style={{ backgroundColor: "#000033", borderBottom: "3px solid #E8321A" }}
        >
          <img src={OMD_LOGO} alt="OMD" className="h-7 w-auto" />
          <img src={MSC_LOGO} alt="MSC Cruises" className="h-6 w-auto" style={{ filter: "brightness(0) invert(1)" }} />
        </div>

        {/* Form */}
        <div className="px-6 py-7">
          <div className="mb-6">
            <h1
              className="text-base font-bold tracking-widest uppercase"
              style={{ color: "#000033", letterSpacing: "0.1em" }}
            >
              Campaign QA Dashboard
            </h1>
            <p className="text-xs text-muted-foreground mt-1">
              Enter your details to access the workspace.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label className="text-xs font-semibold" style={{ color: "#000033" }}>
                Your Name
              </Label>
              <Input
                value={name}
                onChange={(e) => { setName(e.target.value); setError(""); }}
                placeholder="e.g. Jake Wade"
                className="mt-1.5 h-9 text-sm"
                autoFocus
              />
            </div>

            <div>
              <Label className="text-xs font-semibold" style={{ color: "#000033" }}>
                Your Email
              </Label>
              <Input
                type="email"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setError(""); }}
                placeholder="e.g. jake@jump450.com"
                className="mt-1.5 h-9 text-sm"
              />
            </div>

            <div>
              <Label className="text-xs font-semibold" style={{ color: "#000033" }}>
                Your Role
              </Label>
              <Select value={role} onValueChange={(v) => setRole(v as ReviewerRole)}>
                <SelectTrigger className="mt-1.5 h-9 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ROLES.map((r) => (
                    <SelectItem key={r} value={r}>{REVIEWER_LABELS[r]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-xs font-semibold" style={{ color: "#000033" }}>
                Password
              </Label>
              <div className="relative mt-1.5">
                <Input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setError(""); }}
                  placeholder="Enter password"
                  className="h-9 text-sm pr-9"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>

            {error && (
              <div
                className="text-xs px-3 py-2 rounded"
                style={{ backgroundColor: "#FEE2E2", color: "#991B1B" }}
              >
                {error}
              </div>
            )}

            <Button
              type="submit"
              className="w-full gap-2 text-white mt-2"
              style={{ backgroundColor: "#E8321A", borderColor: "#E8321A" }}
            >
              <LogIn size={14} />
              Sign In
            </Button>
          </form>
        </div>

        {/* Footer */}
        <div
          className="px-6 py-3 text-center text-xs font-mono"
          style={{ backgroundColor: "#F8FAFC", color: "#94A3B8", borderTop: "1px solid #E5E7EB" }}
        >
          Jump450 / OMD · MSC Cruises
        </div>
      </div>

      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20% { transform: translateX(-8px); }
          40% { transform: translateX(8px); }
          60% { transform: translateX(-6px); }
          80% { transform: translateX(6px); }
        }
        .animate-shake { animation: shake 0.4s ease-in-out; }
      `}</style>
    </div>
  );
}
