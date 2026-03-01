"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  ChevronRight,
  UploadCloud01,
  File01,
  Folder,
  File as FileIcon,
} from "@untitled-ui/icons-react";
import { cn } from "@/lib/utils";
import { useUploadWizard } from "./useUploadWizard";
import { ColumnMappingStep } from "./ColumnMappingStep";

export function UploadTab() {
  const wizard = useUploadWizard();

  return (
    <div className="py-8 max-w-4xl">
      <div className="relative flex items-center justify-between mb-12 px-4 max-w-3xl mx-auto">
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-[2px] bg-gray-200 -z-10" />
        <div
          className="absolute left-0 top-1/2 -translate-y-1/2 h-[2px] bg-cyan-500 -z-10 transition-all duration-300"
          style={{
            width: `${((wizard.currentStep - 1) / (wizard.steps.length - 1)) * 100}%`,
          }}
        />
        {wizard.steps.map((step) => {
          const isActive = step === wizard.currentStep;
          const isCompleted = step < wizard.currentStep;
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

      <div className="space-y-6">
        {wizard.currentStep === 1 && (
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
              <Card className="p-6 hover:border-cyan-500 hover:shadow-sm cursor-pointer transition-all group border-gray-200">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-lg bg-purple-50 flex items-center justify-center text-purple-600">
                    <File01 className="w-6 h-6" />
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

              <Card
                className="p-6 hover:border-cyan-500 hover:shadow-sm cursor-pointer transition-all group border-gray-200"
                onClick={() => wizard.setCurrentStep(2)}
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

        {wizard.currentStep === 2 && (
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
                wizard.isDragOver
                  ? "border-cyan-500 bg-cyan-50"
                  : "border-gray-200 bg-gray-50/50",
              )}
              onDragOver={wizard.handleDragOver}
              onDragLeave={wizard.handleDragLeave}
              onDrop={wizard.handleDrop}
            >
              <input
                type="file"
                accept=".csv"
                className="hidden"
                ref={wizard.fileInputRef}
                onChange={wizard.handleFileChange}
              />

              {!wizard.file ? (
                <>
                  <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 mb-4">
                    <UploadCloud01 className="w-6 h-6" />
                  </div>
                  <p className="text-cyan-500 font-medium mb-1">
                    Choose CSV file or drag and drop
                  </p>
                  <Button
                    onClick={() => wizard.fileInputRef.current?.click()}
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
                  <p className="text-gray-900 font-medium mb-1">
                    {wizard.file.name}
                  </p>
                  <p className="text-sm text-gray-500 mb-4">
                    {(wizard.file.size / 1024).toFixed(2)} KB
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() => wizard.setFile(null)}
                      className="text-red-500 hover:text-red-600"
                    >
                      Remove
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => wizard.fileInputRef.current?.click()}
                    >
                      Change File
                    </Button>
                  </div>
                </>
              )}
            </div>

            <div className="flex justify-between pt-4">
              <Button
                variant="outline"
                onClick={wizard.handleBack}
                className="w-24"
              >
                Back
              </Button>
              <Button
                onClick={wizard.handleNext}
                className="w-24 bg-cyan-500 hover:bg-cyan-600"
                disabled={!wizard.file}
              >
                Next <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </>
        )}

        {wizard.currentStep === 3 && (
          <ColumnMappingStep
            columnMappings={wizard.columnMappings}
            customQuestions={wizard.customQuestions}
            getAvailableColumns={wizard.getAvailableColumns}
            isStep3Valid={wizard.isStep3Valid}
            onUpdateMapping={wizard.updateMapping}
            onAddQuestion={wizard.addQuestion}
            onDeleteQuestion={wizard.deleteQuestion}
            onNext={wizard.handleNext}
            onBack={wizard.handleBack}
          />
        )}

        {wizard.currentStep === 4 && (
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
                      {wizard.columnMappings.name}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">NetID:</span>
                    <span className="font-medium text-gray-900">
                      {wizard.columnMappings.netid}
                    </span>
                  </div>
                  {wizard.columnMappings.year && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Year:</span>
                      <span className="font-medium text-gray-900">
                        {wizard.columnMappings.year}
                      </span>
                    </div>
                  )}
                  {wizard.columnMappings.major && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Major:</span>
                      <span className="font-medium text-gray-900">
                        {wizard.columnMappings.major}
                      </span>
                    </div>
                  )}
                  {wizard.customQuestions.map(
                    (q) =>
                      wizard.columnMappings[q.id] && (
                        <div
                          key={q.id}
                          className="flex justify-between text-sm"
                        >
                          <span className="text-gray-600">{q.text}:</span>
                          <span className="font-medium text-gray-900">
                            {wizard.columnMappings[q.id]}
                          </span>
                        </div>
                      ),
                  )}
                </div>
              </div>
            </div>

            {(wizard.uploadErrors.length > 0 ||
              (wizard.successCount > 0 && !wizard.isUploading)) && (
              <div
                className={cn(
                  "p-4 mt-6 rounded-lg border text-sm",
                  wizard.uploadErrors.length > 0
                    ? "bg-red-50 border-red-200 text-red-800"
                    : "bg-green-50 border-green-200 text-green-800",
                )}
              >
                {wizard.successCount > 0 && (
                  <p className="font-semibold mb-2">
                    Successfully uploaded {wizard.successCount} application
                    {wizard.successCount !== 1 ? "s" : ""}.
                  </p>
                )}
                {wizard.uploadErrors.length > 0 && (
                  <>
                    <p className="font-semibold mb-1">
                      Errors encountered during upload:
                    </p>
                    <ul className="list-disc pl-5 space-y-1">
                      {wizard.uploadErrors.map((err, idx) => (
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
              <Button
                variant="outline"
                onClick={wizard.handleBack}
                className="w-24"
              >
                Back
              </Button>
              <Button
                onClick={wizard.handleFinishSetup}
                className="bg-cyan-500 hover:bg-cyan-600"
                disabled={wizard.isUploading}
              >
                {wizard.isUploading ? "Uploading..." : "Finish Setup"}
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
