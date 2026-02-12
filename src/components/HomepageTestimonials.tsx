import styles from "./HomepageTestimonials.module.css";

const testimonials = [
  {
    name: "General",
    text: `For example, don’t just take our word for it. Read what our valued customers have to say about their experience with All Solutions Heating and Air Conditioning, All Solutions Heating and Air Conditioning exceeded my expectations. Then, from the initial consultation to the final installation, their team was professional, knowledgeable, and efficient. The new furnace they installed in my home has been working flawlessly, and I couldn't be happier with the level of comfort it provides. Highly recommended!`,
  },
  {
    name: "John M",
    text: `I was in need of a new AC unit, and All Solutions Heating and Air Conditioning came highly recommended by a friend. They didn't disappoint me! The team was punctual, courteous, and completed the installation the same day. My home is now nice and comfortable, and I appreciate their attention to detail and competitive pricing. Thank you for a job well done!`,
  },
  {
    name: "Sarah T",
    text: `All Solutions Heating and Air Conditioning came to my rescue when my heat pump stopped working during the coldest week of winter. Their technicians quickly diagnosed the issue and resolved the problem. Their expertise and prompt service saved me from freezing temperatures. I'm grateful for their professionalism and dedication to customer satisfaction.`,
  },
  {
    name: "Michael S",
    text: `I recently had a mini-split system installed in my home office, and I am incredibly pleased with the results. The team at All Solutions Heating and Air Conditioning provided valuable advice, helped me choose the right system, and completed the installation with precision. Now I have a comfortable working environment year-round. I highly recommend their services for anyone looking to upgrade their HVAC system.`,
  },
];

export default function HomepageTestimonials() {
  return (
    <section className={styles.testimonialsSection}>
      <h2 className={styles.testimonialsTitle}>Testimonials</h2>
      <div className={styles.testimonialsList}>
        {testimonials.map((t, idx) => (
          <div key={idx} className={styles.testimonialCard}>
            <div className={styles.testimonialText}>
              {t.text}
            </div>
            {t.name !== "General" && (
              <div className={styles.testimonialName}>— {t.name}</div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
