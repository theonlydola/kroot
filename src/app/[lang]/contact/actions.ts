"use server";

import { Resend } from "resend";

export type ContactFormState = {
  success: boolean;
  message: string;
  fieldErrors?: {
    name?: string;
    email?: string;
    message?: string;
  };
};

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function sendContactEmail(
  _prevState: ContactFormState,
  formData: FormData,
): Promise<ContactFormState> {
  const name = (formData.get("name") as string)?.trim();
  const email = (formData.get("email") as string)?.trim();
  const message = (formData.get("message") as string)?.trim();

  const fieldErrors: ContactFormState["fieldErrors"] = {};
  if (!name) fieldErrors.name = "nameRequired";
  if (!email || !EMAIL_REGEX.test(email)) fieldErrors.email = "emailRequired";
  if (!message) fieldErrors.message = "messageRequired";

  if (Object.keys(fieldErrors).length > 0) {
    return { success: false, message: "", fieldErrors };
  }

  const apiKey = process.env.RESEND_API_KEY;
  const contactEmail = process.env.CONTACT_EMAIL;

  if (!apiKey || !contactEmail) {
    return { success: false, message: "errorMessage" };
  }

  const resend = new Resend(apiKey);

  const { error } = await resend.emails.send({
    from: "Kroot Contact <onboarding@resend.dev>",
    to: contactEmail,
    replyTo: email,
    subject: `[Kroot Contact] Message from ${name}`,
    text: `Name: ${name}\nEmail: ${email}\n\nMessage:\n${message}`,
  });

  if (error) {
    return { success: false, message: "errorMessage" };
  }

  return { success: true, message: "successMessage" };
}
