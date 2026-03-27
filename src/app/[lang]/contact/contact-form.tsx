"use client";

import { useActionState } from "react";
import { Send, CheckCircle, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { sendContactEmail, type ContactFormState } from "./actions";

type ContactDict = {
  nameLabel: string;
  emailLabel: string;
  messageLabel: string;
  namePlaceholder: string;
  emailPlaceholder: string;
  messagePlaceholder: string;
  submitButton: string;
  sending: string;
  successMessage: string;
  errorMessage: string;
  nameRequired: string;
  emailRequired: string;
  messageRequired: string;
};

const initialState: ContactFormState = { success: false, message: "" };

export function ContactForm({ dict }: { dict: ContactDict }) {
  const [state, formAction, isPending] = useActionState(
    sendContactEmail,
    initialState,
  );

  const fieldError = (key: "name" | "email" | "message") => {
    const errorKey = state.fieldErrors?.[key];
    if (!errorKey) return null;
    return dict[errorKey as keyof ContactDict] ?? errorKey;
  };

  if (state.success) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-xl border border-border bg-card p-8 text-center">
        <CheckCircle className="size-10 text-green-500" />
        <p className="text-lg font-medium text-foreground">
          {dict.successMessage}
        </p>
      </div>
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-5">
      {state.message && !state.success && (
        <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          <AlertCircle className="size-4 shrink-0" />
          {dict[state.message as keyof ContactDict] ?? dict.errorMessage}
        </div>
      )}

      <div className="flex flex-col gap-1.5">
        <label htmlFor="name" className="text-sm font-medium text-foreground">
          {dict.nameLabel}
        </label>
        <input
          id="name"
          name="name"
          type="text"
          required
          placeholder={dict.namePlaceholder}
          className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/50"
        />
        {fieldError("name") && (
          <p className="text-xs text-destructive">{fieldError("name")}</p>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="email" className="text-sm font-medium text-foreground">
          {dict.emailLabel}
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          placeholder={dict.emailPlaceholder}
          className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/50"
        />
        {fieldError("email") && (
          <p className="text-xs text-destructive">{fieldError("email")}</p>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <label
          htmlFor="message"
          className="text-sm font-medium text-foreground"
        >
          {dict.messageLabel}
        </label>
        <textarea
          id="message"
          name="message"
          required
          rows={5}
          placeholder={dict.messagePlaceholder}
          className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/50 resize-none"
        />
        {fieldError("message") && (
          <p className="text-xs text-destructive">{fieldError("message")}</p>
        )}
      </div>

      <Button type="submit" disabled={isPending} size="lg" className="w-full">
        {isPending ? (
          dict.sending
        ) : (
          <>
            <Send className="size-4" />
            {dict.submitButton}
          </>
        )}
      </Button>
    </form>
  );
}
