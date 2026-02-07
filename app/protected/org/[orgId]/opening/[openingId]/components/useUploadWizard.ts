import { useState, useRef, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Papa from "papaparse";

export type ColumnMapping = {
  name: string;
  netid: string;
  year: string;
  major: string;
  [key: string]: string;
};

export type CustomQuestion = {
  id: string;
  text: string;
};

export function useUploadWizard() {
  const params = useParams();
  const router = useRouter();
  const openingId = params.openingId as string;
  const orgId = params.orgId as string;

  const [currentStep, setCurrentStep] = useState(1);
  const [file, setFile] = useState<File | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [csvData, setCsvData] = useState<Record<string, unknown>[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [columnMappings, setColumnMappings] = useState<ColumnMapping>({
    name: "",
    netid: "",
    year: "",
    major: "",
  });
  const [customQuestions, setCustomQuestions] = useState<CustomQuestion[]>([]);
  const [uploadErrors, setUploadErrors] = useState<
    { row?: number; error: string }[]
  >([]);
  const [successCount, setSuccessCount] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [existingApplicants, setExistingApplicants] = useState<
    Map<string, { applicantId: string; name: string }>
  >(new Map());

  const steps = [1, 2, 3, 4];

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
          data.applicants.forEach(
            (app: { netId: string; applicantId: string; name: string }) => {
              map.set(app.netId, {
                applicantId: app.applicantId,
                name: app.name,
              });
            },
          );
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

  const parseCSVHeaders = (selectedFile: File) => {
    Papa.parse(selectedFile, {
      header: true,
      skipEmptyLines: "greedy",
      complete: (results) => {
        if (results.data && results.data.length > 0) {
          const headers = Object.keys(results.data[0] as object);
          setCsvHeaders(headers);
          setCsvData(results.data as Record<string, unknown>[]);
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

  const addQuestion = (text: string) => {
    if (!text.trim()) return;
    const newQuestion: CustomQuestion = {
      id: `q_${Date.now()}`,
      text,
    };
    setCustomQuestions((prev) => [...prev, newQuestion]);
    setColumnMappings((prev) => ({ ...prev, [newQuestion.id]: "" }));
  };

  const deleteQuestion = (questionId: string) => {
    setCustomQuestions((prev) => prev.filter((q) => q.id !== questionId));
    setColumnMappings((prev) => {
      const newMappings = { ...prev };
      delete newMappings[questionId];
      return newMappings;
    });
  };

  const updateMapping = (key: string, value: string) => {
    setColumnMappings((prev) => ({ ...prev, [key]: value }));
  };

  const getAvailableColumns = (currentField: string) => {
    const mappedColumns = Object.entries(columnMappings)
      .filter(([key, value]) => key !== currentField && value !== "")
      .map(([, value]) => value);
    return csvHeaders.filter((header) => !mappedColumns.includes(header));
  };

  const isStep3Valid =
    columnMappings.name !== "" && columnMappings.netid !== "";

  const handleFinishSetup = async () => {
    setIsUploading(true);
    setUploadErrors([]);
    setSuccessCount(0);

    try {
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
      } else {
        router.push(
          `/protected/org/${orgId}/opening/${openingId}?tab=applicants`,
        );
      }
    } catch (error: unknown) {
      console.error("Error uploading data:", error);
      setUploadErrors([
        {
          error:
            error instanceof Error
              ? error.message
              : "An unknown error occurred",
        },
      ]);
    } finally {
      setIsUploading(false);
    }
  };

  return {
    currentStep,
    setCurrentStep,
    steps,
    handleNext,
    handleBack,
    file,
    setFile,
    isDragOver,
    fileInputRef,
    handleFileChange,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    columnMappings,
    updateMapping,
    getAvailableColumns,
    isStep3Valid,
    customQuestions,
    addQuestion,
    deleteQuestion,
    isUploading,
    uploadErrors,
    successCount,
    handleFinishSetup,
  };
}
