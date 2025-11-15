"use client"

import { useState } from "react"
import { ApplicationsListView } from "./applicationsListView"
import { ApplicationsCardView } from "./applicationsCardView"
import { columns } from "./columns"
import mockData from "../mock.json"
import { Button } from "@/components/ui/button"
import { ApplicationsCardView } from "./applicationsCardView" 

export default function PositionPage() {
  const [activeTab, setActiveTab] = useState<"overview" | "applicationsList" | "applicationsCard">("applicationsCard")

  return (
    <div className="flex min-h-screen flex-col">
      {/* Header */}
      <div className="border-b">
        <div className="px-8 py-4">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold">Developer</h1>
                <Button variant="outline" size="sm">
                  <Pencil className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-sm text-muted-foreground">
                I AM A DESCRIPTION!!!
              </p>
            </div>
            <Badge
              variant={positionStatus === "open" ? "success" : "destructive"}
              className="px-4 py-2 text-base"
            >
              {positionStatus === "open" ? "Open" : "Closed"}
            </Badge>
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
            onClick={() => setActiveTab("applicationsList")}
            className={`px-4 py-3 text-sm font-medium transition-colors ${
              activeTab === "applicationsList" || activeTab === "applicationsCard"
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
        {activeTab === "applicationsList" && (
          <ApplicationsListView columns={columns} data={mockData.applications} />
        )}
        {activeTab === "applicationsCard" && (
          <ApplicationsCardView columns={columns} data={mockData.applications} />
        )}
      </div>
    </div>
  )
}
