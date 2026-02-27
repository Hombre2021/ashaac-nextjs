"use client";

import { FormEvent, useState } from "react";
import styles from "./DIYHelpCenterContent.module.css";

const videoResources = [
  {
    title: "Coming Soon: Video 1",
    description: "More DIY video content is coming up soon!",
  },
  {
    title: "Coming Soon: Video 2",
    description: "More DIY video content is coming up soon!",
  },
  {
    title: "Coming Soon: Video 3",
    description: "More DIY video content is coming up soon!",
  },
];

export default function DIYHelpCenterContent() {
  const [questionSent, setQuestionSent] = useState(false);
  const [liveHelpSent, setLiveHelpSent] = useState(false);
  const [questionError, setQuestionError] = useState<string | null>(null);
  const [liveHelpError, setLiveHelpError] = useState<string | null>(null);
  const [isQuestionSubmitting, setIsQuestionSubmitting] = useState(false);
  const [isLiveHelpSubmitting, setIsLiveHelpSubmitting] = useState(false);

  const handleQuestionSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    const name = String(formData.get("name") || "");
    const email = String(formData.get("email") || "");
    const city = String(formData.get("city") || "");
    const replyChannel = String(formData.get("replyChannel") || "");
    const question = String(formData.get("question") || "");

    setIsQuestionSubmitting(true);
    setQuestionError(null);
    setQuestionSent(false);

    try {
      const response = await fetch("/api/diy", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          submissionType: "question",
          name,
          email,
          city,
          replyChannel,
          question,
        }),
      });

      if (!response.ok) {
        throw new Error("Request failed");
      }

      setQuestionSent(true);
      event.currentTarget.reset();
    } catch {
      setQuestionError("We couldn't submit your question right now. Please try again shortly.");
    } finally {
      setIsQuestionSubmitting(false);
    }
  };

  const handleLiveHelpSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    const name = String(formData.get("name") || "");
    const email = String(formData.get("email") || "");
    const phone = String(formData.get("phone") || "");
    const preferredDate = String(formData.get("preferredDate") || "");
    const preferredTime = String(formData.get("preferredTime") || "");
    const issue = String(formData.get("issue") || "");

    setIsLiveHelpSubmitting(true);
    setLiveHelpError(null);
    setLiveHelpSent(false);

    try {
      const response = await fetch("/api/diy", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          submissionType: "live_help",
          name,
          email,
          phone,
          preferredDate,
          preferredTime,
          issue,
        }),
      });

      if (!response.ok) {
        throw new Error("Request failed");
      }

      setLiveHelpSent(true);
      event.currentTarget.reset();
    } catch {
      setLiveHelpError("We couldn't submit your live help request right now. Please try again shortly.");
    } finally {
      setIsLiveHelpSubmitting(false);
    }
  };

  return (
    <section className={styles.pageSection}>
      <div className={styles.introCard}>
        <h1>DIY Help Center</h1>
        <p>
          Explore quick-fix video resources for common HVAC issues, submit your question online,
          and request live help when you need direct support.
        </p>
      </div>

      <div className={styles.panel}>
        <h2>Videos Coming Soon</h2>
        <div className={styles.videoGrid}>
          {videoResources.map((video) => (
            <div key={video.title} className={styles.videoCard} aria-disabled="true">
              <h3>{video.title}</h3>
              <p>{video.description}</p>
              <span>Coming up soon!</span>
            </div>
          ))}
        </div>
      </div>

      <div className={styles.panel}>
        <h2>Ask an Online Question</h2>
        <p>Send your HVAC question and we’ll respond through your preferred channel.</p>
        <form name="diy_question_form" className={styles.form} onSubmit={handleQuestionSubmit}>
          <input name="name" type="text" placeholder="Your name" required />
          <input name="email" type="email" placeholder="Your email" required />
          <input name="city" type="text" placeholder="City" required />
          <select name="replyChannel" required defaultValue="">
            <option value="" disabled>Select preferred reply channel</option>
            <option value="Email">Email</option>
            <option value="Text">Text</option>
            <option value="Call">Call</option>
          </select>
          <textarea name="question" rows={5} placeholder="Describe the problem and what you already tried" required />
          <button type="submit" disabled={isQuestionSubmitting}>
            {isQuestionSubmitting ? "Sending..." : "Send Question"}
          </button>
        </form>
        {questionSent ? <p className={styles.successMsg}>Your question was submitted successfully. We’ll follow up soon.</p> : null}
        {questionError ? <p className={styles.errorMsg}>{questionError}</p> : null}
      </div>

      <div className={styles.panel}>
        <h2>Request Live Help</h2>
        <p>Need more direct support? Request a live video help session and we’ll follow up with scheduling details.</p>
        <form name="diy_live_help_form" className={styles.form} onSubmit={handleLiveHelpSubmit}>
          <input name="name" type="text" placeholder="Your name" required />
          <input name="email" type="email" placeholder="Your email" required />
          <input name="phone" type="tel" placeholder="Your phone number" required />
          <input name="preferredDate" type="date" required />
          <input name="preferredTime" type="text" placeholder="Preferred time window (for example: 4–6 PM)" required />
          <textarea name="issue" rows={5} placeholder="What issue do you want help with live?" required />
          <button type="submit" disabled={isLiveHelpSubmitting}>
            {isLiveHelpSubmitting ? "Sending..." : "Request Live Help"}
          </button>
        </form>
        {liveHelpSent ? <p className={styles.successMsg}>Your live help request was submitted successfully. We’ll follow up with scheduling.</p> : null}
        {liveHelpError ? <p className={styles.errorMsg}>{liveHelpError}</p> : null}
      </div>
    </section>
  );
}