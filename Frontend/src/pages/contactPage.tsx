// src/pages/contactPage.tsx
import { useState } from "react";
import { CheckCircle2, ChevronDown } from "lucide-react";
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

// Only letters, spaces, hyphens and apostrophes are valid in a name
// (covers names like "Anne-Marie" or "O'Brien").
const NAME_PATTERN = /^[A-Za-z\s'-]*$/;

// Basic but solid email shape check: something@something.tld
// (rejects plain numbers, missing @, missing domain, etc.)
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function ContactPage() {
  const [answers, setAnswers] = useState<Record<string, Answer>>({});
  const [submitted, setSubmitted] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

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
    const sanitized = id === "name" ? val.replace(/[^A-Za-z\s'-]/g, "") : val;
    setAnswers((a) => ({ ...a, [id]: sanitized }));
    setErrors((e) => { const n = { ...e }; delete n[id]; return n; });
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
        }
      } else if (q.type === "multi") {
        if (!val || (val as string[]).length === 0) newErrors[q.id] = "Please select at least one option.";
      } else {
        if (!val) newErrors[q.id] = "Please select an option.";
      }
    }
    return newErrors;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      const firstError = document.getElementById(`q-${Object.keys(errs)[0]}`);
      firstError?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    setSubmitted(true);
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
      <div className="bg-slate-50 dark:bg-slate-950 transition-colors">
        {/* Header */}
        <div className=" bg-white dark:bg-slate-950">
          <div className="mx-auto max-w-4xl px-4 sm:px-6 py-10">
            <p className="text-xs font-semibold uppercase tracking-widest text-indigo-600 dark:text-indigo-400 mb-2">
              Lead Qualification
            </p>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white leading-tight">
              Let's see if we're a good fit.
            </h1>
            <p className="mt-3 text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
              Answer a few quick questions so our property specialists can understand your situation and reach out at the right time.
            </p>
            <div className="mt-5 flex items-center gap-4 text-xs text-slate-400 dark:text-slate-500">
              <span>⏱ Takes about 2 minutes</span>
              <span>·</span>
              <span>🔒 Your information is private</span>
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
                className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 sm:p-6"
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
                              ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300"
                              : "border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:border-indigo-300 dark:hover:border-indigo-600 hover:bg-indigo-50/50 dark:hover:bg-indigo-900/10"
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
                              ? "border-indigo-500 bg-indigo-600 text-white"
                              : "border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:border-indigo-300 dark:hover:border-indigo-600"
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
                      className="w-full appearance-none rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-4 py-3 pr-10 text-sm text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors"
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
                      className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-4 py-3 text-sm text-slate-700 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors"
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
              <button
                type="submit"
                className="w-full rounded-2xl bg-indigo-600 px-8 py-4 text-sm font-bold text-white hover:bg-indigo-500 active:scale-[0.99] transition-all shadow-lg shadow-indigo-500/20"
              >
                Submit my details →
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