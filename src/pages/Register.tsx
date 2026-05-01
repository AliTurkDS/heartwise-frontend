import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Heart, Eye, EyeOff } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

// E.164-ish: +<country code><number>, total 8-16 digits after +
const PHONE_REGEX = /^\+[1-9]\d{7,15}$/;

const Register = () => {
  const [role, setRole] = useState<"patient" | "doctor">("patient");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("+");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [specialization, setSpecialization] = useState("");
  const [gender, setGender] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      toast.error("Password must be at least 6 characters.");
      return;
    }
    if (!PHONE_REGEX.test(phone)) {
      toast.error("Enter a valid phone with country code, e.g. +14155551234");
      return;
    }
    setLoading(true);

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/`,
        data: { full_name: name, role },
      },
    });

    if (error) {
      toast.error(error.message);
      setLoading(false);
      return;
    }

    if (data.user) {
      // Update profile with gender + phone
      await supabase
        .from("profiles")
        .update({ gender: gender || null, phone })
        .eq("id", data.user.id);

      // If doctor, add to doctors registry
      if (role === "doctor") {
        const { error: docError } = await supabase.from("doctors").insert({
          user_id: data.user.id,
          full_name: name,
          specialization: specialization || "General Physician",
        });
        if (docError) {
          toast.error("Failed to register doctor profile: " + docError.message);
          setLoading(false);
          return;
        }
      }

      toast.success("Account created successfully!");
      if (role === "doctor") navigate("/doctor");
      else navigate("/patient");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-dark">
      <Navbar />
      <div className="flex min-h-screen items-center justify-center px-4 pt-16 pb-8">
        <div className="w-full max-w-md rounded-2xl border border-border/50 bg-card p-8">
          <div className="mb-8 text-center">
            <Heart className="mx-auto h-10 w-10 text-heart fill-heart/20" />
            <h1 className="mt-4 font-display text-2xl font-bold">Create Account</h1>
            <p className="mt-1 text-sm text-muted-foreground">Join AI HeartCare today</p>
          </div>

          {/* Role Toggle */}
          <div className="mb-6 flex rounded-lg border border-border/50 bg-secondary p-1">
            <button
              type="button"
              onClick={() => setRole("patient")}
              className={`flex-1 rounded-md py-2 text-sm font-medium transition-all ${
                role === "patient" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Patient
            </button>
            <button
              type="button"
              onClick={() => setRole("doctor")}
              className={`flex-1 rounded-md py-2 text-sm font-medium transition-all ${
                role === "doctor" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Doctor
            </button>
          </div>

          <form onSubmit={handleRegister} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input id="name" placeholder="John Doe" value={name} onChange={(e) => setName(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="gender">Gender</Label>
              <select
                id="gender"
                value={gender}
                onChange={(e) => setGender(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <option value="">Select gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
                <option value="Prefer not to say">Prefer not to say</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="reg-email">Email</Label>
              <Input
                id="reg-email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="reg-phone">Phone (with country code)</Label>
              <Input
                id="reg-phone"
                type="tel"
                placeholder="+14155551234"
                value={phone}
                onChange={(e) => {
                  let v = e.target.value.replace(/[^\d+]/g, "");
                  if (!v.startsWith("+")) v = "+" + v.replace(/\+/g, "");
                  setPhone(v);
                }}
                required
              />
              <p className="text-xs text-muted-foreground">
                Format: + followed by country code and number (e.g. +14155551234)
              </p>
            </div>
            {role === "doctor" && (
              <div className="space-y-2">
                <Label htmlFor="specialization">Specialization</Label>
                <Input
                  id="specialization"
                  placeholder="e.g. Cardiology"
                  value={specialization}
                  onChange={(e) => setSpecialization(e.target.value)}
                  required
                />
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="reg-password">Password</Label>
              <div className="relative">
                <Input
                  id="reg-password"
                  type={showPass ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  onClick={() => setShowPass(!showPass)}
                >
                  {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Creating account..." : "Create Account"}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link to="/login" className="text-primary hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
