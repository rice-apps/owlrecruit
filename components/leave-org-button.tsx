"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface LeaveOrgButtonProps {
  orgId: string;
  userId: string;
  isAdmin: boolean;
  orgName: string;
}

export function LeaveOrgButton({ orgId, userId, isAdmin, orgName }: LeaveOrgButtonProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLeave = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/org/${orgId}/members/${userId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to leave organization");
      router.push("/protected/discover");
      router.refresh();
    } catch (err) {
      console.error(err);
      setLoading(false);
      setOpen(false);
    }
  };

  return (
    <>
      <div className="flex flex-col items-start gap-1">
        <button
          type="button"
          onClick={() => setOpen(true)}
          disabled={isAdmin}
          className="text-left text-lg font-semibold tracking-tight text-red-500 transition sm:text-xl disabled:cursor-not-allowed disabled:opacity-40"
        >
          Leave organization
        </button>
        {isAdmin && (
          <p className="text-xs text-muted-foreground">
            Admins cannot leave the organization. Transfer admin rights first.
          </p>
        )}
      </div>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
          onClick={() => !loading && setOpen(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-xl px-8 py-8 flex flex-col items-center gap-6 max-w-sm w-full mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="text-center text-lg font-semibold text-slate-900 leading-snug">
              Are you sure you want to be removed as a member of {orgName}?
            </p>
            <button
              type="button"
              onClick={handleLeave}
              disabled={loading}
              className="w-40 py-3 rounded-xl bg-indigo-400 hover:bg-indigo-500 text-white font-semibold text-base transition disabled:opacity-60"
            >
              {loading ? "Leaving…" : "Yes"}
            </button>
            <button
              type="button"
              onClick={() => setOpen(false)}
              disabled={loading}
              className="text-sm text-muted-foreground hover:text-slate-700 transition"
            >
              No, cancel
            </button>
          </div>
        </div>
      )}
    </>
  );
}
