import Image from "next/image";
import styles from "./ServicesContent.module.css";

export default function ServicesContent() {
  return (
    <section className={styles.servicesSection}>
      <div className={styles.furnaceImagesRow}>
        <div className={styles.furnaceImageLeft}>
          <Image
            src="/images/services/Furnace-WJ.webp"
            alt="Furnace Installation West Jordan"
            width={340}
            height={220}
            className={styles.furnaceImage}
          />
        </div>
        <div className={styles.furnaceImageRight}>
          <Image
            src="/images/services/Furnace-pulido.webp"
            alt="Furnace Installation Pulido"
            width={340}
            height={220}
            className={styles.furnaceImage}
          />
        </div>
      </div>
      <div className={styles.furnaceTextBlock}>
        <h2 className={styles.furnaceTitle}>Furnace Installation and replacement.</h2>
        <p className={styles.furnaceDescription}>
          We specialize in the installation and replacement of your furnace. Don’t have the cash for it? We offer financing options. Just call us or talk to us when we come to do your free estimate.
        </p>
        <div className={styles.heatingServicesBlock}>
          <h3 className={styles.heatingServicesTitle}>Heating Services: Furnace Installation, Repair, and Maintenance</h3>
          <p className={styles.heatingServicesDescription}>
            We know everything about furnaces. We’re experts at installing them and keeping them working well. If you need heating services at home or work, or your current one needs a check-up, we’re the people for the job. We make sure it runs smoothly, so you stay cozy when it’s cold.
            <br /><br />
            Not only do we install and maintain furnaces, but we also fix them if something’s wrong. Sometimes furnaces can act up, especially after a long time. We’ve got the skills to figure out the issue and make it work like it should. So, if your furnace is acting strange, don’t worry—we’ve got your back! We’ll have it up and running in no time, keeping you warm and cozy.
          </p>
          <div className={styles.heatingExperienceBlock}>
            <h3 className={styles.heatingExperienceTitle}>Heating Services Experience</h3>
            <p className={styles.heatingExperienceDescription}>
              We’re all about making your heating services experience smooth and worry-free. Our team is friendly and reliable, so you can count on us to be there when you need help. We understand that well-functioning heating services are vital, especially during freezing times. That’s why we always go the extra mile to ensure your heating system is in top-notch condition, running efficiently and keeping you snug.
              <br /><br />
              Safety is a big deal to us too. When we work on heating services, we double-check everything to make sure it’s safe. We want your home or workplace to be a secure and comfy place. So, you can trust us to not only do a great job with your heating services but also to do it safely and with care. Your peace of mind matters, and we’ve got you covered.
            </p>
          </div>
          <div className={styles.redStripe}>
            <span className={styles.redStripeText}>
              All Solutions Heating and Air Conditioning takes its commitment to quality and customer satisfaction seriously. We stand behind our products and installations, and we are confident that you will be delighted with the results.
            </span>
          </div>

          <div className={styles.maintenanceRow}>
            <div className={styles.maintenanceImageCol}>
              <Image
                src="/images/services/Samsung-electronics.webp"
                alt="Samsung Electronics HVAC"
                width={340}
                height={220}
                className={styles.maintenanceImage}
              />
            </div>
            <div className={styles.maintenanceTextCol}>
              <h3 className={styles.maintenanceTitle}>Comprehensive HVAC Maintenance</h3>
              <p className={styles.maintenanceDescription}>
                Regular maintenance is essential to keep your heating and cooling systems running smoothly and efficiently. Our comprehensive HVAC maintenance services include thorough inspections, and tune-ups for furnaces, AC units, heat pumps, mini split systems, and through-the-window or wall units. With routine maintenance, we can identify and address potential issues before they become major problems, ensuring reliable and energy-efficient operation. Don’t wait to have to pay a large bill and call us to do regular maintenance on your system.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
