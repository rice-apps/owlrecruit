"use client";

import { useState } from "react";
import { Anchor, Button, Group, Stack, TextInput } from "@mantine/core";
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
  const [first, setFirst] = useState(firstName);
  const [last, setLast] = useState(lastName);
  const [emailVal, setEmailVal] = useState(email);
  const [saved, setSaved] = useState({
    first: firstName,
    last: lastName,
    email,
  });
  const [saving, setSaving] = useState(false);

  const handleReset = () => {
    setFirst(saved.first);
    setLast(saved.last);
    setEmailVal(saved.email);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const supabase = createClient();

      const { error: nameError } = await supabase
        .from("users")
        .update({ name: `${first} ${last}`.trim() })
        .eq("id", userId);

      const { error: emailError } = await supabase.auth.updateUser({
        email: emailVal,
      });

      if (nameError || emailError) {
        notif.show({
          color: "red",
          message:
            nameError?.message ?? emailError?.message ?? "Failed to save.",
        });
        return;
      }

      setSaved({ first, last, email: emailVal });
      notif.show({ color: "green", message: "Profile saved." });
      router.refresh();
    } finally {
      setSaving(false);
    }
  };

  return (
    <Stack gap="lg">
      <Group grow>
        <TextInput
          label="First name"
          value={first}
          onChange={(e) => setFirst(e.currentTarget.value)}
          placeholder="John"
        />
        <TextInput
          label="Last name"
          value={last}
          onChange={(e) => setLast(e.currentTarget.value)}
          placeholder="Doe"
        />
      </Group>

      <TextInput
        label="Rice Email"
        type="email"
        value={emailVal}
        onChange={(e) => setEmailVal(e.currentTarget.value)}
        placeholder="john.doe@rice.edu"
      />

      <OrganizationsSection memberships={orgMemberships} userId={userId} />

      <Group justify="flex-end">
        <Anchor
          onClick={handleReset}
          c="dimmed"
          size="sm"
          style={{ cursor: "pointer" }}
        >
          Reset
        </Anchor>
        <Button onClick={handleSave} loading={saving} color="dark" radius="xl">
          Save changes
        </Button>
      </Group>
    </Stack>
  );
}
