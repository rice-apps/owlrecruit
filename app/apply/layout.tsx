import { Box } from "@mantine/core";

export default function ApplyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Box bg="gray.1" style={{ minHeight: "100vh" }} py="xl" px="md">
      <Box maw={672} mx="auto">
        {children}
      </Box>
    </Box>
  );
}
