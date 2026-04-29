"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "@mantine/form";
import {
  Stack,
  Card,
  Title,
  Text,
  TextInput,
  Textarea,
  SegmentedControl,
  MultiSelect,
  Button,
  Group,
  Anchor,
  Alert,
  Box,
  Table,
  NumberInput,
  ActionIcon,
} from "@mantine/core";
import { DateTimePicker } from "@mantine/dates";
import { AlertCircle, Trash01 } from "@untitled-ui/icons-react";
import { Breadcrumb } from "@/components/Breadcrumb";
import { useOpeningFormContext } from "./use-opening-form-context";
import type { OpeningInitialData, RubricItem } from "./types";
import {
  type OpeningStatus,
  OpeningStatus as OS,
  DEFAULT_OPENING_STATUS,
} from "@/types/app";

const MAX_RUBRIC_SCORE = 1_000_000_000_000;

interface OpeningFormPageProps {
  mode: "create" | "edit";
  orgId: string;
  openingId?: string;
  initialOpening?: OpeningInitialData;
  openingHref?: string;
}

export function OpeningFormPage({
  mode,
  orgId,
  openingId,
  initialOpening,
  openingHref,
}: OpeningFormPageProps) {
  const router = useRouter();
  const { orgName, eligibleReviewers } = useOpeningFormContext(orgId);
  const isEditMode = mode === "edit";

  const [applicationMethod, setApplicationMethod] = useState<
    "native" | "external"
  >(initialOpening?.application_link ? "external" : "native");
  const [rubricOpen, setRubricOpen] = useState(
    Boolean(initialOpening?.rubric?.length),
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const form = useForm({
    initialValues: {
      title: initialOpening?.title || "",
      description: initialOpening?.description || "",
      applicationLink: initialOpening?.application_link || "",
      closesAt: (initialOpening?.closes_at ?? null) as string | null,
      status: (initialOpening?.status ||
        DEFAULT_OPENING_STATUS) as OpeningStatus,
      selectedReviewers: [] as string[],
      rubric: (initialOpening?.rubric || []).map((item) => ({
        name: item.name || "",
        max_val: Number(item.max_val) || 10,
        description: item.description || "",
      })) as RubricItem[],
    },
    validate: {
      title: (v) => (v.trim() ? null : "Position title is required"),
    },
  });

  const reviewerOptions = eligibleReviewers.map((r) => {
    const u = Array.isArray(r.users) ? r.users[0] : r.users;
    return { value: r.user_id, label: u?.name || u?.email || r.user_id };
  });

  const updateRubricItem = (index: number, patch: Partial<RubricItem>) => {
    const updated = [...form.values.rubric];
    updated[index] = { ...updated[index], ...patch };
    form.setFieldValue("rubric", updated);
  };

  const handleSubmit = form.onSubmit(async (values) => {
    setError(null);

    if (isEditMode && !openingId) {
      setError("Opening ID is required for editing");
      return;
    }

    const normalizedRubric = values.rubric
      .filter((item) => String(item.name).trim())
      .map((item) => ({
        name: String(item.name).trim(),
        max_val: Number(item.max_val) || 0,
        description: String(item.description).trim() || "",
      }));

    if (values.rubric.length > 0) {
      if (normalizedRubric.some((r) => !r.name)) {
        setError("All criteria must have a name.");
        return;
      }
      const names = normalizedRubric.map((r) => r.name.toLowerCase());
      if (new Set(names).size !== names.length) {
        setError("Criteria names must be unique.");
        return;
      }
      if (normalizedRubric.some((r) => r.max_val <= 0)) {
        setError("Max score must be greater than 0.");
        return;
      }
      if (normalizedRubric.some((r) => r.max_val > MAX_RUBRIC_SCORE)) {
        setError("Max score must be ≤ 1,000,000,000,000.");
        return;
      }
    }

    setIsSubmitting(true);

    try {
      const payload: Record<string, unknown> = {
        title: values.title.trim(),
        description: values.description.trim() || null,
        application_link:
          applicationMethod === "external"
            ? values.applicationLink.trim() || null
            : null,
        closes_at: values.closesAt ?? null,
        status: values.status,
        rubric: isEditMode
          ? normalizedRubric
          : normalizedRubric.length > 0
            ? normalizedRubric
            : undefined,
        reviewer_ids:
          values.selectedReviewers.length > 0
            ? values.selectedReviewers
            : undefined,
      };

      if (!isEditMode) {
        payload.org_id = orgId;
      }

      const endpoint = isEditMode
        ? `/api/org/${orgId}/openings/${openingId}`
        : `/api/org/${orgId}/openings`;

      const response = await fetch(endpoint, {
        method: isEditMode ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const data = (await response.json()) as { error?: string };
        throw new Error(
          data.error || `Failed to ${isEditMode ? "update" : "create"} opening`,
        );
      }

      if (isEditMode && openingId) {
        router.push(
          openingHref ?? `/protected/org/${orgId}/opening/${openingId}`,
        );
      } else {
        router.push(`/protected/org/${orgId}`);
      }
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : `Failed to ${isEditMode ? "update" : "create"} opening`,
      );
    } finally {
      setIsSubmitting(false);
    }
  });

  const pageTitle = isEditMode ? "Edit Opening" : "Create position";

  return (
    <Stack gap="lg" style={{ width: "100%" }}>
      <Breadcrumb
        items={[
          {
            label: orgName || "Organization",
            href: `/protected/org/${orgId}`,
          },
          ...(isEditMode && openingId
            ? [
                {
                  label: initialOpening?.title || "Opening",
                  href:
                    openingHref ??
                    `/protected/org/${orgId}/opening/${openingId}`,
                },
                { label: "Edit" },
              ]
            : [{ label: pageTitle }]),
        ]}
      />

      <Card radius="lg" shadow="sm" withBorder={false} p="xl">
        <Stack gap="xs" mb="xl">
          <Title order={3}>{pageTitle}</Title>
          {orgName && (
            <Text c="dimmed" size="sm">
              {orgName}
            </Text>
          )}
        </Stack>

        <form onSubmit={handleSubmit}>
          <Stack gap="lg">
            <TextInput
              label="Position Name"
              required
              placeholder="e.g. Software Developer"
              {...form.getInputProps("title")}
            />

            <div>
              <Text size="sm" fw={500} mb="xs">
                Application Link
              </Text>
              <SegmentedControl
                value={applicationMethod}
                onChange={(val) => {
                  setApplicationMethod(val as "native" | "external");
                  if (val === "native")
                    form.setFieldValue("applicationLink", "");
                  else if (!form.values.applicationLink)
                    form.setFieldValue("applicationLink", "https://");
                }}
                data={[
                  { label: "Native Form", value: "native" },
                  { label: "External Link", value: "external" },
                ]}
                mb="xs"
              />
              {applicationMethod === "native" ? (
                <Text size="xs" c="dimmed">
                  Build a form in the Questions tab after creating this opening.
                </Text>
              ) : (
                <TextInput
                  type="url"
                  placeholder="https://forms.google.com/..."
                  {...form.getInputProps("applicationLink")}
                />
              )}
            </div>

            <Textarea
              label="Description"
              placeholder="Describe the position and responsibilities..."
              minRows={3}
              autosize
              {...form.getInputProps("description")}
            />

            <DateTimePicker
              label="Due Date"
              placeholder="Select date and time"
              value={form.values.closesAt}
              onChange={(val) => form.setFieldValue("closesAt", val)}
              clearable
            />

            {isEditMode && (
              <div>
                <Text size="sm" fw={500} mb="xs">
                  Status
                </Text>
                <SegmentedControl
                  value={form.values.status}
                  onChange={(val) =>
                    form.setFieldValue("status", val as OpeningStatus)
                  }
                  data={[
                    { label: "Draft", value: OS.DRAFT },
                    { label: "Open", value: OS.OPEN },
                    { label: "Closed", value: OS.CLOSED },
                  ]}
                />
              </div>
            )}

            {reviewerOptions.length > 0 && (
              <MultiSelect
                label="Assign Reviewers"
                placeholder="Search members by name"
                data={reviewerOptions}
                searchable
                clearable
                {...form.getInputProps("selectedReviewers")}
              />
            )}

            <div>
              <Text size="sm" fw={500} mb={4}>
                Add rubric
              </Text>
              <Text size="xs" c="dimmed" mb="sm">
                Define what you&apos;re grading and how many points each part is
                worth.
              </Text>
              {!rubricOpen ? (
                <Button
                  type="button"
                  color="dark"
                  radius="xl"
                  size="sm"
                  onClick={() => {
                    setRubricOpen(true);
                    if (form.values.rubric.length === 0) {
                      form.insertListItem("rubric", {
                        name: "",
                        max_val: 10,
                        description: "",
                      });
                    }
                  }}
                >
                  Add rubric +
                </Button>
              ) : (
                <Box
                  style={{
                    border: "1px solid var(--mantine-color-gray-2)",
                    borderRadius: "var(--mantine-radius-lg)",
                    padding: "1rem",
                  }}
                >
                  <Table>
                    <Table.Thead>
                      <Table.Tr>
                        <Table.Th>
                          <Text size="sm" fw={600}>
                            Criteria *
                          </Text>
                          <Text size="xs" c="dimmed">
                            e.g. &quot;Experience, Teamwork&quot;
                          </Text>
                        </Table.Th>
                        <Table.Th style={{ width: 140 }}>
                          <Text size="sm" fw={600}>
                            Max Score *
                          </Text>
                          <Text size="xs" c="dimmed">
                            Highest rating
                          </Text>
                        </Table.Th>
                        <Table.Th>
                          <Text size="sm" fw={600}>
                            Description
                          </Text>
                          <Text size="xs" c="dimmed">
                            Describe this criterion
                          </Text>
                        </Table.Th>
                        <Table.Th style={{ width: 40 }} />
                      </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>
                      {form.values.rubric.map((item, index) => (
                        <Table.Tr key={index}>
                          <Table.Td>
                            <TextInput
                              value={item.name}
                              onChange={(e) =>
                                updateRubricItem(index, {
                                  name: e.currentTarget.value,
                                })
                              }
                              placeholder="e.g. Teamwork"
                              size="xs"
                            />
                          </Table.Td>
                          <Table.Td>
                            <NumberInput
                              value={
                                item.max_val === "" ? "" : Number(item.max_val)
                              }
                              min={1}
                              max={MAX_RUBRIC_SCORE}
                              onChange={(val) =>
                                updateRubricItem(index, { max_val: val })
                              }
                              size="xs"
                            />
                          </Table.Td>
                          <Table.Td>
                            <TextInput
                              value={item.description}
                              onChange={(e) =>
                                updateRubricItem(index, {
                                  description: e.currentTarget.value,
                                })
                              }
                              placeholder="Describe this criterion..."
                              size="xs"
                            />
                          </Table.Td>
                          <Table.Td>
                            <ActionIcon
                              variant="subtle"
                              color="red"
                              onClick={() =>
                                form.removeListItem("rubric", index)
                              }
                            >
                              <Trash01 width={14} height={14} />
                            </ActionIcon>
                          </Table.Td>
                        </Table.Tr>
                      ))}
                    </Table.Tbody>
                  </Table>

                  <Group justify="space-between" mt="sm">
                    <Text size="sm" fw={600}>
                      Total Score:{" "}
                      <Text component="span" c="dimmed" fw={400}>
                        {form.values.rubric.reduce(
                          (sum, r) => sum + (Number(r.max_val) || 0),
                          0,
                        )}
                      </Text>
                    </Text>
                    <Group gap="xs">
                      <Button
                        type="button"
                        variant="subtle"
                        color="owlTeal"
                        size="xs"
                        onClick={() =>
                          form.insertListItem("rubric", {
                            name: "",
                            max_val: 10,
                            description: "",
                          })
                        }
                      >
                        Add criterion +
                      </Button>
                      <Button
                        type="button"
                        variant="subtle"
                        color="red"
                        size="xs"
                        onClick={() => {
                          form.setFieldValue("rubric", []);
                          setRubricOpen(false);
                        }}
                      >
                        Delete rubric
                      </Button>
                    </Group>
                  </Group>
                </Box>
              )}
            </div>

            {error && (
              <Alert color="red" icon={<AlertCircle width={16} height={16} />}>
                {error}
              </Alert>
            )}

            <Group justify="space-between" pt="md">
              <Anchor onClick={() => router.back()} c="dimmed" size="sm">
                Cancel
              </Anchor>
              <Button
                type="submit"
                loading={isSubmitting}
                color="dark"
                radius="xl"
              >
                {isEditMode ? "Save changes" : "Create position"}
              </Button>
            </Group>
          </Stack>
        </form>
      </Card>
    </Stack>
  );
}
