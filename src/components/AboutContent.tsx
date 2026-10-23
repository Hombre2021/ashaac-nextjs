import Image from "next/image";
import sharedStyles from "./SharedContentSection.module.css";
import styles from "./AboutContent.module.css";
import AboutCompanySection from "./AboutCompanySection";

export default function AboutContent() {
  return (
    <>
      <section className={sharedStyles.sectionBase}>
        <div className={`${sharedStyles.contentBase} ${styles.aboutText}`}>
          <div style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            background: "#ffffff",
            borderRadius: 16,
            padding: "24px",
            boxShadow: "0 4px 20px rgba(0,0,0,0.06)",
            border: "1px solid #e2e8f0",
            marginBottom: 36,
          }}>
            <div style={{
              position: "relative",
              width: "100%",
              maxWidth: 720,
              height: 380,
              borderRadius: 12,
              overflow: "hidden",
              boxShadow: "0 2px 12px rgba(0,0,0,0.1)",
            }}>
              <Image
                src="/images/about/leandro-van.jpg"
                alt="Leandro Garcia with All Solutions Heating and Air Conditioning service van in Utah"
                fill
                priority
                sizes="(max-width: 768px) 100vw, 720px"
                style={{ objectFit: "cover" }}
              />
            </div>
            <div style={{ textAlign: "center", marginTop: 20 }}>
              <h2 style={{ fontSize: "1.5rem", color: "#0f172a", margin: "0 0 6px 0", fontWeight: 700 }}>
                Meet Founder &amp; Lead Technician Leandro Garcia
              </h2>
              <p style={{ fontSize: "1rem", color: "#64748b", margin: "0 0 16px 0" }}>
                Serving West Jordan and Salt Lake County since 2008 with honest, affordable, and reliable HVAC care.
              </p>
              <div style={{
                display: "flex",
                flexWrap: "wrap",
                gap: 12,
                justifyContent: "center",
                fontSize: "0.88rem",
                fontWeight: 600,
                color: "#1e293b",
              }}>
                <span style={{ background: "#f1f5f9", padding: "6px 14px", borderRadius: 20 }}>🛡️ BBB Accredited Business</span>
                <span style={{ background: "#fef3c7", color: "#92400e", padding: "6px 14px", borderRadius: 20 }}>⭐ 5.0 Google Rating (30+ Reviews)</span>
                <span style={{ background: "#f1f5f9", padding: "6px 14px", borderRadius: 20 }}>⚡ Licensed &amp; EPA Certified</span>
                <span style={{ background: "#f1f5f9", padding: "6px 14px", borderRadius: 20 }}>📍 Locally Owned in West Jordan</span>
              </div>
            </div>
          </div>

          <p>Welcome to All Solutions Heating and Air Conditioning! We&apos;re experts in HVAC, focusing on putting in new systems and swapping old ones. When it comes to keeping your place comfy in all seasons, we&apos;re your go-to.</p>
          <h3>Our Specialty, Installations and Replacements</h3>
          <p>We&apos;re the pros when it comes to installing and replacing HVAC systems. We understand how vital it is to have a reliable heating and cooling setup in your home or office. If you want the classic furnace and AC combo or something more flexible like mini-split systems, heat pumps, or window units, we&apos;ve got your back. We have a wide range of products and a team of skilled technicians to handle all installations smoothly and professionally.</p>
          <h3>Best Choices, Best Setup</h3>
          <p>When you pick All Solutions Heating and Air Conditioning, you&apos;re choosing from a wide range of top-quality heating and cooling gear. We pick our stuff from trusted makers, so you know it&apos;s durable, energy-efficient, and works great. Our experienced technicians can set up various systems, making sure they fit well and work like a charm. Trust us to suggest the best gear for you, and we&apos;ll install it with precision.</p>
          <h3>Putting You First</h3>
          <p>At our core, we&apos;re all about serving you right. We know each customer is different, with their own needs and likes. That&apos;s why we listen to what you need, check out your place, and make our solutions fit you. Our approach is all about giving you a personal experience and going beyond what you expect. From our first talk to the final setup, we want to make it smooth and easy for you, keeping you happy all the way.</p>
          <h3>Why We&apos;re Different</h3>
          <p>With All Solutions Heating and Air Conditioning, you&apos;re getting a team that&apos;s professional, skilled, and trustworthy. We believe in being honest, offering fair prices, and giving you top-notch service. Quality HVAC help shouldn&apos;t cost a fortune, so we keep our prices competitive and offer payment plans. We&apos;re all about making sure you get great value with every project we do.</p>
        </div>
      </section>
      <AboutCompanySection />
    </>
  );
}
