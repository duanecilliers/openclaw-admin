import Header from "./components/layout/Header"
import TabNav from "./components/layout/TabNav"

export default function App() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-950/40 via-background to-purple-950/40">
      <Header />
      <main className="mx-auto max-w-7xl px-4 pt-4">
        <TabNav />
      </main>
    </div>
  )
}
