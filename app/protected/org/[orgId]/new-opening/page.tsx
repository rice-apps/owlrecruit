"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Button,
  TextInput,
  Textarea,
  NumberInput,
  SegmentedControl,
  MultiSelect,
  Stack,
  Group,
  Text,
  Alert,
  ActionIcon,
  Table,
  Box,
  Badge,
  Anchor,
  Title,
  Card,
} from "@mantine/core";
import { DateTimePicker } from "@mantine/dates";
import { notifications } from "@mantine/notifications";
import { AlertCircle, Trash01 } from "@untitled-ui/icons-react";
import { Breadcrumb } from "@/components/Breadcrumb";

const MAX_RUBRIC_SCORE = 1_000_000_000_000;

interface ReviewerOption {
  value: string;
  label: string;
}

interface RubricRow {
  name: string;
  max_val: number | string;
  description: string;
}

export default function NewOpeningPage() {
  const params = useParams<{ orgId: string }>();
  const orgId = params.orgId;
  const router = useRouter();

  const [orgName, setOrgName] = React.useState<string>("");
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [reviewerOptions, setReviewerOptions] = React.useState<
    ReviewerOption[]
  >([]);
  const [selectedReviewers, setSelectedReviewers] = React.useState<string[]>(
    [],
  );

  const [title, setTitle] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [applicationMethod, setApplicationMethod] = React.useState<
    "native" | "external"
  >("native");
  const [applicationLink, setApplicationLink] = React.useState("");
  const [closesAt, setClosesAt] = React.useState<string | null>(null);
  const [status] = React.useState<"draft" | "open" | "closed">("draft");

  const [rubricOpen, setRubricOpen] = React.useState(false);
  const [rubric, setRubric] = React.useState<RubricRow[]>([]);

  React.useEffect(() => {
    const fetchData = async () => {
      try {
        const [orgStatusRes, reviewersRes] = await Promise.all([
          fetch(`/api/user/org-status`),
          fetch(`/api/org/${orgId}/members?role=admin,reviewer`),
        ]);

        if (orgStatusRes.ok) {
          const json = await orgStatusRes.json();
          const memberships = json.data ?? json.memberships ?? [];
          const membership = memberships.find(
            (m: { org_id: string; org_name: string; role: string }) =>
              m.org_id === orgId,
          );
          if (!membership || membership.role !== "admin") {
            router.replace(`/protected/org/${orgId}`);
            return;
          }
          setOrgName(membership.org_name);
        } else {
          router.replace(`/protected/org/${orgId}`);
          return;
        }

        if (reviewersRes.ok) {
          const json = await reviewersRes.json();
          const reviewerData = json.data ?? json;
          const options: ReviewerOption[] = reviewerData.map(
            (r: {
              user_id: string;
              users:
                | { name?: string | null; email?: string }
                | { name?: string | null; email?: string }[]
                | null;
            }) => {
              const u = Array.isArray(r.users) ? r.users[0] : r.users;
              return {
                value: r.user_id,
                label: u?.name || u?.email || r.user_id,
              };
            },
          );
          setReviewerOptions(options);
        }
      } catch {
        // non-critical; page renders with defaults
      }
    };
    fetchData();
  }, [orgId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!title.trim()) {
      setError("Position title is required");
      return;
    }

    const normalizedRubric = rubric.map((r) => ({
      name: r.name.trim(),
      description: r.description.trim(),
      max_val: Number(r.max_val),
    }));

    const hasRubricContent = normalizedRubric.some(
      (r) => r.name !== "" || r.description !== "" || r.max_val !== 10,
    );

    if (hasRubricContent) {
      if (normalizedRubric.some((r) => !r.name)) {
        setError("All criteria must have a name.");
        return;
      }
      const normalizedNames = normalizedRubric.map((r) => r.name.toLowerCase());
      if (new Set(normalizedNames).size !== normalizedNames.length) {
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
      const response = await fetch(`/api/org/${orgId}/openings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          org_id: orgId,
          title: title.trim(),
          description: description.trim() || null,
          application_link:
            applicationMethod === "external"
              ? applicationLink.trim() || null
              : null,
          closes_at: closesAt ?? null,
          status,
          reviewer_ids:
            selectedReviewers.length > 0 ? selectedReviewers : undefined,
          rubric: hasRubricContent ? normalizedRubric : undefined,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to create opening");
      }

      notifications.show({ color: "green", message: "Opening created." });
      router.push(`/protected/org/${orgId}`);
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "Failed to create opening";
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Stack gap="lg" style={{ width: "100%" }}>
      <Breadcrumb
        items={[
          { label: orgName || "Organization", href: `/protected/org/${orgId}` },
          { label: "Create position" },
        ]}
      />

      <Card radius="lg" shadow="sm" withBorder={false} p="xl">
        <Stack gap="xs" mb="xl">
          <Title order={3}>Create position</Title>
          <Text c="dimmed" size="sm">
            Add an opening to your organization.
          </Text>
        </Stack>

        <form onSubmit={handleSubmit}>
          <Stack gap="lg">
            <TextInput
              label="Position Name"
              required
              value={title}
              onChange={(e) => setTitle(e.currentTarget.value)}
              placeholder="e.g. Software Developer"
            />

            <div>
              <Text size="sm" fw={500} mb="xs">
                Application Link
              </Text>
              <SegmentedControl
                value={applicationMethod}
                onChange={(val) => {
                  setApplicationMethod(val as "native" | "external");
                  if (val === "native") setApplicationLink("");
                  else if (!applicationLink) setApplicationLink("https://");
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
                  value={applicationLink}
                  onChange={(e) => setApplicationLink(e.currentTarget.value)}
                  placeholder="https://forms.google.com/..."
                />
              )}
            </div>

            <Textarea
              label="Description"
              value={description}
              onChange={(e) => setDescription(e.currentTarget.value)}
              placeholder="Describe the position and responsibilities..."
              minRows={3}
              autosize
            />

            <DateTimePicker
              label="Due Date"
              placeholder="Select date and time"
              value={closesAt}
              onChange={setClosesAt}
              clearable
            />

            <div>
              <Text size="sm" fw={500} mb="xs">
                Applicant Stages
              </Text>
              <Box
                p="md"
                style={{
                  border: "1px solid var(--mantine-color-gray-2)",
                  borderRadius: "var(--mantine-radius-lg)",
                }}
              >
                <Group gap="xs">
                  {[
                    { label: "Interview", color: "yellow" },
                    { label: "Rejected", color: "red" },
                    { label: "Accepted", color: "green" },
                    { label: "Pending", color: "gray" },
                  ].map((stage) => (
                    <Badge
                      key={stage.label}
                      color={stage.color}
                      variant={stage.label === "Pending" ? "outline" : "filled"}
                      radius="xl"
                    >
                      {stage.label}
                    </Badge>
                  ))}
                  <Button size="xs" color="dark" radius="xl" variant="filled">
                    Add stage +
                  </Button>
                </Group>
              </Box>
            </div>

            {reviewerOptions.length > 0 && (
              <MultiSelect
                label="Assign Reviewers"
                placeholder="Search members by name"
                data={reviewerOptions}
                value={selectedReviewers}
                onChange={setSelectedReviewers}
                searchable
                clearable
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
                    if (rubric.length === 0) {
                      setRubric([{ name: "", max_val: 10, description: "" }]);
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
                      {rubric.map((item, index) => (
                        <Table.Tr key={index}>
                          <Table.Td>
                            <TextInput
                              value={item.name}
                              onChange={(e) => {
                                const updated = [...rubric];
                                updated[index] = {
                                  ...updated[index],
                                  name: e.currentTarget.value,
                                };
                                setRubric(updated);
                              }}
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
                              onChange={(val) => {
                                const updated = [...rubric];
                                updated[index] = {
                                  ...updated[index],
                                  max_val: val,
                                };
                                setRubric(updated);
                              }}
                              size="xs"
                            />
                          </Table.Td>
                          <Table.Td>
                            <TextInput
                              value={item.description}
                              onChange={(e) => {
                                const updated = [...rubric];
                                updated[index] = {
                                  ...updated[index],
                                  description: e.currentTarget.value,
                                };
                                setRubric(updated);
                              }}
                              placeholder="Describe this criterion..."
                              size="xs"
                            />
                          </Table.Td>
                          <Table.Td>
                            <ActionIcon
                              variant="subtle"
                              color="red"
                              onClick={() =>
                                setRubric(rubric.filter((_, i) => i !== index))
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
                        {rubric.reduce(
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
                          setRubric([
                            ...rubric,
                            { name: "", max_val: 10, description: "" },
                          ])
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
                          setRubric([]);
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
                Create position
              </Button>
            </Group>
          </Stack>
        </form>
      </Card>
    </Stack>
  );
}
