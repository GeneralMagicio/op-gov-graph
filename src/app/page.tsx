import { Suspense } from 'react'
import GraphPage from './graph/GraphPage'

export default function Home() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <GraphPage />
    </Suspense>
  )
}
