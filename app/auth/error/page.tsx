import { Box, Card, Center, Text } from "@mantine/core";

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ error: string }>;
}) {
  const params = await searchParams;

  return (
    <Center style={{ minHeight: "100svh", padding: "1.5rem" }}>
      <Box style={{ width: "100%", maxWidth: 400 }}>
        <Card withBorder radius="md" p="xl">
          <Text size="xl" fw={700} mb="md">
            Sorry, something went wrong.
          </Text>
          <Text size="sm" c="dimmed">
            {params?.error
              ? `Code error: ${params.error}`
              : "An unspecified error occurred."}
          </Text>
        </Card>
      </Box>
    </Center>
  );
}
