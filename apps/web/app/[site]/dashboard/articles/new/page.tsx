import { Editor } from '../../../../../components/editor/Editor'

interface Props {
  params: Promise<{ site: string }>
}

export default async function NewArticlePage({ params }: Props) {
  const resolvedParams = await params
  return <Editor articleId="new" siteId={resolvedParams.site} />
}

export async function generateMetadata({ params }: Props) {
  const resolvedParams = await params
  return { title: `Tulis Post Baru — ${resolvedParams.site} | BeritaKarya` }
}
