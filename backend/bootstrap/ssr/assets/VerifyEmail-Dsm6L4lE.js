import { jsxs, jsx } from "react/jsx-runtime";
import { useState } from "react";
import { useForm, Head } from "@inertiajs/react";
import { A as AppLayout } from "./AppLayout-cqhHu9rN.js";
import { MailCheck } from "lucide-react";
import "./api-Dp2ndEHF.js";
import "./PushNotificationPrompt-DvDsnr4H.js";
import "clsx";
import "sonner";
function VerifyEmail() {
  const { post, processing } = useForm({});
  const [resent, setResent] = useState(false);
  const resend = () => {
    post("/email/verification-notification", {
      onSuccess: () => setResent(true)
    });
  };
  return /* @__PURE__ */ jsxs(AppLayout, { title: "Verify email", children: [
    /* @__PURE__ */ jsx(Head, { title: "Verify your email" }),
    /* @__PURE__ */ jsxs("div", { className: "mx-auto max-w-md px-4 py-16 text-center", children: [
      /* @__PURE__ */ jsx(MailCheck, { className: "mx-auto mb-4 h-14 w-14 text-indigo-500" }),
      /* @__PURE__ */ jsx("h1", { className: "text-2xl font-bold text-gray-900 dark:text-white", children: "Verify your email" }),
      /* @__PURE__ */ jsx("p", { className: "mt-2 text-sm text-gray-500", children: "We sent a verification link to your email address. Open it to activate full account features. Links expire after 60 minutes." }),
      resent && /* @__PURE__ */ jsx("p", { className: "mt-4 rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700 dark:bg-green-950/40 dark:text-green-300", children: "A fresh verification link has been sent." }),
      /* @__PURE__ */ jsx(
        "button",
        {
          onClick: resend,
          disabled: processing,
          className: "mt-6 rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-60",
          children: processing ? "Sending…" : "Resend verification email"
        }
      ),
      /* @__PURE__ */ jsx("p", { className: "mt-6 text-xs text-gray-400", children: "Development note: with MAIL_MAILER=log the message is written to backend/storage/logs/laravel.log — copy the link from there." })
    ] })
  ] });
}
export {
  VerifyEmail as default
};
