// src/pages/contactPage.tsx
import { useState, type FormEvent } from "react";
import emailjs from "@emailjs/browser";
import { CheckCircle2, ChevronDown, Loader2 } from "lucide-react";
import { Navbar } from "@/pages/home/components/Navbar";

type Answer = string | string[];

const STATES = [
  "New South Wales", "Victoria", "Queensland", "South Australia",
  "Western Australia", "Tasmania", "Australian Capital Territory", "Northern Territory",
];

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const TIMES = ["8am–10am", "10am–12pm", "12pm–2pm", "2pm–4pm", "4pm–6pm", "6pm–8pm"];

const questions = [
  {
    id: "income",
    label: "What category of income do you earn?",
    sub: "Single or combined as a couple",
    type: "single",
    options: ["$120K – $150K", "$150K – $180K", "$180K+", "Below $120K"],
  },
  {
    id: "property_equity",
    label: "Do you own a property?",
    sub: "And if so, is there at least $300K equity available?",
    type: "single",
    options: ["Yes, with $300K+ equity", "Yes, but less than $300K equity", "No"],
  },
  {
    id: "deposit",
    label: "If you don't own a property, do you have a deposit saved?",
    sub: "$40K–$50K as a First Home Buyer · $80K+ as an Investor",
    type: "single",
    options: ["Yes – $40K–$50K (First Home Buyer)", "Yes – $80K+ (Investor)", "No / Not applicable"],
  },
  {
    id: "age",
    label: "What is your age range?",
    type: "single",
    options: ["18 – 29", "30 – 44", "45 – 59", "60+"],
  },
  {
    id: "super",
    label: "Do you have $230K or more in Superannuation?",
    type: "single",
    options: ["Yes", "No", "Unsure"],
  },
  {
    id: "state",
    label: "What State of Australia are you in?",
    type: "dropdown",
    options: STATES,
  },
  {
    id: "contact_day",
    label: "Best day to contact you",
    type: "multi",
    options: DAYS,
  },
  {
    id: "contact_time",
    label: "Best time to contact you",
    type: "multi",
    options: TIMES,
  },
  {
    id: "name",
    label: "Your full name",
    type: "text",
    placeholder: "e.g. Sarah Williams",
  },
  {
    id: "email",
    label: "Your email address",
    type: "text",
    placeholder: "e.g. sarah@example.com",
  },
  {
    id: "phone",
    label: "Your phone number",
    type: "text",
    placeholder: "e.g. 04XX XXX XXX",
  },
];

const EMAILJS_SERVICE_ID = "service_j04bg14";
const EMAILJS_TEMPLATE_ID = "template_hqwgj6x";
const EMAILJS_PUBLIC_KEY = "a86EnkBTiFCWDxu1F";
// Only letters, spaces, hyphens and apostrophes are valid in a name
// (covers names like "Anne-Marie" or "O'Brien").
const NAME_PATTERN = /^[A-Za-z\s'-]*$/;

// Basic but solid email shape check: something@something.tld
// (rejects plain numbers, missing @, missing domain, etc.)
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Australian phone numbers: 10 digits starting with 0 (e.g. 04XX XXX XXX).
const PHONE_PATTERN = /^0\d{9}$/;

export default function ContactPage() {
    const [answers, setAnswers] = useState<Record<string, Answer>>({});
    const [submitted, setSubmitted] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [sending, setSending] = useState(false);
    const [sendError, setSendError] = useState<string | null>(null);

  function setSingle(id: string, val: string) {
    setAnswers((a) => ({ ...a, [id]: val }));
    setErrors((e) => { const n = { ...e }; delete n[id]; return n; });
  }

  function toggleMulti(id: string, val: string) {
    setAnswers((a) => {
      const cur = (a[id] as string[]) || [];
      const next = cur.includes(val) ? cur.filter((v) => v !== val) : [...cur, val];
      return { ...a, [id]: next };
    });
    setErrors((e) => { const n = { ...e }; delete n[id]; return n; });
  }

  function setText(id: string, val: string) {
    // The name field should only ever contain letters, spaces, hyphens and
    // apostrophes — strip out anything else (digits, symbols) as it's typed
    // or pasted, so numeric input is never accepted in the first place.
    // The phone field should only ever contain digits — strip letters,
    // symbols and spaces as it's typed or pasted.
    let sanitized = val;
    let rejected = false;

    if (id === "name") {
      sanitized = val.replace(/[^A-Za-z\s'-]/g, "");
      rejected = sanitized !== val;
    }
    if (id === "phone") {
      const digitsOnly = val.replace(/\D/g, "");
      rejected = digitsOnly !== val; // true only if a non-digit was typed/pasted
      sanitized = digitsOnly.slice(0, 10);
    }

    setAnswers((a) => ({ ...a, [id]: sanitized }));
    setErrors((e) => {
      const n = { ...e };
      if (rejected && id === "name") {
        n[id] = "Name can only contain letters.";
      } else if (rejected && id === "phone") {
        n[id] = "Phone number can only contain digits.";
      } else {
        delete n[id];
      }
      return n;
    });
  }

  function validate() {
    const newErrors: Record<string, string> = {};
    for (const q of questions) {
      const val = answers[q.id];
      if (q.type === "text") {
        if (!val || !(val as string).trim()) {
          newErrors[q.id] = "This field is required.";
        } else if (q.id === "name" && !NAME_PATTERN.test(val as string)) {
          newErrors[q.id] = "Name can only contain letters.";
        } else if (q.id === "email" && !EMAIL_PATTERN.test((val as string).trim())) {
          newErrors[q.id] = "Please enter a valid email address (e.g. name@example.com).";
        } else if (q.id === "phone" && !PHONE_PATTERN.test((val as string).trim())) {
          newErrors[q.id] = "Please enter a valid 10-digit phone number (e.g. 04XX XXX XXX).";
        }
      } else if (q.type === "multi") {
        if (!val || (val as string[]).length === 0) newErrors[q.id] = "Please select at least one option.";
      } else {
        if (!val) newErrors[q.id] = "Please select an option.";
      }
    }
    return newErrors;
  }

  function buildDetailsHtml() {
    const rows = questions
      .map((q) => {
        const val = answers[q.id];
        const display = Array.isArray(val) ? val.join(", ") : val || "-";
        return `
          <tr>
            <td style="padding:10px 14px;background:#F8FAFC;border-bottom:1px solid #E2E8F0;font-size:13px;font-weight:600;color:#475569;width:40%;">
              ${q.label}
            </td>
            <td style="padding:10px 14px;background:#ffffff;border-bottom:1px solid #E2E8F0;font-size:13px;color:#1E293B;">
              ${display}
            </td>
          </tr>`;
      })
      .join("");

    return `<table style="width:100%;border-collapse:collapse;border:1px solid #E2E8F0;border-radius:8px;overflow:hidden;">${rows}</table>`;
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      const firstError = document.getElementById(`q-${Object.keys(errs)[0]}`);
      firstError?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    setSending(true);
    setSendError(null);

    try {
      await emailjs.send(
        EMAILJS_SERVICE_ID,
        EMAILJS_TEMPLATE_ID,
        {
          to_email: "olkevin099@gmail.com",
          lead_name: answers.name,
          lead_email: answers.email,
          lead_phone: answers.phone,
          submitted_at: new Date().toLocaleString("en-AU", {
            dateStyle: "medium",
            timeStyle: "short",
          }),
          details_html: buildDetailsHtml(),
        },
        EMAILJS_PUBLIC_KEY
      );
      setSubmitted(true);
    } catch (err) {
      console.error("Email send failed:", err);
      setSendError("Something went wrong sending your details. Please try again.");
    } finally {
      setSending(false);
    }
  }

  if (submitted) {
    return (
      <>
        <Navbar />
        <div className="min-h-[70vh] bg-slate-50 dark:bg-slate-950 flex items-center justify-center px-4 transition-colors">
          <div className="text-center max-w-md">
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/30">
              <CheckCircle2 size={40} className="text-emerald-600 dark:text-emerald-400" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-3">
              Thank you for reaching out!
            </h2>
            <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">
              We've received your details and will be in touch at your preferred time. One of our property specialists will review your profile and contact you shortly.
            </p>
            <button
              onClick={() => { setSubmitted(false); setAnswers({}); }}
              className="mt-8 inline-flex items-center gap-2 rounded-full bg-indigo-600 px-6 py-3 text-sm font-semibold text-white hover:bg-indigo-500 transition-colors"
            >
              Submit another response
            </button>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="bg-[radial-gradient(circle_at_top_left,_rgba(59,130,246,0.12),_transparent_35%),linear-gradient(135deg,_#f8fbff_0%,_#f4f6ff_50%,_#eef8ff_100%)] dark:bg-[radial-gradient(circle_at_top_left,_rgba(56,189,248,0.16),_transparent_30%),linear-gradient(135deg,_#020617_0%,_#0f172a_45%,_#111827_100%)] transition-colors">
        {/* Header */}
        <div className="border-b border-sky-100/80 bg-white/90 shadow-[0_10px_40px_rgba(14,116,144,0.08)] backdrop-blur dark:border-slate-800 dark:bg-slate-950/90 dark:shadow-[0_10px_40px_rgba(2,6,23,0.35)]">
          <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:py-12">
            <div className="inline-flex items-center gap-2 rounded-full border border-sky-200 bg-sky-50 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.3em] text-sky-700 dark:border-sky-900/40 dark:bg-sky-950/30 dark:text-sky-300">
              <span className="h-2 w-2 rounded-full bg-sky-500" />
              Lead Qualification
            </div>
            <h1 className="mt-4 text-3xl font-bold leading-tight text-slate-900 dark:text-white sm:text-4xl">
              Let's see if we're a good fit.
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-600 dark:text-slate-300 sm:text-base">
              Answer a few quick questions so our property specialists can understand your situation and reach out at the right time.
            </p>
            <div className="mt-6 flex flex-wrap items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
              <span className="rounded-full bg-sky-50 px-3 py-1.5 text-sky-700 shadow-sm dark:bg-sky-950/40 dark:text-sky-300">⏱ Takes about 2 minutes</span>
              <span className="rounded-full bg-indigo-50 px-3 py-1.5 text-indigo-700 shadow-sm dark:bg-indigo-950/40 dark:text-indigo-300">🔒 Your information is private</span>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} noValidate>
          <div className="mx-auto max-w-4xl px-4 sm:px-6 py-10 space-y-8">

            {questions.map((q, idx) => (
              <div
                key={q.id}
                id={`q-${q.id}`}
                className="rounded-[24px] border border-slate-200/80 bg-gradient-to-br from-white via-sky-50/80 to-indigo-50/90 p-4 shadow-[0_18px_45px_rgba(15,23,42,0.08)] ring-1 ring-slate-100/80 dark:border-slate-800 dark:from-slate-900 dark:via-slate-900 dark:to-slate-900/90 dark:shadow-[0_18px_45px_rgba(2,6,23,0.45)] dark:ring-slate-800/70 sm:p-6"
              >
                {/* Question label */}
                <div className="mb-4">
                  <div className="flex items-start gap-3">
                    <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-indigo-100 dark:bg-indigo-900/40 text-xs font-bold text-indigo-600 dark:text-indigo-400">
                      {idx + 1}
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 leading-snug">
                        {q.label}
                      </p>
                      {"sub" in q && q.sub && (
                        <p className="mt-0.5 text-xs text-slate-400 dark:text-slate-500">{q.sub}</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Single select */}
                {q.type === "single" && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:ml-9">
                    {q.options!.map((opt) => {
                      const selected = answers[q.id] === opt;
                      return (
                        <button
                          key={opt}
                          type="button"
                          onClick={() => setSingle(q.id, opt)}
                          className={`rounded-xl border px-4 py-3 text-left text-sm font-medium transition-all ${
                            selected
                              ? "border-sky-500 bg-gradient-to-r from-sky-600 to-indigo-600 text-white shadow-lg shadow-sky-500/25"
                              : "border-slate-200 bg-white text-slate-700 hover:border-sky-300 hover:bg-sky-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:border-sky-500 dark:hover:bg-slate-700"
                          }`}
                        >
                          <span className="flex items-center gap-2">
                            <span className={`h-4 w-4 rounded-full border-2 flex items-center justify-center shrink-0 ${
                              selected ? "border-indigo-500 bg-indigo-500" : "border-slate-300 dark:border-slate-600"
                            }`}>
                              {selected && <span className="h-1.5 w-1.5 rounded-full bg-white" />}
                            </span>
                            {opt}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* Multi select */}
                {q.type === "multi" && (
                  <div className="flex flex-wrap gap-2 sm:ml-9">
                    {q.options!.map((opt) => {
                      const selected = ((answers[q.id] as string[]) || []).includes(opt);
                      return (
                        <button
                          key={opt}
                          type="button"
                          onClick={() => toggleMulti(q.id, opt)}
                          className={`rounded-full border px-4 py-2 text-xs font-semibold transition-all ${
                            selected
                              ? "border-sky-500 bg-gradient-to-r from-sky-600 to-indigo-600 text-white shadow-sm shadow-sky-500/25"
                              : "border-slate-200 bg-white text-slate-600 hover:border-sky-300 hover:bg-sky-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:border-sky-500 dark:hover:bg-slate-700"
                          }`}
                        >
                          {opt}
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* Dropdown */}
                {q.type === "dropdown" && (
                  <div className="sm:ml-9 relative">
                    <select
                      value={(answers[q.id] as string) || ""}
                      onChange={(e) => setSingle(q.id, e.target.value)}
                      className="w-full appearance-none rounded-xl border border-slate-200 bg-white px-4 py-3 pr-10 text-sm text-slate-700 transition-colors focus:outline-none focus:ring-2 focus:ring-sky-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                    >
                      <option value="" disabled>Select your state…</option>
                      {q.options!.map((opt) => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                    <ChevronDown size={16} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  </div>
                )}

                {/* Text input */}
                {q.type === "text" && (
                  <div className="sm:ml-9">
                    <input
                      type={q.id === "email" ? "email" : q.id === "phone" ? "tel" : "text"}
                      value={(answers[q.id] as string) || ""}
                      onChange={(e) => setText(q.id, e.target.value)}
                      placeholder={"placeholder" in q ? q.placeholder : ""}
                      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 transition-colors placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:placeholder:text-slate-500"
                    />
                  </div>
                )}

                {/* Error */}
                {errors[q.id] && (
                  <p className="sm:ml-9 mt-2 text-xs text-red-500 dark:text-red-400">{errors[q.id]}</p>
                )}
              </div>
            ))}

            {/* Submit */}
            <div className="pb-10">
              {sendError && (
                <p className="mb-3 text-center text-sm text-red-500">{sendError}</p>
              )}
              <button
                type="submit"
                disabled={sending}
                className="w-full flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-sky-600 via-cyan-500 to-indigo-600 px-8 py-4 text-sm font-bold text-white shadow-[0_16px_35px_rgba(14,116,144,0.28)] transition-all hover:scale-[1.01] hover:from-sky-500 hover:via-cyan-400 hover:to-indigo-500 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {sending ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Sending…
                  </>
                ) : (
                  "Submit my details →"
                )}
              </button>
              <p className="mt-3 text-center text-xs text-slate-400 dark:text-slate-500">
                By submitting you agree that we may contact you about property investment opportunities.
              </p>
            </div>
          </div>
        </form>
      </div>
    </>
  );
}