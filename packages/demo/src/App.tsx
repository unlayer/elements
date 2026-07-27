import { useEffect, useState } from "react";
import Hero from "./sections/Hero";
import QuickStart from "./sections/QuickStart";
import TemplateShowcase from "./sections/TemplateShowcase";
import RenderModeDemo from "./sections/RenderModeDemo";
import NewsletterArchiveDemo from "./sections/NewsletterArchiveDemo";
import FeatureComparison from "./sections/FeatureComparison";
import ComponentGallery from "./sections/ComponentGallery";
import CTABanner from "./sections/CTABanner";
import Footer from "./sections/Footer";
import JsonDump from "./sections/JsonDump";

export default function App() {
  const [isJsonPage, setIsJsonPage] = useState(window.location.hash === "#json");

  useEffect(() => {
    const onHash = () => setIsJsonPage(window.location.hash === "#json");
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  if (isJsonPage) return <JsonDump />;

  // Scroll-triggered fade-in animations
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible");
          }
        });
      },
      { threshold: 0.1, rootMargin: "0px 0px -40px 0px" }
    );

    document.querySelectorAll(".fade-in-up").forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return (
    <div className="min-h-screen bg-surface-0">
      <Hero />
      <div className="fade-in-up"><QuickStart /></div>
      <div className="fade-in-up"><TemplateShowcase /></div>
      <div className="fade-in-up"><RenderModeDemo /></div>
      <div className="fade-in-up"><NewsletterArchiveDemo /></div>
      <div className="fade-in-up"><FeatureComparison /></div>
      <div className="fade-in-up"><ComponentGallery /></div>
      <div className="fade-in-up"><CTABanner /></div>
      <Footer />
    </div>
  );
}
