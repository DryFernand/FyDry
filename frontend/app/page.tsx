import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import StatsBar from "@/components/StatsBar";
import BentoFeatures from "@/components/BentoFeatures";
import InteractiveCalculator from "@/components/InteractiveCalculator";
import ComparisonSection from "@/components/ComparisonSection";
import Pricing from "@/components/Pricing";
import FAQ from "@/components/FAQ";
import CTASection from "@/components/CTASection";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col bg-white text-zinc-900 selection:bg-zinc-900 selection:text-white">
      {/* 1. Header & Navigation */}
      <Navbar />

      {/* 2. Hero Section with Interactive Dashboard */}
      <main className="flex-1">
        <Hero />

        {/* 3. Social Proof & Key Metrics */}
        <StatsBar />

        {/* 4. Bento Grid Core Features */}
        <BentoFeatures />

        {/* 5. Interactive Expense & Savings Calculator */}
        <InteractiveCalculator />

        {/* 6. Comparison Table (Traditional vs FyDry) */}
        <ComparisonSection />

        {/* 7. Transparent Pricing Plans */}
        <Pricing />

        {/* 8. Frequently Asked Questions */}
        <FAQ />

        {/* 9. High-impact Final Call to Action */}
        <CTASection />
      </main>

      {/* 10. Footer */}
      <Footer />
    </div>
  );
}
