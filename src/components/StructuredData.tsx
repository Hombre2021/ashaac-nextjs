import { buildLocalBusinessSchema, buildOrganizationSchema, buildWebsiteSchema } from "@/lib/seo";

export default function StructuredData() {
  const schemaGraph = {
    "@context": "https://schema.org",
    "@graph": [buildLocalBusinessSchema(), buildOrganizationSchema(), buildWebsiteSchema()],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaGraph) }}
    />
  );
}
