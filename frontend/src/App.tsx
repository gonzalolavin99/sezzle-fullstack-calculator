import { Calculator } from './features/calculator/Calculator.tsx'

interface AppProps {
  /** Backend origin, passed through for tests; the app uses the same origin by default. */
  baseUrl?: string
}

export function App({ baseUrl }: AppProps) {
  return (
    <main className="min-h-screen px-4 py-6 sm:px-8 sm:py-10">
      <div className="mx-auto max-w-5xl">
        <header className="mb-6">
          <h1 className="text-2xl font-semibold sm:text-3xl">Calculator</h1>
        </header>
        <Calculator baseUrl={baseUrl} />
      </div>
    </main>
  )
}
