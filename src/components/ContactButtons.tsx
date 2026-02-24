import styles from "./ContactButtons.module.css";

type ContactButtonsProps = {
  phoneAriaLabel?: string;
};

export default function ContactButtons({
  phoneAriaLabel = "Text or call 801-755-3040 from Contact page",
}: ContactButtonsProps) {
  return (
    <div className={styles.blueButtonGroupHorizontal} data-label="ContactButtonsGroup">
      <a
        data-label="EmailButton"
        className={styles.blueButton}
        href="mailto:ashaacutah@gmail.com"
        aria-label="Email us at ashaacutah@gmail.com from Contact page"
      >
        Email us at: ashaacutah@gmail.com
      </a>
      <a
        data-label="PhoneButton"
        className={styles.blueButton}
        href="tel:8017553040"
        aria-label={phoneAriaLabel}
      >
        Text or call: 801-755-3040
      </a>
      <a
        data-label="BookButton"
        className={styles.blueButton}
        href="https://calendly.com/ashaacutah/30min?month=2026-02&_gl=1%2A1owpxfg%2A_ga%2AODYzMjgyOTI3LjE3NTIyODkwNzY.%2A_ga_WNKN6Z7Y46%2AczE3NzA2ODU3ODIkbzU3JGcxJHQxNzcwNjg1NzgyJGo2MCRsMCRoMA.."
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Book your appointment now from Contact page"
      >
        Book your appointment now!
      </a>
    </div>
  );
}
