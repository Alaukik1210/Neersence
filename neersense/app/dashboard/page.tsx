
import { DashboardHeader } from "@/components/dashboard-header"
import { DashboardContent } from "@/components/dashboard-content"
import Footer from "@/components/Footer"
import GlassyNavbar from "@/components/Navbar"

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-primary3">
      <GlassyNavbar />
      <main className="pt-28">
        <DashboardHeader />
        <DashboardContent />
      </main>
      <Footer />
    </div>
  )
}
