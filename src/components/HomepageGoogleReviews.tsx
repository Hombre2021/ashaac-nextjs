import styles from "./HomepageGoogleReviews.module.css";

const googleReviews = [
  {
    name: "Judy Nielsen",
    details: "Local Guide·14 reviews · a month ago",
    text: "My 97-year-old father called me yesterday, informing me that his heater was not working, so of course this was a matter that needed to be taken care of quickly so the first person that I thought of was Leandro. Leandro is very … More",
    ownerReply: "Thank you Judy, I really appreciate your words of kindness. We, at All Solutions HVAC are happy to help. Thank you!"
  },
  {
    name: "Samra Zele",
    details: "5 reviews · 5 months ago",
    text: "Leandro was great!! Knew exactly what was wrong with our unit and fixed it the same day. He is an honest technician. He will be our replacement/repair guy for the future 👍",
    ownerReply: "Thank you Samra. You and your husband are wonderful human beings. Thank you so much for your trust in All Solutions Heating and AC. Call us for any needed follow up. You are protected under our 1 year guarantee on today's services."
  },
  {
    name: "burl moimoi",
    details: "2 reviews · a month ago",
    text: "Pricing was very reasonable and they did a great job with installation and even cleaned up everything in the work area. I would recommend to all my friends",
    ownerReply: "Thank you Burl, it was a pleasure getting your project done. We are really happy to know your system is up and running as it should be. Don’t hesitate to call us for any HVAC, gas installations and electrical needs as well."
  },
  {
    name: "leo garcia",
    details: "2 reviews·1 photo · 2 years ago",
    text: "I highly recommend All Solutions Heating and Air. The work was done on time in a very professional manner, I was impressed to know the technician has a lot of knowledge on electrical and plumbing in general, on top of the great service, the … More",
    ownerReply: "Thank you Leo you’re very kind, thank you for allowing us to serve you!"
  },
  {
    name: "Ken Coleman",
    details: "6 reviews · a year ago",
    text: "Leandro is great. He helped me out start to finish, was always there to suggest what to do next, select the right equipment for my AC. He was always on time. A hard worker.Knew what he was doing. His follow up and follow through were … More",
    ownerReply: "Thank you for your honest review Ken. We're happy to help with all your heating, cooling, electrical and plumbing needs!"
  },
  {
    name: "Cruz Mayoral",
    details: "3 reviews · 2 years ago",
    text: "Leandro has being my savior!!! During 2 different occasions my heater has stopped running on the weekend, and during both occasions he was able to get to my house late night and has fixed my … More",
    ownerReply: "You are so very much welcome Cruz, thank you for your trust and your honest review. Happy to be of service for all of your heating, cooling, electrical and plumbing needs."
  },
  {
    name: "BriAnn Denoyer",
    details: "9 reviews · 2 years ago",
    text: "Great communication! I appreciate the quality work and quick response. I had a hot water heater replaced when the old one started leaking. I appreciated the time and thought the All Solutions team put towards making sure the hot water … More",
    ownerReply: "Thank you BriAnn, you’re very generous and wonderful to work with; thank you for allowing us to be of any service!"
  },
  {
    name: "Jose Vargas",
    details: "2 reviews · 5 months ago",
    text: "Super fast very knowledgeable Leandro was awesome very nice and professional gave me some great tips … More",
    ownerReply: "Thank you for your review Jose. Please don't hesitate to call back if you need a follow up."
  },
  {
    name: "Enrique Pulido",
    details: "4 reviews · a year ago",
    text: "Leandro did a great job working long hard hours making sure his job was finished timely. Very professional I’m also impressed by his commitment to make look the installation pretty. Thank you.",
    ownerReply: "Enrique, thanks so much for your review and for allowing us to serve you!"
  },
  {
    name: "Shirley Ann Taeoalii",
    details: "9 reviews·2 photos · Edited a year ago",
    text: "Very good at his job. Was able to fix my air conditioner no problem. Also very detail oriented and conscientious of his work. I will definitely use him in the future. Good person!!!",
    ownerReply: "Thank you Shirley, our pleasure to be of service to you, now and in the future."
  }
];

export default function HomepageGoogleReviews() {
  return (
    <section className={styles.googleReviewsSection}>
      <h2 className={styles.googleReviewsTitle}>Google Reviews</h2>
      <div className={styles.googleReviewsList}>
        {googleReviews.map((r, idx) => (
          <div key={idx} className={styles.googleReviewCard}>
            <div className={styles.googleReviewHeader}>
              <span className={styles.googleReviewName}>{r.name}</span>
              <span className={styles.googleReviewDetails}>{r.details}</span>
            </div>
            <div className={styles.googleReviewText}>{r.text}</div>
            <div className={styles.googleReviewOwnerReply}><strong>Owner reply:</strong> {r.ownerReply}</div>
          </div>
        ))}
      </div>
    </section>
  );
}
