import { Button } from '@/components/ui/button'
import { MonitoringPage } from '@/features/monitoring/monitoring-page'
import { useCounterStore } from '@/stores/counter-store'

function App() {
  const count = useCounterStore((state) => state.count)
  const increment = useCounterStore((state) => state.increment)

  // ponytail: one path check instead of a router; add react-router when a second page lands.
  if (window.location.pathname === '/monitoring') return <MonitoringPage />

  return (
    <main className="flex min-h-svh flex-col items-center justify-center gap-4">
      <h1 className="text-2xl font-semibold">frontend</h1>
      <Button onClick={increment}>Count is {count}</Button>
    </main>
  )
}

export default App
