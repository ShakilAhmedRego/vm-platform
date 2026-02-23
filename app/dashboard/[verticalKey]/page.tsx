'use client'

import VerticalRenderer from '@/components/verticals/VerticalRenderer'

export default function VerticalPage({ params }: { params: { verticalKey: string } }) {
  return <VerticalRenderer verticalKey={params.verticalKey} />
}
