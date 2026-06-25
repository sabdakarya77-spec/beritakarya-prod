import { Editor } from '../../../../../../components/editor/Editor'

interface Props {
  params: Promise<{ site: string; id: string }>
}

export default async function ArticleEditorPage({ params }: Props) {
  const resolvedParams = await params
  return <Editor articleId={resolvedParams.id} siteId={resolvedParams.site} />
}

export async function generateMetadata({ params }: Props) {
  const resolvedParams = await params
  return { title: `Editor Post — ${resolvedParams.site} | BeritaKarya` }
}