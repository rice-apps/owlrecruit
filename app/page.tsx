import { Center, Stack, Title, Text } from "@mantine/core";
import SignUpGoogleBtn from "@/app/auth/sign-up/sign-up-google";

export default function Home() {
  return (
    <Center h="100vh">
      <Stack align="center" gap="md" maw={400} ta="center" px="md">
        <Title order={1} fw={700}>
          Welcome to OwlRecruit.
        </Title>
        <Text c="dimmed" size="lg">
          Rice University&apos;s club recruitment platform
        </Text>
        <SignUpGoogleBtn />
      </Stack>
    </Center>
  );
}
