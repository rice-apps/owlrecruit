"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { Star, ChevronDown, ExternalLink, Mail, User, Users, FileText, MessageSquare } from "lucide-react"

// Mock data - replace with actual data fetching
const mockApplicationData = {
  applicant: {
    name: "Emily Chen",
    email: "ec277@rice.edu",
  },
  position: "Developer",
  status: "Under Review",
  resumeLink: "https://docs.google.com/document/d/1T5Ps5CBTiCVaF3qZPPfC6LjWOZb3NwwnbzcFGORwe58/edit?tab=t.0",
  questions: [
    {
      id: "1",
      number: 1,
      question: "Why do you want to join RiceApps?",
      answer:
        "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.",
      comments: [
        {
          id: "c1",
          author: "John Doe",
          text: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.",
          timestamp: "2024-01-15T10:30:00Z",
        },
      ],
    },
    {
      id: "2",
      number: 2,
      question: "What experience do you have building apps?",
      answer:
        "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.",
      comments: [
        {
          id: "c2",
          author: "Jane Smith",
          text: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.",
          timestamp: "2024-01-15T11:45:00Z",
        },
      ],
    },
  ],
  reviewers: ["John Doe", "Jane Smith"],
  ratings: [
    { reviewer: "John Doe", rating: 4.5 },
    { reviewer: "Jane Smith", rating: 4.0 },
  ],
  isAdmin: true, // Replace with actual admin check
}

const availableReviewers = [
  { id: "1", name: "John Doe" },
  { id: "2", name: "Jane Smith" },
  { id: "3", name: "Bob Johnson" },
  { id: "4", name: "Alice Williams" },
]

const statusOptions = [
  "Pending",
  "Under Review",
  "Interviewing",
  "Accepted",
  "Rejected",
]

export default function ApplicationFeedbackPage() {
  const [activeTab, setActiveTab] = useState<"submission" | "files" | "feedback">("submission")
  const [status, setStatus] = useState(mockApplicationData.status)
  const [rating, setRating] = useState(0)
  const [hoveredRating, setHoveredRating] = useState(0)
  const [writtenFeedback, setWrittenFeedback] = useState("")
  const [interviewNotes, setInterviewNotes] = useState("")
  const [selectedReviewers, setSelectedReviewers] = useState<string[]>(
    mockApplicationData.reviewers
  )
  const [questionComments, setQuestionComments] = useState<Record<string, string>>({})
  const [expandedQuestions, setExpandedQuestions] = useState<Record<string, boolean>>({})

  const averageRating =
    mockApplicationData.ratings.reduce((acc, r) => acc + r.rating, 0) /
    mockApplicationData.ratings.length

  const getStatusVariant = (status: string) => {
    switch (status.toLowerCase()) {
      case "accepted":
        return "success"
      case "rejected":
        return "destructive"
      case "under review":
        return "secondary"
      case "interviewing":
        return "outline"
      default:
        return "secondary"
    }
  }

  const toggleReviewer = (reviewerName: string) => {
    setSelectedReviewers((prev) =>
      prev.includes(reviewerName)
        ? prev.filter((r) => r !== reviewerName)
        : [...prev, reviewerName]
    )
  }

  return (
    <div className="flex min-h-screen flex-col">
      {/* Header */}
      <div className="border-b bg-background">
        <div className="px-8 py-6">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold">RiceApps - {mockApplicationData.position}</h1>
            <h2 className="text-2xl font-semibold">{mockApplicationData.applicant.name}</h2>
            <p className="text-sm text-muted-foreground">{mockApplicationData.applicant.email}</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b bg-background">
        <div className="flex px-8">
          <button
            onClick={() => setActiveTab("submission")}
            className={`px-4 py-3 text-sm font-medium transition-colors ${
              activeTab === "submission"
                ? "border-b-2 border-primary text-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Submission
          </button>
          <button
            onClick={() => setActiveTab("files")}
            className={`px-4 py-3 text-sm font-medium transition-colors ${
              activeTab === "files"
                ? "border-b-2 border-primary text-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Files
          </button>
          <button
            onClick={() => setActiveTab("feedback")}
            className={`px-4 py-3 text-sm font-medium transition-colors ${
              activeTab === "feedback"
                ? "border-b-2 border-primary text-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Feedback
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-1">
        {/* Main Content Area */}
        <div className="flex-1 px-8 py-6">
          {activeTab === "submission" && (
            <div className="space-y-6">
              {mockApplicationData.questions.map((q) => (
                <Card key={q.id}>
                  <CardHeader>
                    <CardTitle className="text-lg">
                      Question {q.number}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex gap-6">
                      {/* Question and Answer - Left 2/3 */}
                      <div className="flex-[2] space-y-3">
                        <p className="font-medium text-base">{q.question}</p>
                        <p className="text-muted-foreground leading-relaxed">
                          {q.answer}
                        </p>
                      </div>

                      {/* Comment Section - Right 1/3 */}
                      <div className="flex-1 border-l pl-6">
                        <div className="space-y-4">
                          <div className="flex items-center gap-2">
                            <MessageSquare className="h-4 w-4" />
                            <Label className="text-sm font-semibold">Reviewer Comments</Label>
                          </div>

                          {/* Existing Comments */}
                          {q.comments && q.comments.length > 0 && (
                            <div className="space-y-3">
                              {q.comments.map((comment) => (
                                <div key={comment.id} className="rounded-lg bg-muted p-3 space-y-1">
                                  <div className="flex items-center justify-between">
                                    <span className="text-sm font-semibold">{comment.author}</span>
                                    <span className="text-xs text-muted-foreground">
                                      {new Date(comment.timestamp).toLocaleDateString()}
                                    </span>
                                  </div>
                                  <p className="text-sm text-muted-foreground leading-relaxed">
                                    {comment.text}
                                  </p>
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Add New Comment */}
                          <div className="space-y-2">
                            <Textarea
                              placeholder="Add your feedback for this question..."
                              value={questionComments[q.id] || ""}
                              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                                setQuestionComments(prev => ({
                                  ...prev,
                                  [q.id]: e.target.value
                                }))
                              }
                              className="min-h-[100px]"
                            />
                            <Button
                              className="w-full"
                              size="sm"
                              disabled={!questionComments[q.id]?.trim()}
                            >
                              Add Comment
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
          {activeTab === "files" && (
            <div className="space-y-4">
              {mockApplicationData.resumeLink ? (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <FileText className="h-5 w-5" />
                        Resume
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        asChild
                      >
                        <a
                          href={mockApplicationData.resumeLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2"
                        >
                          <ExternalLink className="h-4 w-4" />
                          Open in New Tab
                        </a>
                      </Button>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="w-full h-[800px] border rounded-md overflow-hidden">
                      <iframe
                        src={mockApplicationData.resumeLink.replace('/edit', '/preview')}
                        className="w-full h-full"
                        title="Resume"
                      />
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <div className="rounded-lg border bg-card p-8 text-center">
                  <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No resume uploaded</p>
                </div>
              )}
            </div>
          )}
          {activeTab === "feedback" && (
            <div className="space-y-6">
{/* Admin: Assign Reviewers */}
              {mockApplicationData.isAdmin && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="h-5 w-5" />
                      Assign Reviewers
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <Label>Selected Reviewers ({selectedReviewers.length})</Label>
                      <div className="flex flex-wrap gap-2">
                        {selectedReviewers.map((reviewer) => (
                          <Badge key={reviewer} variant="secondary" className="px-3 py-1">
                            {reviewer}
                          </Badge>
                        ))}
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="outline" className="w-full">
                            <Users className="mr-2 h-4 w-4" />
                            Manage Reviewers
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start" className="w-56">
                          <DropdownMenuLabel>Available Reviewers</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          {availableReviewers.map((reviewer) => (
                            <DropdownMenuItem
                              key={reviewer.id}
                              onClick={() => toggleReviewer(reviewer.name)}
                            >
                              <div className="flex items-center justify-between w-full">
                                <span>{reviewer.name}</span>
                                {selectedReviewers.includes(reviewer.name) && (
                                  <Badge variant="secondary" className="ml-2">
                                    ✓
                                  </Badge>
                                )}
                              </div>
                            </DropdownMenuItem>
                          ))}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardContent>
                </Card>
              )}
              {/* Status Change */}
              <Card>
                <CardHeader>
                  <CardTitle>Application Status</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-3">
                    <Label>Current Status:</Label>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" className="gap-2">
                          <Badge variant={getStatusVariant(status)}>
                            {status}
                          </Badge>
                          <ChevronDown className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="start">
                        <DropdownMenuLabel>Change Status</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuRadioGroup value={status} onValueChange={setStatus}>
                          {statusOptions.map((option) => (
                            <DropdownMenuRadioItem key={option} value={option}>
                              {option}
                            </DropdownMenuRadioItem>
                          ))}
                        </DropdownMenuRadioGroup>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardContent>
              </Card>

              {/* Rating System */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>Rating</span>
                    <div className="flex items-center gap-2">
                      <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                      <span className="text-2xl font-bold">{averageRating.toFixed(1)}</span>
                      <span className="text-sm text-muted-foreground">/ 5.0</span>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Your Rating</Label>
                    <div className="flex gap-1 mt-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          onMouseEnter={() => setHoveredRating(star)}
                          onMouseLeave={() => setHoveredRating(0)}
                          onClick={() => setRating(star)}
                          className="transition-transform hover:scale-110"
                        >
                          <Star
                            className={`h-8 w-8 ${
                              star <= (hoveredRating || rating)
                                ? "fill-yellow-400 text-yellow-400"
                                : "text-gray-300"
                            }`}
                          />
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <Label className="text-muted-foreground">All Ratings</Label>
                    <div className="mt-2 space-y-2">
                      {mockApplicationData.ratings.map((r, idx) => (
                        <div key={idx} className="flex items-center justify-between">
                          <span className="text-sm">{r.reviewer}</span>
                          <div className="flex items-center gap-1">
                            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                            <span className="font-medium">{r.rating.toFixed(1)}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
              {/* Interview Notes */}
              <Card>
                <CardHeader>
                  <CardTitle>Interview Notes</CardTitle>
                </CardHeader>
                <CardContent>
                  <Textarea
                    placeholder="Add notes from interviews, including technical questions, cultural fit observations, etc..."
                    value={interviewNotes}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setInterviewNotes(e.target.value)}
                    className="min-h-[150px]"
                  />
                  <Button className="mt-3">Save Notes</Button>
                </CardContent>
              </Card>

            </div>
          )}
        </div>

      </div>
    </div>
  )
}
