"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { ChevronRight } from "lucide-react";

interface Question {
  id: string;
  question_text: string;
  is_required: boolean | null;
  sort_order: number | null;
}

interface Application {
  id: string;
  form_responses: any;
}

interface QuestionsTabProps {
  openingId: string;
}

export function QuestionsTab({ openingId }: QuestionsTabProps) {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedQuestionId, setSelectedQuestionId] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      const supabase = createClient();
      
      // Fetch questions
      const { data: questionsData, error: questionsError } = await supabase
        .from("questions")
        .select("*")
        .eq("opening_id", openingId)
        .order("sort_order", { ascending: true });

      // Fetch applications with form responses
      const { data: applicationsData, error: applicationsError } = await supabase
        .from("applications")
        .select("id, form_responses")
        .eq("opening_id", openingId);

      if (!questionsError && questionsData) {
        setQuestions(questionsData);
      }
      
      if (!applicationsError && applicationsData) {
        setApplications(applicationsData);
      }
      
      setLoading(false);
    };

    fetchData();
  }, [openingId]);

  const handleQuestionClick = (questionId: string) => {
    setSelectedQuestionId(selectedQuestionId === questionId ? null : questionId);
  };

  const getResponsesForQuestion = (questionIndex: number) => {
    return applications
      .map((app) => {
        const responses = app.form_responses as Record<string, any> || {};
        const values = Object.values(responses);
        return values[questionIndex];
      })
      .filter((response) => response !== undefined && response !== null && response !== "");
  };

  if (loading) {
    return (
      <div className="py-12 text-center text-gray-500">
        <p>Loading questions...</p>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="py-12 text-center text-gray-500">
        <p>No questions configured for this opening.</p>
      </div>
    );
  }

  return (
    <div className="py-4 space-y-1">
      {questions.map((question, index) => {
        const responses = getResponsesForQuestion(index);
        const isExpanded = selectedQuestionId === question.id;
        
        return (
          <div key={question.id}>
            <div
              className="py-3 px-2 hover:bg-gray-50 transition-colors cursor-pointer rounded-sm border-b border-gray-100"
              onClick={() => handleQuestionClick(question.id)}
            >
              <div className="flex items-center justify-between gap-4">
                <div className="flex-1">
                  {/* Question counter */}
                  <div className="text-xs text-gray-500 mb-1">
                    Question {index + 1} of {questions.length}
                  </div>

                  {/* Question text */}
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-medium">
                      {question.question_text}
                    </h2>
                    {question.is_required && (
                      <span className="text-xs text-red-600">*</span>
                    )}
                  </div>
                </div>

                {/* Chevron icon */}
                <ChevronRight className={`h-5 w-5 text-gray-400 shrink-0 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
              </div>
            </div>
            
            {/* Responses list */}
            {isExpanded && (
              <div className="py-3 px-4 bg-gray-50/50 space-y-3">
                {responses.length > 0 ? (
                  responses.map((response, idx) => (
                    <div key={idx} className="py-3 px-4 bg-white/80 backdrop-blur-sm rounded-lg text-sm text-gray-800 shadow-sm hover:shadow-md transition-shadow">
                      {response}
                    </div>
                  ))
                ) : (
                  <div className="py-3 text-sm text-gray-400 text-center italic">
                    No responses yet
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
