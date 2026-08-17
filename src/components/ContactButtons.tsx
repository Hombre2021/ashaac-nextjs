"use client";

import Link from "next/link";
import { trackLeadEvent, trackPhoneClick } from "@/lib/analytics";
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
        onClick={() => trackPhoneClick("/contact")}
      >
        Text or call: 801-755-3040
      </a>
      <Link
        data-label="BookButton"
        className={styles.blueButton}
        href="/book"
        aria-label="Book your appointment now from Contact page"
        onClick={() => trackLeadEvent("click_hvac_pro_booking", { source: "contact" })}
      >
        Book your appointment now!
      </Link>
    </div>
  );
}
