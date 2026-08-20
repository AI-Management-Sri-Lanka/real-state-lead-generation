// src/pages/contactPage.tsx
import { useState, type FormEvent } from "react";
import { useFormik } from "formik";
import emailjs from "@emailjs/browser";
import { load as parseYaml } from "js-yaml";
import { CheckCircle2, ChevronDown, Loader2 } from "lucide-react";
import { Navbar } from "@/pages/home/components/Navbar";
import { Footer } from "@/pages/home/components/Footer";
import recipientsRaw from "@/config/recipients.yaml?raw";
import { BASE_URL } from "@/api/config";

type Answer = string | string[];
type FormValues = Record<string, Answer>;

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
    options: ["$120K – $150K", "$150K – $180K", "$180K+", "Under $120,000"],
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
    placeholder: "e.g. 0412345678",
  },
];

const EMAILJS_SERVICE_ID = "service_j04bg14";
const EMAILJS_TEMPLATE_ID = "template_hqwgj6x";
const EMAILJS_PUBLIC_KEY = "a86EnkBTiFCWDxu1F";

// Fallback used only if recipients.yaml is missing, empty, or malformed,
// so a bad YAML edit can never silently break lead notifications.
const FALLBACK_RECIPIENT = "olkevin099@gmail.com";

interface RecipientsConfig {
  recipients: string[];
}

// Loads and validates the recipient list from src/config/recipients.yaml.
// Returns a comma-separated string, which is the format EmailJS expects
// in a "To email" template field for sending to multiple addresses.
function loadRecipients(): string {
  try {
    const parsed = parseYaml(recipientsRaw) as RecipientsConfig;
    const list = parsed?.recipients;

    if (!Array.isArray(list) || list.length === 0) {
      throw new Error("recipients.yaml must contain a non-empty 'recipients' list");
    }

    const cleaned = list
      .map((addr) => (typeof addr === "string" ? addr.trim() : ""))
      .filter((addr) => EMAIL_PATTERN.test(addr));

    if (cleaned.length === 0) {
      throw new Error("recipients.yaml contained no valid email addresses");
    }

    return cleaned.join(",");
  } catch (err) {
    console.error("Failed to load recipients.yaml, falling back to default recipient:", err);
    return FALLBACK_RECIPIENT;
  }
}

// Must start with a letter, then 1–49 more letters/spaces/hyphens/apostrophes
// (covers names like "Anne-Marie" or "O'Brien", 2–50 chars total).
const NAME_PATTERN = /^[A-Za-z][A-Za-z\s'-]{1,49}$/;

// Lowercase only: local part, domain labels, and TLD must not contain capital letters.
const EMAIL_PATTERN = /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/;

// Mobile (04XX XXX XXX) or landline (0[2378] XXXX XXXX), domestic "0..." or
// international "+61.../61..." form.
const PHONE_PATTERN = /^(?:\+?61|0)[2-478]\d{8}$/;

// Resolved once per page load from recipients.yaml.
const TO_EMAILS = loadRecipients();


const initialValues: FormValues = questions.reduce((acc, q) => {
  acc[q.id] = q.type === "multi" ? [] : "";
  return acc;
}, {} as FormValues);

function validate(values: FormValues) {
  const newErrors: Record<string, string> = {};
  for (const q of questions) {
    const val = values[q.id];
    if (q.type === "text") {
      if (!val || !(val as string).trim()) {
        newErrors[q.id] = "This field is required.";
      } else if (q.id === "name" && !NAME_PATTERN.test((val as string).trim())) {
        newErrors[q.id] = "Please enter a valid name (letters only, 2–50 characters).";
      } else if (q.id === "email" && !EMAIL_PATTERN.test((val as string).trim())) {
        newErrors[q.id] = "Please enter a valid email address in lowercase (e.g. name@example.com).";
      } else if (q.id === "phone" && !PHONE_PATTERN.test((val as string).trim())) {
        newErrors[q.id] = "Please enter a valid phone number (e.g. 0412345678).";
      }
    } else if (q.type === "multi") {
      if (!val || (val as string[]).length === 0) newErrors[q.id] = "Please select at least one option.";
    } else {
      if (!val) newErrors[q.id] = "Please select an option.";
    }
  }
  return newErrors;
}

function buildDetailsHtml(answers: FormValues) {
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

export default function ContactPage() {
  const [submitted, setSubmitted] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);

  const formik = useFormik<FormValues>({
    initialValues,
    validate,
    validateOnChange: true,
    validateOnBlur: true,
    onSubmit: async (values, { setSubmitting, resetForm }) => {
      setSendError(null);
      try {
        await emailjs.send(
          EMAILJS_SERVICE_ID,
          EMAILJS_TEMPLATE_ID,
          {
            to_email: "olkevin099@gmail.com",
            lead_name: values.name,
            lead_email: values.email,
            lead_phone: values.phone,
            submitted_at: new Date().toLocaleString("en-AU", {
              dateStyle: "medium",
              timeStyle: "short",
            }),
            details_html: buildDetailsHtml(values),
          },
          EMAILJS_PUBLIC_KEY
        );

        // Build a text summary of answers for the DB message field
        const answersSummary = questions
          .filter(q => q.id !== 'name' && q.id !== 'email' && q.id !== 'phone')
          .map(q => {
            const val = values[q.id];
            const display = Array.isArray(val) ? val.join(", ") : val || "-";
            return `${q.label}: ${display}`;
          })
          .join("\n");

        const inquiryPayload = {
          name: typeof values.name === 'string' ? values.name.trim() : values.name.join(", "),
          email: typeof values.email === 'string' ? values.email.trim() : values.email.join(", "),
          phone: typeof values.phone === 'string' ? values.phone.trim() || undefined : undefined,
          message: answersSummary,
          source: "contact_page"
        };

        const res = await fetch(`${BASE_URL}/inquiries`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(inquiryPayload),
        });
        if (!res.ok) throw new Error("Failed to save contact inquiry to database");

        setSubmitted(true);
        resetForm();
      } catch (err) {
        console.error("Email send failed:", err);
        setSendError("Something went wrong sending your details. Please try again.");
      } finally {
        setSubmitting(false);
      }
    },
  });

  const { values, errors, touched, setFieldValue, setFieldTouched, handleSubmit, isSubmitting, submitCount } = formik;

  const setSingle = (id: string, value: string) => {
    setFieldValue(id, value);
    setFieldTouched(id, true, false);
  };

  const toggleMulti = (id: string, option: string) => {
    const current = (values[id] as string[]) || [];
    if (current.includes(option)) {
      setFieldValue(id, current.filter(v => v !== option));
    } else {
      setFieldValue(id, [...current, option]);
    }
    setFieldTouched(id, true, false);
  };

  const setText = (id: string, value: string) => {
    setFieldValue(id, value);
    setFieldTouched(id, true, false);
  };

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
              onClick={() => setSubmitted(false)}
              className="mt-8 inline-flex items-center gap-2 rounded-full bg-indigo-600 px-6 py-3 text-sm font-semibold text-white hover:bg-indigo-500 transition-colors"
            >
              Submit another response
            </button>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="bg-[radial-gradient(circle_at_top_left,_rgba(59,130,246,0.12),_transparent_35%),linear-gradient(135deg,_#f8fbff_0%,_#f4f6ff_50%,_#eef8ff_100%)] dark:bg-[radial-gradient(circle_at_top_left,_rgba(56,189,248,0.16),_transparent_30%),linear-gradient(135deg,_#020617_0%,_#0f172a_45%,_#111827_100%)] transition-colors">
        {/* Header */}
        <div className="border-b border-sky-100/80 bg-white/90 shadow-[0_10px_40px_rgba(14,116,144,0.08)] backdrop-blur dark:border-slate-800 dark:bg-slate-950/90 dark:shadow-[0_10px_40px_rgba(2,6,23,0.35)]">
          <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8 lg:py-12">
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
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-10 space-y-8">

            {questions.map((q, idx) => {
              const showError = (touched[q.id] || submitCount > 0) && errors[q.id];

              return (
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
                        const selected = values[q.id] === opt;
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
                        const selected = ((values[q.id] as string[]) || []).includes(opt);
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
                        value={(values[q.id] as string) || ""}
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
                        inputMode={q.id === "phone" ? "tel" : undefined}
                        pattern={
                          q.id === "phone"
                            ? "(\\+?61|0)[2-478]\\d{8}"
                            : q.id === "name"
                            ? "[A-Za-z\\s'-]+"
                            : undefined
                        }
                        maxLength={q.id === "phone" ? 12 : q.id === "name" ? 50 : undefined}
                        autoComplete={
                          q.id === "name" ? "name" : q.id === "email" ? "email" : q.id === "phone" ? "tel" : "off"
                        }
                        value={(values[q.id] as string) || ""}
                        onChange={(e) => setText(q.id, e.target.value)}
                        onBlur={() => setFieldTouched(q.id, true)}
                        placeholder={"placeholder" in q ? q.placeholder : ""}
                        className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 transition-colors placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:placeholder:text-slate-500"
                      />
                    </div>
                  )}

                  {/* Error */}
                  {showError && (
                    <p className="sm:ml-9 mt-2 text-xs text-red-500 dark:text-red-400">{errors[q.id]}</p>
                  )}
                </div>
              );
            })}

            {/* Submit */}
            <div className="pb-10">
              {sendError && (
                <p className="mb-3 text-center text-sm text-red-500">{sendError}</p>
              )}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-sky-600 via-cyan-500 to-indigo-600 px-8 py-4 text-sm font-bold text-white shadow-[0_16px_35px_rgba(14,116,144,0.28)] transition-all hover:scale-[1.01] hover:from-sky-500 hover:via-cyan-400 hover:to-indigo-500 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSubmitting ? (
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
      <Footer />
    </>
  );
}