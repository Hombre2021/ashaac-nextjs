import styles from "./HomepageEstimateButton.module.css";

export default function HomepageEstimateButton() {
  return (
    <div className={styles.buttonContainer}>
      <a
        href="https://calendly.com/ashaacutah/30min?month=2026-02&_gl=1%2A1owpxfg%2A_ga%2AODYzMjgyOTI3LjE3NTIyODkwNzY.%2A_ga_WNKN6Z7Y46%2AczE3NzA2ODU3ODIkbzU3JGcxJHQxNzcwNjg1NzgyJGo2MCRsMCRoMA.."
        target="_blank"
        rel="noopener noreferrer"
        className={styles.redButton}
      >
        Request a Free Estimate
      </a>
    </div>
  );
}
