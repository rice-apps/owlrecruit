"use client"

import { useState } from "react"
import { ApplicationsListView } from "./applicationsListView"
import { columns } from "./columns"
import mockData from "../mock.json"
import { Button } from "@/components/ui/button"

export default function PositionPage() {
  const [activeTab, setActiveTab] = useState<"overview" | "applications">("applications")

  return (
    <div className="flex min-h-screen flex-col">
      {/* Header */}
      <div className="border-b">
        <div className="flex h-16 items-center justify-between px-8">
          <h1 className="text-2xl font-bold">Developer</h1>
          <div className="flex items-center gap-2">
            <Button variant="outline">Edit</Button>
            <Button>Open</Button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b">
        <div className="flex px-8">
          <button
            onClick={() => setActiveTab("overview")}
            className={`px-4 py-3 text-sm font-medium transition-colors ${
              activeTab === "overview"
                ? "border-b-2 border-primary text-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab("applications")}
            className={`px-4 py-3 text-sm font-medium transition-colors ${
              activeTab === "applications"
                ? "border-b-2 border-primary text-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Applications
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 px-8 py-6">
        {activeTab === "overview" && (
          <div className="rounded-lg border bg-card p-8 text-center">
            <p className="text-muted-foreground">Overview content coming soon</p>
          </div>
        )}
        {activeTab === "applications" && (
          <ApplicationsListView columns={columns} data={mockData.applications} />
        )}
      </div>
    </div>
  )
}
