import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema, type LoginForm } from "@ams/schemas";
import { Button, Input } from "@ams/ui";
import { useMutation } from "@tanstack/react-query";
import { Building2, Eye, EyeOff, LockKeyhole, Mail } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { authApi } from "../../../app/api/client";
import { useAuth } from "../../../app/auth/AuthProvider";

export function LoginPage() {
  const navigate = useNavigate();
  const { setUser } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const form = useForm<LoginForm>({ resolver: zodResolver(loginSchema), defaultValues: { email: "", password: "" } });
  const login = useMutation({
    mutationFn: authApi.login,
    onSuccess: (data) => {
      setUser(data.user);
      toast.success("Signed in successfully");
      navigate("/dashboard");
    },
    onError: () => toast.error("Unable to sign in")
  });
  const submit = form.handleSubmit((values) => login.mutate(values));

  return (
    <main className="grid min-h-screen grid-cols-1 bg-white lg:grid-cols-[1fr_480px]">
      <section className="hidden items-end bg-[linear-gradient(135deg,#1E40AF,#3B82F6_55%,#06B6D4)] p-12 text-white lg:flex">
        <div className="max-w-2xl pb-10">
          <div className="mb-8 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/15 ring-1 ring-white/20"><Building2 size={28} /></div>
          <h1 className="max-w-xl text-5xl font-bold tracking-normal">Apartment Management System</h1>
          <p className="mt-5 max-w-xl text-base leading-7 text-white/85">Super admin workspace for residents, units, visitors, complaints, finance, staff, amenities, assets, and compliance.</p>
          <div className="mt-10 grid max-w-xl grid-cols-3 gap-3">
            {["Live database", "JWT secured", "Role based"].map((item) => (
              <div key={item} className="rounded-xl bg-white/10 p-4 text-sm font-semibold ring-1 ring-white/15">{item}</div>
            ))}
          </div>
        </div>
      </section>
      <section className="flex items-center justify-center p-5">
        <div className="w-full max-w-md">
          <div className="mb-8 lg:hidden">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600 text-white"><Building2 /></div>
            <h1 className="text-2xl font-bold text-gray-950">AMS</h1>
          </div>
          <div>
            <p className="text-sm font-semibold uppercase text-blue-600">Welcome back</p>
            <h2 className="mt-2 text-3xl font-bold text-gray-950">Sign in to AMS</h2>
            <p className="mt-2 text-sm text-gray-500">Use your AMS credentials to continue.</p>
          </div>
          <div className="mt-8 space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-gray-700">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 text-gray-400" size={16} />
                <Input className="pl-9" type="email" autoComplete="email" {...form.register("email")} />
              </div>
              <p className="mt-1 text-xs text-red-600">{form.formState.errors.email?.message}</p>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-gray-700">Password</label>
              <div className="relative">
                <LockKeyhole className="absolute left-3 top-3 text-gray-400" size={16} />
                <Input className="pl-9 pr-10" type={showPassword ? "text" : "password"} autoComplete="current-password" {...form.register("password")} />
                <button type="button" className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-700" onClick={() => setShowPassword((value) => !value)} title={showPassword ? "Hide password" : "Show password"}>
                  {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
              <p className="mt-1 text-xs text-red-600">{form.formState.errors.password?.message}</p>
            </div>
            <div className="flex items-center justify-between text-sm">
              <label className="inline-flex items-center gap-2 text-gray-600">
                <input type="checkbox" className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                Remember me
              </label>
              <button type="button" className="font-semibold text-blue-600 hover:text-blue-700">Forgot password?</button>
            </div>
            {login.isError ? <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">Invalid user or password. Please check the credentials and try again.</p> : null}
            <Button className="h-11 w-full" disabled={login.isPending} onClick={() => void submit()}>
              {login.isPending ? "Signing in..." : "Sign In"}
            </Button>
          </div>
          <p className="mt-8 text-center text-xs text-gray-400">2026 AMS. Secure society operations console.</p>
        </div>
      </section>
    </main>
  );
}
