import type { Metadata } from "next";
import { notFound } from "next/navigation";
import LocalOfferingPage from "@/components/LocalOfferingPage";
import { cityNames, getLocalOffering, localCities, localOfferings, type LocalCitySlug } from "@/lib/localOfferings";

type PageProps = {
  params: Promise<{ city: string; offering: string }>;
};

function getPageData(city: string, offering: string) {
  if (!localCities.includes(city as LocalCitySlug)) {
    return null;
  }

  const offeringData = getLocalOffering(offering);
  if (!offeringData) {
    return null;
  }

  const citySlug = city as LocalCitySlug;
  return { citySlug, cityName: cityNames[citySlug], offering: offeringData };
}

export function generateStaticParams() {
  return localCities.flatMap((city) => localOfferings.map((offering) => ({ city, offering: offering.slug })));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { city, offering } = await params;
  const page = getPageData(city, offering);
  if (!page) {
    return {};
  }

  return {
    title: `${page.offering.title} in ${page.cityName}, UT`,
    description: `${page.offering.title} for homeowners in ${page.cityName}, Utah. Request an appointment with All Solutions Heating and Air Conditioning.`,
    alternates: { canonical: `/services/${page.citySlug}/${page.offering.slug}` },
  };
}

export default async function Page({ params }: PageProps) {
  const { city, offering } = await params;
  const page = getPageData(city, offering);
  if (!page) {
    notFound();
  }

  return <LocalOfferingPage city={page.cityName} citySlug={page.citySlug} offering={page.offering} />;
}