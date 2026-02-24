import Image from "next/image";
import HomepageHeader from "../../components/HomepageHeader";
import ServicesHero from "../../components/ServicesHero";
import ServicesContent from "../../components/ServicesContent";
import HomepageFooter from "../../components/HomepageFooter";

export default function ServicesPage() {
  return (
    <>
      <HomepageHeader />
      <ServicesHero />
      <ServicesContent />
      <div style={{
        width: '100%',
        maxWidth: 1100,
        margin: '48px auto 0 auto',
        padding: '0 24px',
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: 32,
      }}>
        <div style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
          <Image
            src="/images/services/ac-downtown.webp"
            alt="AC Downtown"
            width={340}
            height={220}
            sizes="(max-width: 768px) 100vw, 340px"
            style={{ borderRadius: 14, boxShadow: "0 2px 16px rgba(0,0,0,0.10)", width: "100%", maxWidth: 340, height: "auto", objectFit: "cover" }}
          />
        </div>
        <div style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
          <Image
            src="/images/services/Heat-pump-WJ.webp"
            alt="Heat Pump West Jordan"
            width={340}
            height={220}
            sizes="(max-width: 768px) 100vw, 340px"
            style={{ borderRadius: 14, boxShadow: "0 2px 16px rgba(0,0,0,0.10)", width: "100%", maxWidth: 340, height: "auto", objectFit: "cover" }}
          />
        </div>
      </div>

      <div style={{
        maxWidth: 800,
        margin: '40px auto 32px auto',
        padding: '0 24px',
        fontSize: 20,
        lineHeight: 1.6,
        color: '#222',
        textAlign: 'center',
      }}>
        <strong>Air Conditioning (AC) Units and Heat Pumps</strong><br />
        We offer professional installation and maintenance of air conditioning (AC) units and heat pumps. Our team will assess your cooling needs and recommend the most suitable AC unit or heat pump for your space. Whether it’s a central air conditioning system or a heat pump that provides both heating and cooling, we ensure proper installation and optimal performance to keep your indoor environment ideally comfortable.
      </div>

      <div style={{
        width: '100%',
        maxWidth: 1100,
        margin: '0 auto 32px auto',
        padding: '0 24px',
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: 32,
      }}>
        <div style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
          <Image
            src="/images/services/mini-split.webp"
            alt="Mini Split"
            width={340}
            height={220}
            sizes="(max-width: 768px) 100vw, 340px"
            style={{ borderRadius: 14, boxShadow: "0 2px 16px rgba(0,0,0,0.10)", width: "100%", maxWidth: 340, height: "auto", objectFit: "cover" }}
          />
        </div>
        <div style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
          <Image
            src="/images/services/mini-split-room2.webp"
            alt="Mini Split Room"
            width={340}
            height={220}
            sizes="(max-width: 768px) 100vw, 340px"
            style={{ borderRadius: 14, boxShadow: "0 2px 16px rgba(0,0,0,0.10)", width: "100%", maxWidth: 340, height: "auto", objectFit: "cover" }}
          />
        </div>
      </div>

      <div style={{
        maxWidth: 800,
        margin: '0 auto 32px auto',
        padding: '0 24px',
        fontSize: 20,
        lineHeight: 1.6,
        color: '#222',
        textAlign: 'center',
      }}>
        <strong>Mini-Split Systems</strong><br />
        Mini-split systems are an excellent solution for spaces where traditional ductwork is not feasible or desirable. Our technicians have expertise in the installation and also maintenance of mini-split systems. These systems provide efficient heating and cooling, allowing you to create customized comfort zones in different areas of your home or business. We’ll help you select the right mini-split system and ensure precise installation for maximum comfort.
      </div>

      <div style={{
        maxWidth: 800,
        margin: '0 auto 56px auto',
        padding: '0 24px',
        fontSize: 20,
        lineHeight: 1.6,
        color: '#222',
        textAlign: 'center',
      }}>
        <strong>Through-the-Window or Wall Units</strong><br />
        For spaces where a full central air system is not necessary, we offer the installation of through-the-window or wall units. These units are efficient and cost-effective options for cooling or heating specific areas. Our technicians will recommend the most suitable through-the-window or wall unit for your needs and ensure proper installation for optimal performance.
      </div>
      <HomepageFooter />
    </>
  );
}
