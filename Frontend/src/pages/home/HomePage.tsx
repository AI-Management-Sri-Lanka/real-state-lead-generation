// src/pages/home/HomePage.tsx
// ─────────────────────────────────────────────────────────────────────────────
// Page: Home (Landing)
// Sections: Navbar, Hero, Features, HowItWorks, Pricing, Testimonials, CTA, Footer
// ─────────────────────────────────────────────────────────────────────────────
import { useState } from "react";
import { Navbar } from "./components/Navbar";
import { HeroSection } from "./components/HeroSection";
import { Footer } from "./components/Footer";

export default function HomePage() {
  return (
    <div
      className="home-root"
      style={{ minHeight: "100vh", fontFamily: "var(--font-sans)" }}
    >
      <Navbar />
      <HeroSection />
      <Footer />
    </div>
  );
}
