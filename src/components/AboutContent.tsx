
import styles from "./AboutContent.module.css";
import AboutCompanySection from "./AboutCompanySection";

export default function AboutContent() {
  return (
    <>
      <section className={styles.aboutSection}>
        <div className={styles.aboutText}>
          <p>Welcome to All Solutions Heating and Air Conditioning! We’re experts in HVAC, focusing on putting in new systems and swapping old ones. When it comes to keeping your place comfy in all seasons, we’re your go-to.</p>
          <h3>Our Specialty, Installations and Replacements</h3>
          <p>We’re the pros when it comes to installing and replacing HVAC systems. We understand how vital it is to have a reliable heating and cooling setup in your home or office. If you want the classic furnace and AC combo or something more flexible like mini-split systems, heat pumps, or window units, we’ve got your back. We have a wide range of products and a team of skilled technicians to handle all installations smoothly and professionally.</p>
          <h3>Best Choices, Best Setup</h3>
          <p>When you pick All Solutions Heating and Air Conditioning, you’re choosing from a wide range of top-quality heating and cooling gear. We pick our stuff from trusted makers, so you know it’s durable, energy-efficient, and works great. Our experienced technicians can set up various systems, making sure they fit well and work like a charm. Trust us to suggest the best gear for you, and we’ll install it with precision.</p>
          <h3>Putting You First</h3>
          <p>At our core, we’re all about serving you right. We know each customer is different, with their own needs and likes. That’s why we listen to what you need, check out your place, and make our solutions fit you. Our approach is all about giving you a personal experience and going beyond what you expect. From our first talk to the final setup, we want to make it smooth and easy for you, keeping you happy all the way.</p>
          <h3>Why We’re Different</h3>
          <p>With All Solutions Heating and Air Conditioning, you’re getting a team that’s professional, skilled, and trustworthy. We believe in being honest, offering fair prices, and giving you top-notch service. Quality HVAC help shouldn’t cost a fortune, so we keep our prices competitive and offer payment plans. We’re all about making sure you get great value with every project we do.</p>
        </div>
      </section>
      <AboutCompanySection />
    </>
  );
}
