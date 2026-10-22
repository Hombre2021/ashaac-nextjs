"use client";

import styles from "./MobileCallAction.module.css";

export default function MobileCallAction() {
  return (
    <a
      className={styles.callAction}
      href="tel:8017553040"
      aria-label="Call now: 801-755-3040 - All Solutions Heating and Air Conditioning"
    >
      Call now: 801-755-3040
    </a>
  );
}
