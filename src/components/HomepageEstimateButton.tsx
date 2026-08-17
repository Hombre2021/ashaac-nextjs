import Link from "next/link";
import containerStyles from "./HomepageEstimateButton.module.css";
import buttonStyles from "./SharedRedButton.module.css";

export default function HomepageEstimateButton() {
  return (
    <div className={containerStyles.estimateButtonWrap}>
      <Link href="/book" className={buttonStyles.redButton}>
        Request a Free Estimate
      </Link>
    </div>
  );
}
