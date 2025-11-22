"use client"

import { Button } from "@/components/ui/button"

import { Upload, Download, Filter } from "lucide-react"
import { useAuth } from "@/lib/auth_context"

export function DashboardHeader() {

  const {user} = useAuth() 
 const isResearcher = user && user.role === 'RESEARCHER'

  return (
    <section className="py-8 px-4 sm:px-6 lg:px-8 border-b">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">
              <span className="text-white">Data Dashboard</span>
            </h1>
            <p className="mt-2 text-lg text-muted-foreground">
              Interactive visualization and analysis of ARGO float oceanographic data
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            {/* <Card className="p-4">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <GraduationCap className="h-4 w-4" />
                  <span className="text-sm">Student Mode</span>
                </div>
                <Switch checked={isStudentMode} onCheckedChange={setIsStudentMode} />
              </div>
              <div className="flex items-center justify-between gap-4 mt-2">
                <div className="flex items-center gap-2">
                  <Microscope className="h-4 w-4" />
                  <span className="text-sm">Researcher Mode</span>
                </div>
                <Switch checked={!isStudentMode} onCheckedChange={(checked) => setIsStudentMode(!checked)} />
              </div>
            </Card> */}
              {isResearcher && (
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                <Upload className="h-4 w-4 mr-2" />
                Upload NetCDF
              </Button>
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export Data
              </Button>
             

            </div>
        )}
          </div>
          {/* <Button
  size="sm"
  className="relative bg-gradient-to-r from-orange-500 to-orange-600 text-white cursor-pointer font-semibold shadow-lg shadow-orange-500/50 hover:from-orange-600 hover:to-orange-700 transition-all duration-300 ease-in-out rounded-xl px-4 py-2 overflow-hidden"
>
  <span className="absolute inset-0 bg-orange-400 opacity-30 blur-xl animate-pulse"></span>
  
  <span className="relative z-10">AI Prediction</span>
</Button> */}
        </div>

        
      </div>
    </section>
  )
}
