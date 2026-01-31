"use client";

import { useState, useRef, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Papa from "papaparse";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  ChevronRight,
  CloudUpload,
  FileSpreadsheet,
  Folder,
  Plus,
  File as FileIcon,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

type ColumnMapping = {
  name: string;
  netid: string;
  year: string;
  major: string;
  [key: string]: string; // Allow dynamic keys for custom questions
};

type CustomQuestion = {
  id: string;
  text: string;
};

export function UploadTab() {
  const params = useParams();
  const router = useRouter();
  const openingId = params.openingId as string;
  const orgId = params.orgId as string;

  const [currentStep, setCurrentStep] = useState(1);
  const [file, setFile] = useState<File | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [csvData, setCsvData] = useState<any[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [columnMappings, setColumnMappings] = useState<ColumnMapping>({
    name: "",
    netid: "",
    year: "",
    major: "",
  });
  const [customQuestions, setCustomQuestions] = useState<CustomQuestion[]>([]);
  const [isQuestionModalOpen, setIsQuestionModalOpen] = useState(false);
  const [newQuestionText, setNewQuestionText] = useState("");
  const [uploadErrors, setUploadErrors] = useState<
    { row?: number; error: string }[]
  >([]);
  const [successCount, setSuccessCount] = useState(0);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const steps = [1, 2, 3, 4];

  // State for existing applicants optimization
  const [existingApplicants, setExistingApplicants] = useState<
    Map<string, { applicantId: string; name: string }>
  >(new Map());

  // Fetch existing applicants for this opening to optimize upload
  useEffect(() => {
    const fetchExistingApplicants = async () => {
      try {
        const response = await fetch(
          `/api/org/${orgId}/opening/${openingId}/applicants`,
        );
        if (response.ok) {
          const data = await response.json();
          const map = new Map();
          data.applicants.forEach((app: any) => {
            map.set(app.netId, {
              applicantId: app.applicantId,
              name: app.name,
            });
          });
          setExistingApplicants(map);
        }
      } catch (error) {
        console.error("Failed to fetch existing applicants:", error);
      }
    };
    if (openingId && orgId) {
      fetchExistingApplicants();
    }
  }, [openingId, orgId]);

  const handleNext = () => {
    if (currentStep < 4) setCurrentStep(currentStep + 1);
  };

  const handleBack = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  };

  // ... rest of component starts again below line 79 ...

  const parseCSVHeaders = (file: File) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: "greedy",
      complete: (results) => {
        if (results.data && results.data.length > 0) {
          const headers = Object.keys(results.data[0] as object);
          setCsvHeaders(headers);
          setCsvData(results.data);
        }
      },
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      parseCSVHeaders(selectedFile);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile.name.endsWith(".csv")) {
        setFile(droppedFile);
        parseCSVHeaders(droppedFile);
      } else {
        alert("Please upload a CSV file");
      }
    }
  };

  const handleAddQuestion = () => {
    if (!newQuestionText.trim()) return;

    const newQuestion: CustomQuestion = {
      id: `q_${Date.now()}`,
      text: newQuestionText,
    };

    setCustomQuestions([...customQuestions, newQuestion]);
    setColumnMappings({ ...columnMappings, [newQuestion.id]: "" });
    setNewQuestionText("");
    setIsQuestionModalOpen(false);
  };

  const handleDeleteQuestion = (questionId: string) => {
    setCustomQuestions(customQuestions.filter((q) => q.id !== questionId));
    const newMappings = { ...columnMappings };
    delete newMappings[questionId];
    setColumnMappings(newMappings);
  };

  const updateMapping = (key: string, value: string) => {
    setColumnMappings((prev) => ({ ...prev, [key]: value }));
  };

  // Get available columns for a specific field (excluding already mapped ones)
  const getAvailableColumns = (currentField: string) => {
    const mappedColumns = Object.entries(columnMappings)
      .filter(([key, value]) => key !== currentField && value !== "")
      .map(([, value]) => value);
    return csvHeaders.filter((header) => !mappedColumns.includes(header));
  };

  // Validation for Step 3
  const isStep3Valid =
    columnMappings.name !== "" && columnMappings.netid !== "";

  const handleFinishSetup = async () => {
    setIsUploading(true);
    setUploadErrors([]);
    setSuccessCount(0);

    try {
      // Serialize map to array of entries for JSON transport
      const existingApplicantsArray = Array.from(existingApplicants.entries());

      const response = await fetch(
        `/api/org/${orgId}/opening/${openingId}/upload`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            csvData,
            columnMappings,
            customQuestions,
            existingApplicants: existingApplicantsArray,
          }),
        },
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to upload data");
      }

      const results = await response.json();

      setSuccessCount(results.successCount);
      if (results.errors.length > 0) {
        setUploadErrors(results.errors);
        // If there were some successes, we'll still show the error list but maybe stay on the page or show a partial success state
        if (results.successCount > 0) {
          // We'll let the UI display the partial success
        }
      } else {
        // Complete success
        router.push(
          `/protected/org/${orgId}/opening/${openingId}?tab=applicants`,
        );
      }
    } catch (error: any) {
      console.error("Error uploading data:", error);
      setUploadErrors([
        { error: error.message || "An unknown error occurred" },
      ]);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="py-8 max-w-4xl">
      {/* Stepper */}
      <div className="relative flex items-center justify-between mb-12 px-4 max-w-3xl mx-auto">
        {/* Background Line */}
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-[2px] bg-gray-200 -z-10" />

        {/* Active Line - Dynamic width based on step */}
        <div
          className="absolute left-0 top-1/2 -translate-y-1/2 h-[2px] bg-cyan-500 -z-10 transition-all duration-300"
          style={{
            width: `${((currentStep - 1) / (steps.length - 1)) * 100}%`,
          }}
        />

        {steps.map((step) => {
          const isActive = step === currentStep;
          const isCompleted = step < currentStep;

          return (
            <div key={step} className="bg-gray-50 px-2">
              <div
                className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium border-2 transition-colors",
                  isActive || isCompleted
                    ? "bg-cyan-500 border-cyan-500 text-white"
                    : "bg-gray-50 border-gray-300 text-gray-400",
                )}
              >
                {step}
              </div>
            </div>
          );
        })}
      </div>

      {/* Step Content */}
      <div className="space-y-6">
        {currentStep === 1 && (
          <>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                Set Up Your Application Form
              </h2>
              <p className="text-gray-500">
                Get started by choosing how you will import your candidates.
              </p>
            </div>

            <div className="space-y-4">
              {/* Google Forms Option */}
              <Card className="p-6 hover:border-cyan-500 hover:shadow-sm cursor-pointer transition-all group border-gray-200">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-lg bg-purple-50 flex items-center justify-center text-purple-600">
                    <FileSpreadsheet className="w-6 h-6" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 mb-1 group-hover:text-cyan-600 transition-colors">
                      Google Forms
                    </h3>
                    <p className="text-sm text-gray-500">
                      Import your candidates from Google Forms.
                    </p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-cyan-500 transition-colors" />
                </div>
              </Card>

              {/* CSV Option */}
              <Card
                className="p-6 hover:border-cyan-500 hover:shadow-sm cursor-pointer transition-all group border-gray-200"
                onClick={() => setCurrentStep(2)}
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center text-gray-600">
                    <Folder className="w-6 h-6" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 mb-1 group-hover:text-cyan-600 transition-colors">
                      CSV File
                    </h3>
                    <p className="text-sm text-gray-500">
                      Import your candidates from a CSV file.
                    </p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-cyan-500 transition-colors" />
                </div>
              </Card>
            </div>
          </>
        )}

        {currentStep === 2 && (
          <>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                Upload Your CSV
              </h2>
              <p className="text-gray-500">Instructions</p>
            </div>

            <div
              className={cn(
                "border-2 border-dashed rounded-lg p-12 flex flex-col items-center justify-center transition-colors",
                isDragOver
                  ? "border-cyan-500 bg-cyan-50"
                  : "border-gray-200 bg-gray-50/50",
              )}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <input
                type="file"
                accept=".csv"
                className="hidden"
                ref={fileInputRef}
                onChange={handleFileChange}
              />

              {!file ? (
                <>
                  <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 mb-4">
                    <CloudUpload className="w-6 h-6" />
                  </div>
                  <p className="text-cyan-500 font-medium mb-1">
                    Choose CSV file or drag and drop
                  </p>
                  <Button
                    onClick={() => fileInputRef.current?.click()}
                    className="mt-4 bg-cyan-600 hover:bg-cyan-700"
                  >
                    Upload CSV
                  </Button>
                </>
              ) : (
                <>
                  <div className="w-12 h-12 rounded-full bg-cyan-100 flex items-center justify-center text-cyan-600 mb-4">
                    <FileIcon className="w-6 h-6" />
                  </div>
                  <p className="text-gray-900 font-medium mb-1">{file.name}</p>
                  <p className="text-sm text-gray-500 mb-4">
                    {(file.size / 1024).toFixed(2)} KB
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() => setFile(null)}
                      className="text-red-500 hover:text-red-600"
                    >
                      Remove
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      Change File
                    </Button>
                  </div>
                </>
              )}
            </div>

            <div className="flex justify-between pt-4">
              <Button variant="outline" onClick={handleBack} className="w-24">
                Back
              </Button>
              <Button
                onClick={handleNext}
                className="w-24 bg-cyan-500 hover:bg-cyan-600"
                disabled={!file}
              >
                Next <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </>
        )}

        {currentStep === 3 && (
          <>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                Select Application Columns
              </h2>
              <p className="text-gray-500">
                Match your CSV columns with the preset columns.
              </p>
            </div>

            <div className="space-y-6">
              <div>
                <h3 className="font-semibold text-gray-900 mb-4">
                  Key Information
                </h3>
                <div className="space-y-4 max-w-md">
                  <div className="grid grid-cols-3 items-center gap-4">
                    <label className="text-sm font-medium text-gray-700">
                      Name <span className="text-red-500">*</span>{" "}
                      <span className="text-gray-400 font-normal">
                        (required)
                      </span>
                    </label>
                    <div className="col-span-2">
                      <Select
                        value={columnMappings.name}
                        onValueChange={(val) => updateMapping("name", val)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select column" />
                        </SelectTrigger>
                        <SelectContent>
                          {getAvailableColumns("name").map((header) => (
                            <SelectItem key={header} value={header}>
                              {header}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 items-center gap-4">
                    <label className="text-sm font-medium text-gray-700">
                      NetID <span className="text-red-500">*</span>{" "}
                      <span className="text-gray-400 font-normal">
                        (required)
                      </span>
                    </label>
                    <div className="col-span-2">
                      <Select
                        value={columnMappings.netid}
                        onValueChange={(val) => updateMapping("netid", val)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select column" />
                        </SelectTrigger>
                        <SelectContent>
                          {getAvailableColumns("netid").map((header) => (
                            <SelectItem key={header} value={header}>
                              {header}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 items-center gap-4">
                    <label className="text-sm font-medium text-gray-700">
                      Year
                    </label>
                    <div className="col-span-2">
                      <Select
                        value={columnMappings.year}
                        onValueChange={(val) => updateMapping("year", val)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select column" />
                        </SelectTrigger>
                        <SelectContent>
                          {getAvailableColumns("year").map((header) => (
                            <SelectItem key={header} value={header}>
                              {header}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 items-center gap-4">
                    <label className="text-sm font-medium text-gray-700">
                      Major
                    </label>
                    <div className="col-span-2">
                      <Select
                        value={columnMappings.major}
                        onValueChange={(val) => updateMapping("major", val)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select column" />
                        </SelectTrigger>
                        <SelectContent>
                          {getAvailableColumns("major").map((header) => (
                            <SelectItem key={header} value={header}>
                              {header}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <div className="flex items-center gap-2 mb-4">
                  <h3 className="font-semibold text-gray-900">Questions</h3>
                  <Dialog
                    open={isQuestionModalOpen}
                    onOpenChange={setIsQuestionModalOpen}
                  >
                    <DialogTrigger asChild>
                      <button className="text-sm text-cyan-600 font-medium hover:text-cyan-700 hover:underline">
                        Add question
                      </button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Add New Question</DialogTitle>
                        <DialogDescription>
                          Enter the question text and map it to a CSV column.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="py-4">
                        <Label htmlFor="question" className="mb-2 block">
                          Question
                        </Label>
                        <Input
                          id="question"
                          placeholder="e.g. What is your GPA?"
                          value={newQuestionText}
                          onChange={(e) => setNewQuestionText(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") handleAddQuestion();
                          }}
                        />
                      </div>
                      <DialogFooter>
                        <Button
                          variant="outline"
                          onClick={() => setIsQuestionModalOpen(false)}
                        >
                          Cancel
                        </Button>
                        <Button
                          onClick={handleAddQuestion}
                          className="bg-cyan-500 hover:bg-cyan-600"
                        >
                          Add Question
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>

                {/* Custom Questions List */}
                {customQuestions.length > 0 && (
                  <div className="space-y-4 max-w-md">
                    {customQuestions.map((q) => (
                      <div
                        key={q.id}
                        className="grid grid-cols-3 items-center gap-4"
                      >
                        <label className="text-sm font-medium text-gray-700">
                          {q.text}
                        </label>
                        <div className="col-span-2 flex gap-2">
                          <Select
                            value={columnMappings[q.id]}
                            onValueChange={(val) => updateMapping(q.id, val)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select column" />
                            </SelectTrigger>
                            <SelectContent>
                              {getAvailableColumns(q.id).map((header) => (
                                <SelectItem key={header} value={header}>
                                  {header}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => handleDeleteQuestion(q.id)}
                            className="shrink-0"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-between pt-8">
              <Button variant="outline" onClick={handleBack} className="w-24">
                Back
              </Button>
              <Button
                onClick={handleNext}
                className="w-24 bg-cyan-500 hover:bg-cyan-600"
                disabled={!isStep3Valid}
              >
                Next <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </>
        )}

        {currentStep === 4 && (
          <>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Review</h2>
              <p className="text-gray-500">
                Review the application to ensure everything looks correct.
              </p>
            </div>

            <div className="space-y-6">
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">
                  Import Method
                </h3>
                <p className="text-sm text-gray-600">CSV File</p>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 mb-4">
                  Column Mappings
                </h3>
                <div className="space-y-2 max-w-md">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Name:</span>
                    <span className="font-medium text-gray-900">
                      {columnMappings.name}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">NetID:</span>
                    <span className="font-medium text-gray-900">
                      {columnMappings.netid}
                    </span>
                  </div>
                  {columnMappings.year && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Year:</span>
                      <span className="font-medium text-gray-900">
                        {columnMappings.year}
                      </span>
                    </div>
                  )}
                  {columnMappings.major && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Major:</span>
                      <span className="font-medium text-gray-900">
                        {columnMappings.major}
                      </span>
                    </div>
                  )}
                  {customQuestions.map(
                    (q) =>
                      columnMappings[q.id] && (
                        <div
                          key={q.id}
                          className="flex justify-between text-sm"
                        >
                          <span className="text-gray-600">{q.text}:</span>
                          <span className="font-medium text-gray-900">
                            {columnMappings[q.id]}
                          </span>
                        </div>
                      ),
                  )}
                </div>
              </div>
            </div>

            {/* Error/Success Messages */}
            {(uploadErrors.length > 0 ||
              (successCount > 0 && !isUploading)) && (
              <div
                className={cn(
                  "p-4 mt-6 rounded-lg border text-sm",
                  uploadErrors.length > 0
                    ? "bg-red-50 border-red-200 text-red-800"
                    : "bg-green-50 border-green-200 text-green-800",
                )}
              >
                {successCount > 0 && (
                  <p className="font-semibold mb-2">
                    Successfully uploaded {successCount} application
                    {successCount !== 1 ? "s" : ""}.
                  </p>
                )}
                {uploadErrors.length > 0 && (
                  <>
                    <p className="font-semibold mb-1">
                      Errors encountered during upload:
                    </p>
                    <ul className="list-disc pl-5 space-y-1">
                      {uploadErrors.map((err, idx) => (
                        <li key={idx}>
                          {err.row ? `Row ${err.row}: ` : ""}
                          {err.error}
                        </li>
                      ))}
                    </ul>
                  </>
                )}
              </div>
            )}

            <div className="flex justify-between pt-8">
              <Button variant="outline" onClick={handleBack} className="w-24">
                Back
              </Button>
              <Button
                onClick={handleFinishSetup}
                className="bg-cyan-500 hover:bg-cyan-600"
                disabled={isUploading}
              >
                {isUploading ? "Uploading..." : "Finish Setup"}
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
