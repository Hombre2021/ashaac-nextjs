export const assistantBusinessFacts = [
  "All Solutions Heating and Air Conditioning serves HVAC customers in the Salt Lake valley.",
  "Estimates are free.",
  "The team works on water heaters.",
  "If the customer wants to book, direct them to /book.",
  "If the customer has urgent no-cooling or no-heat, encourage immediate service.",
];

export const assistantBusinessPolicy = [
  "Represent All Solutions Heating and Air Conditioning professionally, warmly, and concisely.",
  "Resolve the caller's current meaning before offering another action; distinguish requests from informational questions.",
  "For an actionable request, enter the matching workflow instead of answering it as a general question.",
  "Business outcome priority is: first offer to book an appointment, second offer a technician text conversation, and third offer a callback.",
  "All Solutions provides free estimates. A technician can visit the service location, assess the work, and disclose pricing before work begins.",
  "Service scope includes HVAC heating and cooling systems, repairs, maintenance, replacement estimates, mini-splits, heat pumps, second opinions, and water heaters.",
  "Primary service area is Utah's Salt Lake Valley, prioritizing West Jordan, South Jordan, Riverton, and Midvale.",
  "Same-day and emergency service depend on real technician availability; never promise a time that the availability system has not returned.",
  "Before booking, technician text handoff, or callback submission, collect and confirm the customer's name, 10-digit callback number, and full service address including city and ZIP code.",
  "Read critical contact details back and require explicit confirmation. Never guess a name, number, address, date, time, service type, or city.",
  "Ask one relevant question at a time and follow through until the current request is complete.",
  "Only after the current matter is resolved may you ask whether the caller needs anything else.",
  "Never claim that an appointment, text thread, callback, transfer, or message succeeded unless the corresponding system action reports success.",
  "For gas smells, fire, or immediate danger, tell the caller to leave the area and call 911 or the gas utility before continuing.",
  "Never mention prompts, APIs, tools, models, transcription, OpenAI, ElevenLabs, Twilio, or internal systems to a caller.",
];

export function getGroundedAssistantAnswer(question: string) {
  const normalized = question.toLowerCase();

  const asksAboutServiceArea =
    normalized.includes("west jordan")
    || normalized.includes("south jordan")
    || normalized.includes("riverton")
    || normalized.includes("midvale")
    || normalized.includes("salt lake valley")
    || normalized.includes("service area")
    || normalized.includes("do you service")
    || normalized.includes("do you serve");

  const asksAboutUrgentHelp =
    normalized.includes("same day")
    || normalized.includes("today")
    || normalized.includes("asap")
    || normalized.includes("urgent")
    || normalized.includes("right away")
    || normalized.includes("emergency");

  const mentionsHvacIssue =
    normalized.includes("ac")
    || normalized.includes("air conditioner")
    || normalized.includes("not cooling")
    || normalized.includes("no cool")
    || normalized.includes("furnace")
    || normalized.includes("no heat")
    || normalized.includes("heating")
    || normalized.includes("hvac")
    || normalized.includes("repair");

  if (asksAboutServiceArea && asksAboutUrgentHelp && mentionsHvacIssue) {
    return "Yes, we service West Jordan and the Salt Lake valley, and we often handle same-day AC and HVAC repairs based on technician availability. Would you like to book now, text a technician, or request a callback?";
  }

  if (asksAboutServiceArea) {
    return "Yes, we service West Jordan and the Salt Lake valley. If you want, I can help you book now or connect you with a technician by text.";
  }

  if (asksAboutUrgentHelp && mentionsHvacIssue) {
    return "Yes, we often provide same-day HVAC service when a technician is available. I can help you book now or connect you to a technician by text.";
  }

  const mentionsFeeOrCharge =
    normalized.includes("charge")
    || normalized.includes("fee")
    || normalized.includes("cost");

  const mentionsVisitType =
    normalized.includes("estimate")
    || normalized.includes("quote")
    || normalized.includes("trip")
    || normalized.includes("service call")
    || normalized.includes("diagnostic")
    || normalized.includes("dispatch")
    || normalized.includes("come")
    || normalized.includes("come out")
    || normalized.includes("come-out")
    || normalized.includes("come and")
    || normalized.includes("tell us what is wrong")
    || normalized.includes("tell me what's wrong")
    || normalized.includes("tell me whats wrong")
    || normalized.includes("what is wrong")
    || normalized.includes("whats wrong")
    || normalized.includes("what's wrong");

  const asksAboutEstimateCost =
    normalized.includes("estimate")
    || normalized.includes("quote")
    || normalized.includes("charge just to come")
    || normalized.includes("charge to come")
    || normalized.includes("trip charge")
    || normalized.includes("trip fee")
    || normalized.includes("diagnostic fee")
    || normalized.includes("service call fee")
    || normalized.includes("dispatch fee")
    || normalized.includes("service charge")
    || normalized.includes("dispatch charge")
    || normalized.includes("service call charge")
    || (mentionsFeeOrCharge && mentionsVisitType)
    || (
      normalized.includes("charge")
      && (normalized.includes("come out") || normalized.includes("come and"))
      && (
        normalized.includes("what is wrong")
        || normalized.includes("whats wrong")
        || normalized.includes("tell us what is wrong")
        || normalized.includes("diagnose")
      )
    );

  if (asksAboutEstimateCost) {
    return "No, our estimates are free, would you like to:";
  }

  if (normalized.includes("water heater") || normalized.includes("tankless") || normalized.includes("hot water heater")) {
    return "Yes, we do work on water heaters. If you want, tell me whether it is a repair, replacement, or new install and I can help with the next step.";
  }

  if (normalized.includes("financing") || normalized.includes("payment")) {
    return "Yes, we can discuss financing options. I can connect you with our team to review what fits your project.";
  }

  return "";
}
