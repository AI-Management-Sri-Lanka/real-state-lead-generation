// src/pages/auth/components/SignUpForm.tsx
import { FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import toast from "react-hot-toast";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/hooks/useAuth";
import { useForm } from "@/hooks/useForm";
import { GoogleButton } from "./GoogleButton";
import { AuthDivider } from "./AuthDivider";
import { isValidEmail }         from '@/utils/validation'

const INIT = { name: "", email: "", password: "", confirmPassword: "" };
const NAME_REGEX = /^[A-Za-z\s]+$/;
const PASSWORD_SPECIAL_REGEX = /[!@#$%^&*()_+={}[\]|\\:;"'<>,.?/~`-]/;

function validate(v: typeof INIT) {
  const e: Partial<typeof INIT> = {};
  if (!v.name) e.name = "Full name is required";
  else if (v.name.length < 2) e.name = "At least 2 characters";
  else if (!NAME_REGEX.test(v.name))
    e.name = "Full name must contain only alphabetic characters";

    if (!v.email) e.email = "Email is required";
    else if (!isValidEmail(v.email)) e.email = "Enter a valid email in lowercase (e.g. name@example.com)";

  if (!v.password) e.password = "Password is required";
  else if (v.password.length < 8) e.password = "At least 8 characters";
  else if (/\s/.test(v.password)) e.password = "Password cannot contain spaces";
  else if (!/[A-Z]/.test(v.password))
    e.password = "Include at least one uppercase letter";
  else if (!/[a-z]/.test(v.password))
    e.password = "Include at least one lowercase letter";
  else if (!/[0-9]/.test(v.password))
    e.password = "Include at least one number";
  else if (!PASSWORD_SPECIAL_REGEX.test(v.password))
    e.password = "Include at least one special character";

  if (!v.confirmPassword) e.confirmPassword = "Confirm your password";
  else if (v.confirmPassword !== v.password)
    e.confirmPassword = "Passwords do not match";
  return e;
}

export function SignUpForm() {
  const { signUp, googleSignIn } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const form = useForm(INIT, validate);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!form.validate()) return;
    setLoading(true);
    try {
      await signUp(form.values.name, form.values.email, form.values.password, form.values.confirmPassword);
      toast.success("Account created! Welcome.");
      navigate("/dashboard");
    } catch (err: unknown) {
      toast.error((err as Error).message ?? "Sign up failed", { id: "signup-error" });
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogleSuccess(idToken: string) {
    setGoogleLoading(true);
    try {
      await googleSignIn(idToken);
      toast.success("Account created! Welcome.");
      navigate("/dashboard");
    } catch (err: unknown) {
      toast.error((err as Error).message ?? "Google sign-up failed", { id: "google-signup-error" });
    } finally {
      setGoogleLoading(false);
    }
  }

  function handleGoogleError() {
    toast.error("Google sign-up was cancelled or failed", { id: "google-signup-error" });
  }

  return (
    <>

      <div style={{ marginBottom: 32 }}>
        <p
          style={{
            fontSize: 12,
            fontWeight: 600,
            color: "var(--color-brand)",
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            marginBottom: 10,
          }}
        >
          Get started free
        </p>
        <h2
          style={{
            fontSize: 30,
            fontWeight: 800,
            color: "var(--color-text-heading)",
            letterSpacing: "-0.03em",
            marginBottom: 8,
          }}
        >
          Create your account
        </h2>
        <p style={{ fontSize: 14, color: "var(--color-text-secondary)" }}>
          Start finding real estate buyers with AI today.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        style={{ display: "flex", flexDirection: "column", gap: 14 }}
      >
        <Input
          label="Full name"
          name="name"
          type="text"
          placeholder="Enter your full name"
          autoComplete="name"
          value={form.values.name}
          onChange={form.handleChange}
          onBlur={form.handleBlur}
          error={form.touched.name ? form.errors.name : undefined}
        />
        <Input
          label="Email address"
          name="email"
          type="email"
          placeholder="you@example.com"
          autoComplete="email"
          value={form.values.email}
          onChange={form.handleChange}
          onBlur={form.handleBlur}
          error={form.touched.email ? form.errors.email : undefined}
        />
        <Input
          label="Password"
          name="password"
          type="password"
          placeholder="Min. 8 characters"
          autoComplete="new-password"
          value={form.values.password}
          onChange={form.handleChange}
          onBlur={form.handleBlur}
          error={form.touched.password ? form.errors.password : undefined}
          hint="Must include uppercase, lowercase, a number and a symbol"
        />
        <Input
          label="Confirm password"
          name="confirmPassword"
          type="password"
          placeholder="Repeat your password"
          autoComplete="new-password"
          value={form.values.confirmPassword}
          onChange={form.handleChange}
          onBlur={form.handleBlur}
          error={
            form.touched.confirmPassword
              ? form.errors.confirmPassword
              : undefined
          }
        />
        <Button
          type="submit"
          fullWidth
          size="lg"
          loading={loading}
          iconRight={!loading ? <ArrowRight size={17} /> : undefined}
          style={{
            marginTop: 6,
            height: 54,
            fontSize: 16,
            fontWeight: 700,
            borderRadius: 12,
          }}
        >
          {loading ? "Creating account…" : "Create account"}
        </Button>
      </form>

      <AuthDivider label="or" />
      <GoogleButton
        label="Sign up with Google"
        onSuccess={handleGoogleSuccess}
        onError={handleGoogleError}
        disabled={loading || googleLoading}
      />
      <p
        style={{
          textAlign: "center",
          marginTop: 20,
          fontSize: 14,
          color: "var(--color-text-secondary)",
        }}
      >
        Already have an account?{" "}
        <Link
          to="/auth/signin"
          style={{
            color: "var(--color-brand)",
            fontWeight: 600,
            textDecoration: "none",
          }}
        >
          Sign in
        </Link>
      </p>
    </>
  );
}