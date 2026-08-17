"use client";

import styles from "./MobileCallAction.module.css";
import { usePathname } from "next/navigation";

export default function MobileCallAction() {
  const pathname = usePathname();

  if (pathname === "/") {
    return null;
  }

  return (
    <a
      className={styles.callAction}
      href="tel:8017553040"
      aria-label="Call All Solutions Heating and Air Conditioning at 801-755-3040"
    >
      Call now: 801-755-3040
    </a>
  );
}