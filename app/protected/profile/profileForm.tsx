"use client";

import { useState } from "react";
import { Anchor, Button, Group, Stack, TextInput } from "@mantine/core";
import { useForm } from "@mantine/form";
import { createClient } from "@/lib/supabase/client";
import OrganizationsSection, {
  type OrgMembership,
} from "./organizations-section";
import { useRouter } from "next/navigation";
import { notifications as notif } from "@mantine/notifications";

interface ProfileFormProps {
  firstName: string;
  lastName: string;
  email: string;
  userId: string;
  orgMemberships: OrgMembership[];
}

export default function ProfileForm({
  firstName,
  lastName,
  email,
  userId,
  orgMemberships,
}: ProfileFormProps) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);

  const form = useForm({
    initialValues: { first: firstName, last: lastName, email },
    validate: {
      email: (v) =>
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) ? null : "Invalid email address",
    },
  });

  const handleSave = form.onSubmit(async (values) => {
    setSaving(true);
    try {
      const supabase = createClient();

      const { error: nameError } = await supabase
        .from("users")
        .update({ name: `${values.first} ${values.last}`.trim() })
        .eq("id", userId);

      const { error: emailError } = await supabase.auth.updateUser({
        email: values.email,
      });

      if (nameError || emailError) {
        notif.show({
          color: "red",
          message:
            nameError?.message ?? emailError?.message ?? "Failed to save.",
        });
        return;
      }

      form.resetDirty();
      notif.show({ color: "green", message: "Profile saved." });
      router.refresh();
    } finally {
      setSaving(false);
    }
  });

  return (
    <form onSubmit={handleSave}>
      <Stack gap="lg">
        <Group grow>
          <TextInput
            label="First name"
            placeholder="John"
            {...form.getInputProps("first")}
          />
          <TextInput
            label="Last name"
            placeholder="Doe"
            {...form.getInputProps("last")}
          />
        </Group>

        <TextInput
          label="Rice Email"
          type="email"
          placeholder="john.doe@rice.edu"
          {...form.getInputProps("email")}
        />

        <OrganizationsSection memberships={orgMemberships} userId={userId} />

        <Group justify="flex-end">
          <Anchor
            onClick={() => form.reset()}
            c="dimmed"
            size="sm"
            style={{ cursor: "pointer" }}
          >
            Reset
          </Anchor>
          <Button type="submit" loading={saving} color="dark" radius="xl">
            Save changes
          </Button>
        </Group>
      </Stack>
    </form>
  );
}
