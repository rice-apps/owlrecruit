"use client"

import * as React from "react"
// TODO: Replace these imports with real data fetching from supabase.
import mockApps from "../mockApplications.json"

type AppRow = {
  id: string
  applicant_id: string
  name?: string
  form_responses: Record<string, any>
}

export default function QuestionsComponent() {
  const apps: AppRow[] = (mockApps as any).applications || []
  // We assume each application row includes `name`.

  // build list of question keys from applications (union of keys)
  const questionKeys: string[] = React.useMemo(() => {
    const keys = new Set<string>()
    apps.forEach((a) => {
      const fr = a.form_responses || {}
      Object.keys(fr).forEach((k) => keys.add(k))
    })
    return keys.size ? Array.from(keys) : []
  }, [apps])

  // Default selected question index. 
  const [questionIndex, setQuestionIndex] = React.useState(0)
  const questionKey = questionKeys[questionIndex] || questionKeys[0]

  // If there are no question keys in the data, show a clear empty state
  if (questionKeys.length === 0) {
    return (
      <div className="rounded-lg border bg-card p-8 text-center">
        <p className="text-muted-foreground">No question responses available yet.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">Question {questionIndex + 1}</p>
          <h3 className="text-2xl font-bold">{questionKey}</h3>

          {/* <- question select -> */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setQuestionIndex((p) => Math.max(0, p - 1))}
              disabled={questionIndex <= 0}
              className="px-3 py-1 rounded border disabled:opacity-50"
              aria-label="Previous question"
            >
              ‹
            </button>
            <button
              onClick={() => setQuestionIndex((p) => Math.min(questionKeys.length - 1, p + 1))}
              disabled={questionIndex >= questionKeys.length - 1}
              className="px-3 py-1 rounded border disabled:opacity-50"
              aria-label="Next question"
            >
              ›
            </button>
          </div>
        </div>
      </div>

      <div className="rounded-lg border bg-card overflow-hidden">
        {/* Header row */}
        <div className="grid grid-cols-[200px_1fr_220px] items-center bg-white px-6 py-4 border-b">
          <div className="font-medium">Name</div>
          <div className="font-medium">Submission</div>
          <div className="font-medium">Comments</div>
        </div>

        {/* Rows */}
        <div>
          {apps.map((app, i) => {
            const name = app.name || app.applicant_id.slice(0, 8)
            const answer = app.form_responses?.[questionKey] || ["", ""]
            const response = Array.isArray(answer) ? answer[0] : String(answer)
            const comment = Array.isArray(answer) ? answer[1] || "" : ""

            return (
              <div
                key={app.id}
                className="grid grid-cols-[200px_1fr_220px] gap-0 items-start px-6 py-6 border-b last:border-b-0 bg-white"
              >
                <div className="text-base">{name}</div>
                <div className="text-base text-muted-foreground pr-6 whitespace-pre-wrap">{response}</div>
                <div className="text-base">{comment}</div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
