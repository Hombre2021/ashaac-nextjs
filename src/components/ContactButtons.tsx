"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { pushDataLayer, trackLeadEvent, trackPhoneClick } from "@/lib/analytics";
import styles from "./ContactButtons.module.css";

type ContactButtonsProps = {
  phoneAriaLabel?: string;
};

export default function ContactButtons({
  phoneAriaLabel = "Text or call 801-755-3040 from Contact page",
}: ContactButtonsProps) {
  const [emailMenuOpen, setEmailMenuOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  const email = "ashaacutah@gmail.com";
  const subject = encodeURIComponent("HVAC Service Inquiry - All Solutions");
  const mailtoUrl = `mailto:${email}?subject=${subject}`;
  const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${email}&su=${subject}`;

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setEmailMenuOpen(false);
      }
    }

    if (emailMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [emailMenuOpen]);

  const handleCopy = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(email);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
    }
  };

  return (
    <div className={styles.blueButtonGroupHorizontal} data-label="ContactButtonsGroup">
      <div className={styles.emailWrapper} ref={menuRef}>
        <a
          data-label="EmailButton"
          className={styles.blueButton}
          href={mailtoUrl}
          aria-label="Email us at ashaacutah@gmail.com from Contact page"
          onClick={(e) => {
            if (e.metaKey || e.ctrlKey || e.shiftKey) return;
            e.preventDefault();
            setEmailMenuOpen((prev) => !prev);
            pushDataLayer({ event: "click_contact_email", source: "contact_page" });
          }}
          aria-expanded={emailMenuOpen}
          aria-haspopup="true"
        >
          Email us at: {email}
        </a>

        {emailMenuOpen && (
          <div className={styles.emailDropdown} role="menu">
            <a
              href={gmailUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.emailOption}
              role="menuitem"
              onClick={() => {
                setEmailMenuOpen(false);
                pushDataLayer({ event: "click_email_gmail", source: "contact_page" });
              }}
            >
              <svg className={styles.emailOptionIcon} viewBox="0 0 24 24" width="22" height="22" fill="none">
                <path d="M22 6L12 13L2 6V4L12 11L22 4V6Z" fill="#EA4335" />
                <path d="M22 6V18C22 19.1 21.1 20 20 20H4C2.9 20 2 19.1 2 18V6L12 13L22 6Z" fill="#EA4335" fillOpacity="0.15" />
                <path d="M2 6L12 13L22 6" stroke="#EA4335" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <rect x="2" y="4" width="20" height="16" rx="2" stroke="#EA4335" strokeWidth="2" />
              </svg>
              <span>
                <strong>Open in Gmail</strong>
                <small>Google Email in browser / app</small>
              </span>
            </a>

            <a
              href={mailtoUrl}
              className={styles.emailOption}
              role="menuitem"
              onClick={() => {
                setEmailMenuOpen(false);
                pushDataLayer({ event: "click_email_default_app", source: "contact_page" });
              }}
            >
              <svg className={styles.emailOptionIcon} viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="#095f91" strokeWidth="2">
                <rect x="2" y="4" width="20" height="16" rx="2" />
                <path d="M22 7L12 13L2 7" />
              </svg>
              <span>
                <strong>Open Default Email App</strong>
                <small>Apple Mail, Outlook, phone app</small>
              </span>
            </a>

            <button
              type="button"
              className={styles.emailOption}
              role="menuitem"
              onClick={handleCopy}
            >
              <svg className={styles.emailOptionIcon} viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="#64748b" strokeWidth="2">
                {copied ? (
                  <path d="M20 6L9 17L4 12" stroke="#16a34a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                ) : (
                  <>
                    <rect x="9" y="9" width="13" height="13" rx="2" />
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                  </>
                )}
              </svg>
              <span>
                <strong>{copied ? "Copied to clipboard!" : "Copy email address"}</strong>
                <small>{email}</small>
              </span>
            </button>
          </div>
        )}
      </div>

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
