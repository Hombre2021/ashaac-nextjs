import Link from "next/link";
import containerStyles from "./HomepageServicesButton.module.css";
import buttonStyles from "./SharedRedButton.module.css";

export default function HomepageServicesButton() {
  return (
    <div className={containerStyles.servicesButtonWrap}>
      <Link href="/services">
        <button className={buttonStyles.redButton}>
          View All Services
        </button>
      </Link>
    </div>
  );
}
