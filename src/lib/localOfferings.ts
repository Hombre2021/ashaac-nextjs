export const localCities = ["west-jordan", "south-jordan", "riverton"] as const;

export type LocalCitySlug = (typeof localCities)[number];

export const cityNames: Record<LocalCitySlug, string> = {
  "west-jordan": "West Jordan",
  "south-jordan": "South Jordan",
  riverton: "Riverton",
};

export const cityContext: Record<LocalCitySlug, string> = {
  "west-jordan": "West Jordan homeowners can request help with aging systems, uneven comfort, no-heat concerns, and cooling problems across the west side of the Salt Lake Valley.",
  "south-jordan": "South Jordan homeowners can request service for new construction planning, replacement systems, uneven room temperatures, and seasonal heating or cooling problems.",
  riverton: "Riverton homeowners can request help with older equipment, urgent comfort problems, airflow concerns, and heating or cooling projects in the southwest Salt Lake Valley.",
};

export const localOfferings = [
  {
    slug: "hvac-installation",
    title: "HVAC Installation & Replacement",
    summary: "Plan a new heating and cooling system with practical options for your home, current equipment, and comfort needs.",
    details: [
      "Replacement planning for existing furnace and air-conditioning systems",
      "New HVAC system installation for homes that need a complete heating and cooling solution",
      "System options for traditional furnace and AC setups, heat pumps, and mini-split applications",
    ],
    faqs: [
      ["When should I consider replacing my HVAC system?", "If your system has repeated problems, does not keep the home comfortable, or no longer fits your needs, request an appointment to discuss the condition of the equipment and available options."],
      ["Can you help me compare HVAC system options?", "Yes. Include details about the current system, the rooms or areas that need attention, and your goals for heating and cooling so the team can discuss appropriate next steps."],
      ["What should I include in an installation request?", "Share the service address, the type of system you have now, the problem or project goal, and the best way to reach you."],
    ],
  },
  {
    slug: "ac-installation",
    title: "Air Conditioning Installation",
    summary: "Plan an air-conditioning installation or replacement project around your home, existing equipment, and cooling needs.",
    details: [
      "Air-conditioning installation and replacement planning for existing cooling equipment",
      "Project discussions for homes with cooling concerns, aging AC equipment, or a new installation need",
      "System options based on the home, current setup, and desired cooling comfort",
    ],
    faqs: [
      ["When should I consider replacing an air conditioner?", "If the current air conditioner is no longer keeping the home comfortable or has recurring problems, request an appointment to discuss the equipment and available options."],
      ["Can you help me plan a new AC installation?", "Yes. Share the current system, the cooling concerns you are experiencing, and the service address so the team can discuss the next step."],
      ["What should I include in an AC installation request?", "Include the service address, the existing equipment if known, the rooms or areas affected, and the best way to contact you."],
    ],
  },
  {
    slug: "furnace-installation",
    title: "Furnace Installation",
    summary: "Plan a furnace installation or replacement project based on your home, existing heating equipment, and comfort needs.",
    details: [
      "Furnace installation and replacement planning for homes with aging or unreliable heating equipment",
      "Project discussions for no-heat concerns, repeated furnace problems, or a planned heating upgrade",
      "Heating system options based on the current setup and the needs of the home",
    ],
    faqs: [
      ["When should I consider replacing a furnace?", "If the furnace has recurring issues, is not keeping the home comfortable, or no longer fits your heating needs, request an appointment to discuss the current equipment and options."],
      ["Can you help me plan a new furnace installation?", "Yes. Share the current heating system, the concerns you have noticed, and the service address so the team can discuss appropriate next steps."],
      ["What should I include in a furnace installation request?", "Include the service address, the existing heating equipment if known, the comfort concern or project goal, and your preferred contact information."],
    ],
  },
  {
    slug: "heat-pump-installation",
    title: "Heat Pump Installation",
    summary: "Explore heat-pump installation options for year-round heating and cooling in your home.",
    details: [
      "Heat-pump options for combined heating and cooling",
      "Replacement planning when an existing system is no longer meeting comfort needs",
      "Project discussions based on the home, current equipment, and heating and cooling goals",
    ],
    faqs: [
      ["What does a heat pump do?", "A heat pump can provide both heating and cooling. Share your current equipment and comfort concerns so the team can discuss whether it may fit your project."],
      ["Can a heat pump replace a traditional HVAC system?", "System choices depend on the home and existing equipment. Request an appointment to review the current setup and the options available."],
      ["How do I start a heat-pump installation request?", "Send the service address, the type of equipment you have now, and the reason you are considering a heat pump."],
    ],
  },
  {
    slug: "mini-split-installation",
    title: "Mini-Split Installation",
    summary: "Discuss ductless mini-split options for rooms, additions, and spaces that need targeted heating and cooling.",
    details: [
      "Ductless mini-split installation for rooms and areas with focused comfort needs",
      "Project planning for additions, home offices, and other spaces where traditional ductwork may not fit",
      "Heating and cooling options tailored to the space and current system setup",
    ],
    faqs: [
      ["What is a mini-split system?", "A mini-split is a ductless heating and cooling option that can serve a specific room or area. The team can discuss whether it fits your space and project goals."],
      ["Can a mini-split help with one uncomfortable room?", "Targeted comfort needs are one reason homeowners consider mini-splits. Include the room, the existing system, and the issue when you request an appointment."],
      ["What details help with a mini-split request?", "Share the service address, the rooms involved, the current heating and cooling setup, and your preferred contact information."],
    ],
  },
  {
    slug: "hvac-maintenance",
    title: "HVAC Maintenance",
    summary: "Plan HVAC maintenance and tune-up support to help keep heating and cooling equipment operating reliably.",
    details: [
      "Maintenance discussions for furnaces, air conditioners, heat pumps, and mini-split systems",
      "Seasonal tune-up planning for homeowners who want to review system performance",
      "Appointment requests based on the equipment type, current symptoms, and service address",
    ],
    faqs: [
      ["What systems can receive HVAC maintenance?", "Maintenance needs vary by system. Include whether you have a furnace, AC unit, heat pump, or mini-split when you request an appointment."],
      ["Should I request maintenance if my system still runs?", "A maintenance visit can be useful when you want to discuss performance, recurring concerns, or seasonal preparation before a larger issue develops."],
      ["How do I request HVAC maintenance?", "Send the service address, equipment type, any concerns you have noticed, and the best time to contact you."],
    ],
  },
  {
    slug: "indoor-air-quality",
    title: "Indoor Air Quality Services",
    summary: "Discuss indoor air quality options for a home with comfort concerns such as dust, odors, dry air, or uneven airflow.",
    details: [
      "Indoor air quality discussions for homes with dust, odors, dry-air, or airflow concerns",
      "Options that can be considered alongside the existing heating and cooling system",
      "Appointment requests based on the home, current equipment, and the indoor comfort concern",
    ],
    faqs: [
      ["What is indoor air quality service?", "Indoor air quality service starts with discussing the home, current HVAC equipment, and the comfort concerns you have noticed so the appropriate options can be reviewed."],
      ["Can HVAC equipment affect indoor comfort?", "Heating and cooling equipment, airflow, and the home environment can all be relevant. Include the concerns you are noticing when you request an appointment."],
      ["What should I include in an indoor air quality request?", "Share the service address, current HVAC setup, the rooms affected, and concerns such as dust, odors, dry air, or uneven airflow."],
    ],
  },
] as const;

export type LocalOfferingSlug = (typeof localOfferings)[number]["slug"];

export function getLocalOffering(slug: string) {
  return localOfferings.find((offering) => offering.slug === slug);
}