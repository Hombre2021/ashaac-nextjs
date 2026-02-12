import styles from "./PrivacyPolicyContent.module.css";
import React from "react";

interface ContentContainerProps {
  title: string;
  children: React.ReactNode;
}

export default function ContentContainer({ title, children }: ContentContainerProps) {
  return (
    <section className={styles.privacySection}>
      <div className={styles.privacyText}>
        <h1 style={{ textAlign: "center", fontSize: 32, marginBottom: 32 }}>{title}</h1>
        {children}
      </div>
    </section>
  );
}
