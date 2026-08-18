// src/components/documentComponent/EmailTagInput.tsx
import { useState } from "react";
import type { KeyboardEvent } from "react";
import { X } from "lucide-react";
import { toast } from "react-toastify";
import { isValidEmail } from "./documentDisplay";

interface EmailTagInputProps {
  emails: string[];
  onChange: (emails: string[]) => void;
}

// Chip-style email list for the Upload/Edit panel's Restricted visibility
// mode. Enter or "," commits the typed text as a chip after validating its
// shape and rejecting duplicates; each chip has its own remove button. A
// controlled component — the caller owns the actual `emails` array.
export function EmailTagInput({ emails, onChange }: EmailTagInputProps) {
  const [draft, setDraft] = useState("");

  const commitDraft = () => {
    const candidate = draft.trim().replace(/,$/, "");
    if (!candidate) return;
    if (!isValidEmail(candidate)) {
      toast.error(`"${candidate}" isn't a valid email address.`);
      return;
    }
    if (emails.includes(candidate)) {
      toast.error(`${candidate} is already in the list.`);
      setDraft("");
      return;
    }
    onChange([...emails, candidate]);
    setDraft("");
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter" || event.key === ",") {
      event.preventDefault();
      commitDraft();
    } else if (event.key === "Backspace" && draft === "" && emails.length > 0) {
      onChange(emails.slice(0, -1));
    }
  };

  const handleRemove = (email: string) => {
    onChange(emails.filter((existing) => existing !== email));
  };

  return (
    <div>
      <div className="border-border focus-within:border-accent flex flex-wrap items-center gap-1.5 rounded-md border px-2 py-1.5">
        {emails.map((email) => (
          <span
            key={email}
            className="bg-surface-sunken text-ink flex items-center gap-1 rounded-full py-0.5 pr-1 pl-2 text-xs font-medium"
          >
            {email}
            <button
              type="button"
              onClick={() => handleRemove(email)}
              aria-label={`Remove ${email}`}
              className="text-ink-muted hover:bg-surface flex size-4 items-center justify-center rounded-full"
            >
              <X size={10} />
            </button>
          </span>
        ))}
        <input
          type="email"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={commitDraft}
          placeholder={
            emails.length === 0 ? "name@company.com" : "Add another…"
          }
          className="text-ink placeholder:text-ink-muted min-w-32 flex-1 px-1 py-0.5 text-sm outline-none"
        />
      </div>
      <p className="text-ink-muted mt-1 text-xs">
        Press Enter or comma to add an email.
      </p>
    </div>
  );
}
