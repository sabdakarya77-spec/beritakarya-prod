import { buildJsonLd, JsonLdObject } from '../../lib/structuredData'

interface JsonLdProps {
  data: JsonLdObject | JsonLdObject[]
  id?: string
}

export function JsonLd({ data, id }: JsonLdProps) {
  return (
    <script
      type="application/ld+json"
      id={id}
      dangerouslySetInnerHTML={{ __html: buildJsonLd(data as JsonLdObject) }}
    />
  )
}
