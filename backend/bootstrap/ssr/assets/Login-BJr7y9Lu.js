import { jsxs, jsx, Fragment } from "react/jsx-runtime";
import { useState } from "react";
import { useForm, Head, Link } from "@inertiajs/react";
import { A as AuthLayout } from "./AuthLayout-DeaGJlL3.js";
import { a as api } from "./api-Dp2ndEHF.js";
import { ArrowLeft, Shield, Mail, Lock, Loader2, User } from "lucide-react";
function Login() {
  const [activeTab, setActiveTab] = useState("login");
  const [otpChannel, setOtpChannel] = useState("phone");
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [otpTarget, setOtpTarget] = useState("");
  const [otpInput, setOtpInput] = useState("");
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpError, setOtpError] = useState("");
  const loginForm = useForm({ email: "", password: "", remember: false });
  const signupForm = useForm({ name: "", email: "", password: "", password_confirmation: "" });
  const requestOtp = async (target) => {
    const trimmed = target.trim();
    if (otpChannel === "email" ? !trimmed.includes("@") : trimmed.length < 7) {
      setOtpError(otpChannel === "email" ? "Enter a valid email first" : "Enter a valid phone number first");
      return;
    }
    setOtpLoading(true);
    setOtpError("");
    try {
      const path = otpChannel === "email" ? "/api/auth/otp/email/request" : "/api/auth/otp/request";
      const body = otpChannel === "email" ? { email: trimmed } : { phone: trimmed };
      await api.post(path, body);
      setOtpTarget(trimmed);
      setOtpSent(true);
    } catch {
      setOtpError("Could not send OTP. Try again.");
    } finally {
      setOtpLoading(false);
    }
  };
  const verifyOtp = async () => {
    const code = otp.join("");
    if (code.length !== 6) {
      setOtpError("Enter all 6 digits");
      return;
    }
    setOtpLoading(true);
    setOtpError("");
    try {
      const path = otpChannel === "email" ? "/api/auth/otp/email/verify" : "/api/auth/otp/verify";
      const body = otpChannel === "email" ? { email: otpTarget, code } : { phone: otpTarget, code };
      await api.post(path, body);
      window.location.href = "/dashboard";
    } catch {
      setOtpError("Invalid or expired code");
    } finally {
      setOtpLoading(false);
    }
  };
  const setDigit = (index, value) => {
    var _a;
    const digit = value.replace(/\D/g, "").slice(-1);
    setOtp((prev) => {
      const next = [...prev];
      next[index] = digit;
      return next;
    });
    if (digit && index < 5) {
      (_a = document.getElementById(`otp-${index + 1}`)) == null ? void 0 : _a.focus();
    }
  };
  return /* @__PURE__ */ jsxs(AuthLayout, { title: "everythingneed.com", description: "Your one-stop platform for all human needs", children: [
    /* @__PURE__ */ jsx(Head, { title: "Log in" }),
    /* @__PURE__ */ jsxs(Link, { href: "/dashboard", className: "mb-4 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors", children: [
      /* @__PURE__ */ jsx(ArrowLeft, { className: "h-4 w-4" }),
      "Back to Home"
    ] }),
    /* @__PURE__ */ jsx("div", { className: "mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10", children: /* @__PURE__ */ jsx(Shield, { className: "h-6 w-6 text-primary" }) }),
    /* @__PURE__ */ jsx("div", { className: "mb-6 grid w-full grid-cols-3 rounded-lg bg-muted p-1", children: ["login", "signup", "otp"].map((t) => /* @__PURE__ */ jsx(
      "button",
      {
        type: "button",
        onClick: () => setActiveTab(t),
        className: `rounded-md px-3 py-2 text-sm font-medium transition-colors ${activeTab === t ? "bg-card text-foreground shadow" : "text-muted-foreground"}`,
        children: t === "login" ? "Sign In" : t === "signup" ? "Sign Up" : "OTP"
      },
      t
    )) }),
    activeTab === "login" && /* @__PURE__ */ jsxs(
      "form",
      {
        onSubmit: (e) => {
          e.preventDefault();
          loginForm.post("/login");
        },
        className: "space-y-4",
        children: [
          /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
            /* @__PURE__ */ jsx("label", { htmlFor: "login-email", className: "text-sm font-medium", children: "Email" }),
            /* @__PURE__ */ jsxs("div", { className: "relative", children: [
              /* @__PURE__ */ jsx(Mail, { className: "absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" }),
              /* @__PURE__ */ jsx(
                "input",
                {
                  id: "login-email",
                  type: "email",
                  placeholder: "Enter your email",
                  value: loginForm.data.email,
                  onChange: (e) => loginForm.setData("email", e.target.value),
                  className: "h-10 w-full rounded-md border border-input bg-background pl-10 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                }
              )
            ] }),
            loginForm.errors.email && /* @__PURE__ */ jsx("p", { className: "text-sm text-destructive", children: loginForm.errors.email })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
            /* @__PURE__ */ jsx("label", { htmlFor: "login-password", className: "text-sm font-medium", children: "Password" }),
            /* @__PURE__ */ jsxs("div", { className: "relative", children: [
              /* @__PURE__ */ jsx(Lock, { className: "absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" }),
              /* @__PURE__ */ jsx(
                "input",
                {
                  id: "login-password",
                  type: "password",
                  placeholder: "Enter your password",
                  value: loginForm.data.password,
                  onChange: (e) => loginForm.setData("password", e.target.value),
                  className: "h-10 w-full rounded-md border border-input bg-background pl-10 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                }
              )
            ] }),
            loginForm.errors.password && /* @__PURE__ */ jsx("p", { className: "text-sm text-destructive", children: loginForm.errors.password })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between text-sm", children: [
            /* @__PURE__ */ jsxs("label", { className: "flex items-center gap-2", children: [
              /* @__PURE__ */ jsx(
                "input",
                {
                  type: "checkbox",
                  checked: loginForm.data.remember,
                  onChange: (e) => loginForm.setData("remember", e.target.checked),
                  className: "rounded border-input"
                }
              ),
              "Remember me"
            ] }),
            /* @__PURE__ */ jsx(Link, { href: "/forgot-password", className: "text-primary hover:underline", children: "Forgot password?" })
          ] }),
          /* @__PURE__ */ jsxs(
            "button",
            {
              type: "submit",
              disabled: loginForm.processing,
              className: "flex h-10 w-full items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50",
              children: [
                loginForm.processing ? /* @__PURE__ */ jsx(Loader2, { className: "mr-2 h-4 w-4 animate-spin" }) : null,
                "Sign In"
              ]
            }
          )
        ]
      }
    ),
    activeTab === "signup" && /* @__PURE__ */ jsxs(
      "form",
      {
        onSubmit: (e) => {
          e.preventDefault();
          signupForm.post("/register");
        },
        className: "space-y-4",
        children: [
          /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
            /* @__PURE__ */ jsx("label", { htmlFor: "signup-name", className: "text-sm font-medium", children: "Full Name" }),
            /* @__PURE__ */ jsxs("div", { className: "relative", children: [
              /* @__PURE__ */ jsx(User, { className: "absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" }),
              /* @__PURE__ */ jsx(
                "input",
                {
                  id: "signup-name",
                  type: "text",
                  placeholder: "Enter your full name",
                  value: signupForm.data.name,
                  onChange: (e) => signupForm.setData("name", e.target.value),
                  className: "h-10 w-full rounded-md border border-input bg-background pl-10 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                }
              )
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
            /* @__PURE__ */ jsx("label", { htmlFor: "signup-email", className: "text-sm font-medium", children: "Email" }),
            /* @__PURE__ */ jsxs("div", { className: "relative", children: [
              /* @__PURE__ */ jsx(Mail, { className: "absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" }),
              /* @__PURE__ */ jsx(
                "input",
                {
                  id: "signup-email",
                  type: "email",
                  placeholder: "Enter your email",
                  value: signupForm.data.email,
                  onChange: (e) => signupForm.setData("email", e.target.value),
                  className: "h-10 w-full rounded-md border border-input bg-background pl-10 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                }
              )
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
            /* @__PURE__ */ jsx("label", { htmlFor: "signup-password", className: "text-sm font-medium", children: "Password" }),
            /* @__PURE__ */ jsxs("div", { className: "relative", children: [
              /* @__PURE__ */ jsx(Lock, { className: "absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" }),
              /* @__PURE__ */ jsx(
                "input",
                {
                  id: "signup-password",
                  type: "password",
                  placeholder: "Create a password",
                  value: signupForm.data.password,
                  onChange: (e) => signupForm.setData("password", e.target.value),
                  className: "h-10 w-full rounded-md border border-input bg-background pl-10 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                }
              )
            ] })
          ] }),
          /* @__PURE__ */ jsx(
            "button",
            {
              type: "submit",
              disabled: signupForm.processing,
              className: "flex h-10 w-full items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50",
              children: "Sign Up"
            }
          )
        ]
      }
    ),
    activeTab === "otp" && /* @__PURE__ */ jsxs("div", { className: "space-y-4", children: [
      !otpSent ? /* @__PURE__ */ jsxs(Fragment, { children: [
        /* @__PURE__ */ jsx("div", { className: "grid w-full grid-cols-2 rounded-lg bg-muted p-1", children: ["phone", "email"].map((c) => /* @__PURE__ */ jsx(
          "button",
          {
            type: "button",
            onClick: () => {
              setOtpChannel(c);
              setOtpError("");
            },
            className: `rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${otpChannel === c ? "bg-card text-foreground shadow" : "text-muted-foreground"}`,
            children: c === "phone" ? "Phone" : "Email"
          },
          c
        )) }),
        /* @__PURE__ */ jsx("p", { className: "text-xs text-muted-foreground", children: "No SMS or mail is sent — your code is issued instantly for testing." }),
        /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
          /* @__PURE__ */ jsx("label", { htmlFor: "otp-target", className: "text-sm font-medium", children: otpChannel === "email" ? "Email" : "Phone" }),
          /* @__PURE__ */ jsxs("div", { className: "relative", children: [
            /* @__PURE__ */ jsx(Mail, { className: "absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" }),
            /* @__PURE__ */ jsx(
              "input",
              {
                id: "otp-target",
                type: otpChannel === "email" ? "email" : "tel",
                placeholder: otpChannel === "email" ? "Enter your email" : "Enter your phone (e.g. +15551234567)",
                value: otpInput,
                onChange: (e) => setOtpInput(e.target.value),
                className: "h-10 w-full rounded-md border border-input bg-background pl-10 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              }
            )
          ] })
        ] }),
        /* @__PURE__ */ jsxs(
          "button",
          {
            type: "button",
            disabled: otpLoading,
            onClick: () => void requestOtp(otpInput),
            className: "flex h-10 w-full items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50",
            children: [
              otpLoading ? /* @__PURE__ */ jsx(Loader2, { className: "mr-2 h-4 w-4 animate-spin" }) : null,
              "Send OTP"
            ]
          }
        )
      ] }) : /* @__PURE__ */ jsxs(Fragment, { children: [
        /* @__PURE__ */ jsxs("p", { className: "text-sm text-muted-foreground", children: [
          "Verify Your Login — OTP sent to ",
          otpTarget
        ] }),
        /* @__PURE__ */ jsx("div", { className: "flex justify-center gap-2", children: otp.map((digit, index) => /* @__PURE__ */ jsx(
          "input",
          {
            id: `otp-${index}`,
            value: digit,
            onChange: (e) => setDigit(index, e.target.value),
            maxLength: 1,
            inputMode: "numeric",
            className: "h-12 w-11 text-center text-lg font-semibold rounded-md border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring"
          },
          index
        )) }),
        /* @__PURE__ */ jsxs(
          "button",
          {
            type: "button",
            disabled: otpLoading,
            onClick: () => void verifyOtp(),
            className: "flex h-10 w-full items-center justify-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50",
            children: [
              /* @__PURE__ */ jsx(Shield, { className: "h-4 w-4" }),
              "Verify OTP"
            ]
          }
        ),
        /* @__PURE__ */ jsx(
          "button",
          {
            type: "button",
            onClick: () => setOtpSent(false),
            className: "w-full text-center text-xs text-muted-foreground hover:text-foreground",
            children: "Resend code (60s)"
          }
        )
      ] }),
      otpError && /* @__PURE__ */ jsx("p", { className: "text-sm text-destructive", children: otpError })
    ] })
  ] });
}
export {
  Login as default
};
