"use client";

import { FormEvent, useState } from "react";
import styles from "./DIYHelpCenterContent.module.css";

const videoResources = [
  {
    title: "AC Not Cooling: First DIY Checks",
    description: "Quick checks you can do safely before calling for repair.",
    url: "https://www.youtube.com/",
  },
  {
    title: "Furnace Not Heating: What to Inspect",
    description: "Simple troubleshooting steps for common heating issues.",
    url: "https://www.youtube.com/",
  },
  {
    title: "Thermostat Setup Tips for Better Comfort",
    description: "Practical setup tips for performance and energy savings.",
    url: "https://www.youtube.com/",
  },
];

function buildMailto(subject: string, body: string) {
  const encodedSubject = encodeURIComponent(subject);
  const encodedBody = encodeURIComponent(body);
  return `mailto:contact@ashaac.com?subject=${encodedSubject}&body=${encodedBody}`;
}

export default function DIYHelpCenterContent() {
  const [questionSent, setQuestionSent] = useState(false);
  const [liveHelpSent, setLiveHelpSent] = useState(false);

  const handleQuestionSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    const name = String(formData.get("name") || "");
    const email = String(formData.get("email") || "");
    const city = String(formData.get("city") || "");
    const replyChannel = String(formData.get("replyChannel") || "");
    const question = String(formData.get("question") || "");

    const subject = `DIY Help Question - ${city || "Salt Lake County"}`;
    const body = [
      "New DIY Help Center question submission",
      "",
      `Name: ${name}`,
      `Email: ${email}`,
      `City: ${city}`,
      `Preferred reply channel: ${replyChannel}`,
      "",
      "Question:",
      question,
    ].join("\n");

    window.location.href = buildMailto(subject, body);
    setQuestionSent(true);
    event.currentTarget.reset();
  };

  const handleLiveHelpSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    const name = String(formData.get("name") || "");
    const email = String(formData.get("email") || "");
    const phone = String(formData.get("phone") || "");
    const preferredDate = String(formData.get("preferredDate") || "");
    const preferredTime = String(formData.get("preferredTime") || "");
    const issue = String(formData.get("issue") || "");

    const subject = "Request Live Help - DIY Help Center";
    const body = [
      "New live help request",
      "",
      `Name: ${name}`,
      `Email: ${email}`,
      `Phone: ${phone}`,
      `Preferred date: ${preferredDate}`,
      `Preferred time: ${preferredTime}`,
      "",
      "Issue details:",
      issue,
    ].join("\n");

    window.location.href = buildMailto(subject, body);
    setLiveHelpSent(true);
    event.currentTarget.reset();
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
        <h2>Quick Fix Videos</h2>
        <div className={styles.videoGrid}>
          {videoResources.map((video) => (
            <a
              key={video.title}
              href={video.url}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.videoCard}
            >
              <h3>{video.title}</h3>
              <p>{video.description}</p>
              <span>Watch video</span>
            </a>
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
          <button type="submit">Send Question</button>
        </form>
        {questionSent ? <p className={styles.successMsg}>Your question draft was prepared. Send the email to complete submission.</p> : null}
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
          <button type="submit">Request Live Help</button>
        </form>
        {liveHelpSent ? <p className={styles.successMsg}>Your live help request draft was prepared. Send the email to complete submission.</p> : null}
      </div>
    </section>
  );
}