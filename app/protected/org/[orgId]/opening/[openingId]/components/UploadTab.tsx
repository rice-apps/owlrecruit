"use client";

import { Alert, Box, Button, Card, Group, Stack, Text } from "@mantine/core";
import {
  ChevronRight,
  File01,
  Folder,
  UploadCloud01,
} from "@untitled-ui/icons-react";
import { useUploadWizard } from "./useUploadWizard";
import { ColumnMappingStep } from "./ColumnMappingStep";

export function UploadTab() {
  const wizard = useUploadWizard();

  const progressPct =
    ((wizard.currentStep - 1) / (wizard.steps.length - 1)) * 100;

  return (
    <Box py="xl" style={{ maxWidth: 768 }}>
      {/* Step indicators */}
      <Box
        style={{ position: "relative", maxWidth: 480, margin: "0 auto 3rem" }}
      >
        <Box
          style={{
            position: "absolute",
            top: "50%",
            left: 16,
            right: 16,
            transform: "translateY(-50%)",
            height: 2,
            background: "var(--mantine-color-gray-2)",
          }}
        />
        <Box
          style={{
            position: "absolute",
            top: "50%",
            left: 16,
            transform: "translateY(-50%)",
            height: 2,
            width: `${progressPct}%`,
            background: "var(--mantine-color-owlTeal-5)",
            transition: "width 300ms ease",
          }}
        />
        <Group justify="space-between" style={{ position: "relative" }}>
          {wizard.steps.map((step) => {
            const isActive = step === wizard.currentStep;
            const isCompleted = step < wizard.currentStep;
            return (
              <Box
                key={step}
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 14,
                  fontWeight: 500,
                  border: `2px solid ${isActive || isCompleted ? "var(--mantine-color-owlTeal-5)" : "var(--mantine-color-gray-3)"}`,
                  background:
                    isActive || isCompleted
                      ? "var(--mantine-color-owlTeal-5)"
                      : "var(--mantine-color-gray-0)",
                  color:
                    isActive || isCompleted
                      ? "white"
                      : "var(--mantine-color-gray-5)",
                  zIndex: 1,
                }}
              >
                {step}
              </Box>
            );
          })}
        </Group>
      </Box>

      <Stack gap="xl">
        {/* Step 1: Choose import method */}
        {wizard.currentStep === 1 && (
          <>
            <Stack gap="xs">
              <Text size="lg" fw={600}>
                Set Up Your Application Form
              </Text>
              <Text c="dimmed" size="sm">
                Get started by choosing how you will import your candidates.
              </Text>
            </Stack>

            <Stack gap="md">
              <Card withBorder radius="md" p="lg" style={{ cursor: "default" }}>
                <Group gap="md">
                  <Box
                    style={{
                      width: 48,
                      height: 48,
                      borderRadius: "var(--mantine-radius-md)",
                      background: "var(--mantine-color-violet-0)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "var(--mantine-color-violet-6)",
                      flexShrink: 0,
                    }}
                  >
                    <File01 width={24} height={24} />
                  </Box>
                  <Box style={{ flex: 1 }}>
                    <Text fw={600} mb={4}>
                      Google Forms
                    </Text>
                    <Text size="sm" c="dimmed">
                      Import your candidates from Google Forms.
                    </Text>
                  </Box>
                  <ChevronRight
                    width={20}
                    height={20}
                    style={{
                      color: "var(--mantine-color-gray-4)",
                      flexShrink: 0,
                    }}
                  />
                </Group>
              </Card>

              <Card
                withBorder
                radius="md"
                p="lg"
                style={{ cursor: "pointer" }}
                onClick={() => wizard.setCurrentStep(2)}
              >
                <Group gap="md">
                  <Box
                    style={{
                      width: 48,
                      height: 48,
                      borderRadius: "var(--mantine-radius-md)",
                      background: "var(--mantine-color-gray-1)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "var(--mantine-color-gray-6)",
                      flexShrink: 0,
                    }}
                  >
                    <Folder width={24} height={24} />
                  </Box>
                  <Box style={{ flex: 1 }}>
                    <Text fw={600} mb={4}>
                      CSV File
                    </Text>
                    <Text size="sm" c="dimmed">
                      Import your candidates from a CSV file.
                    </Text>
                  </Box>
                  <ChevronRight
                    width={20}
                    height={20}
                    style={{
                      color: "var(--mantine-color-gray-4)",
                      flexShrink: 0,
                    }}
                  />
                </Group>
              </Card>
            </Stack>
          </>
        )}

        {/* Step 2: Upload CSV */}
        {wizard.currentStep === 2 && (
          <>
            <Stack gap="xs">
              <Text size="lg" fw={600}>
                Upload Your CSV
              </Text>
              <Text c="dimmed" size="sm">
                Drag and drop or click to choose your CSV file.
              </Text>
            </Stack>

            <Box
              style={{
                border: `2px dashed ${wizard.isDragOver ? "var(--mantine-color-owlTeal-4)" : "var(--mantine-color-gray-3)"}`,
                borderRadius: "var(--mantine-radius-md)",
                padding: "3rem 1.5rem",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                background: wizard.isDragOver
                  ? "var(--mantine-color-owlTeal-0)"
                  : "var(--mantine-color-gray-0)",
                transition: "border-color 150ms, background 150ms",
              }}
              onDragOver={wizard.handleDragOver}
              onDragLeave={wizard.handleDragLeave}
              onDrop={wizard.handleDrop}
            >
              <input
                type="file"
                accept=".csv"
                style={{ display: "none" }}
                ref={wizard.fileInputRef}
                onChange={wizard.handleFileChange}
              />

              {!wizard.file ? (
                <Stack gap="sm" align="center">
                  <Box
                    style={{
                      width: 48,
                      height: 48,
                      borderRadius: "50%",
                      background: "var(--mantine-color-gray-2)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "var(--mantine-color-gray-6)",
                    }}
                  >
                    <UploadCloud01 width={24} height={24} />
                  </Box>
                  <Text size="sm" c="owlTeal" fw={500}>
                    Choose CSV file or drag and drop
                  </Text>
                  <Button
                    onClick={() => wizard.fileInputRef.current?.click()}
                    mt="xs"
                  >
                    Upload CSV
                  </Button>
                </Stack>
              ) : (
                <Stack gap="xs" align="center">
                  <Box
                    style={{
                      width: 48,
                      height: 48,
                      borderRadius: "50%",
                      background: "var(--mantine-color-owlTeal-0)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "var(--mantine-color-owlTeal-5)",
                    }}
                  >
                    <File01 width={24} height={24} />
                  </Box>
                  <Text fw={500}>{wizard.file.name}</Text>
                  <Text size="sm" c="dimmed">
                    {(wizard.file.size / 1024).toFixed(2)} KB
                  </Text>
                  <Group gap="sm" mt="xs">
                    <Button
                      variant="outline"
                      color="red"
                      size="sm"
                      onClick={() => wizard.setFile(null)}
                    >
                      Remove
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => wizard.fileInputRef.current?.click()}
                    >
                      Change File
                    </Button>
                  </Group>
                </Stack>
              )}
            </Box>

            <Group justify="space-between" pt="md">
              <Button
                variant="default"
                onClick={wizard.handleBack}
                style={{ width: 96 }}
              >
                Back
              </Button>
              <Button
                onClick={wizard.handleNext}
                disabled={!wizard.file}
                rightSection={<ChevronRight width={16} height={16} />}
                style={{ width: 96 }}
                color="dark"
                radius="xl"
              >
                Next
              </Button>
            </Group>
          </>
        )}

        {/* Step 3: Column mapping */}
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

        {/* Step 4: Review & finish */}
        {wizard.currentStep === 4 && (
          <>
            <Stack gap="xs">
              <Text size="lg" fw={600}>
                Review
              </Text>
              <Text c="dimmed" size="sm">
                Review the application to ensure everything looks correct.
              </Text>
            </Stack>

            <Stack gap="xl">
              <Stack gap="xs">
                <Text fw={600}>Import Method</Text>
                <Text size="sm" c="dimmed">
                  CSV File
                </Text>
              </Stack>

              <Stack gap="sm">
                <Text fw={600}>Column Mappings</Text>
                <Stack gap="xs" style={{ maxWidth: 320 }}>
                  {[
                    { key: "name", label: "Name" },
                    { key: "netid", label: "NetID" },
                    { key: "year", label: "Year" },
                    { key: "major", label: "Major" },
                  ]
                    .filter(
                      ({ key }) =>
                        wizard.columnMappings[
                          key as keyof typeof wizard.columnMappings
                        ],
                    )
                    .map(({ key, label }) => (
                      <Group key={key} justify="space-between">
                        <Text size="sm" c="dimmed">
                          {label}:
                        </Text>
                        <Text size="sm" fw={500}>
                          {
                            wizard.columnMappings[
                              key as keyof typeof wizard.columnMappings
                            ]
                          }
                        </Text>
                      </Group>
                    ))}
                  {wizard.customQuestions.map(
                    (q) =>
                      wizard.columnMappings[q.id] && (
                        <Group key={q.id} justify="space-between">
                          <Text size="sm" c="dimmed">
                            {q.text}:
                          </Text>
                          <Text size="sm" fw={500}>
                            {wizard.columnMappings[q.id]}
                          </Text>
                        </Group>
                      ),
                  )}
                </Stack>
              </Stack>
            </Stack>

            {(wizard.uploadErrors.length > 0 ||
              (wizard.successCount > 0 && !wizard.isUploading)) && (
              <Alert
                color={wizard.uploadErrors.length > 0 ? "red" : "green"}
                mt="md"
              >
                {wizard.successCount > 0 && (
                  <Text
                    size="sm"
                    fw={600}
                    mb={wizard.uploadErrors.length > 0 ? "xs" : 0}
                  >
                    Successfully uploaded {wizard.successCount} application
                    {wizard.successCount !== 1 ? "s" : ""}.
                  </Text>
                )}
                {wizard.uploadErrors.length > 0 && (
                  <Stack gap="xs">
                    <Text size="sm" fw={600}>
                      Errors encountered during upload:
                    </Text>
                    <ul style={{ paddingLeft: "1.25rem", margin: 0 }}>
                      {wizard.uploadErrors.map((err, idx) => (
                        <li key={idx} style={{ fontSize: 13 }}>
                          {err.row ? `Row ${err.row}: ` : ""}
                          {err.error}
                        </li>
                      ))}
                    </ul>
                  </Stack>
                )}
              </Alert>
            )}

            <Group justify="space-between" pt="xl">
              <Button
                variant="default"
                onClick={wizard.handleBack}
                style={{ width: 96 }}
              >
                Back
              </Button>
              <Button
                onClick={wizard.handleFinishSetup}
                loading={wizard.isUploading}
                color="dark"
                radius="xl"
              >
                Finish Setup
              </Button>
            </Group>
          </>
        )}
      </Stack>
    </Box>
  );
}
