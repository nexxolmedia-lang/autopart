"use server";

import { formText, runAction, type ActionState } from "@/server/action-utils";
import { getClientIp } from "@/server/auth/session";
import { submitInquiry } from "@/server/modules/inquiries/service";

export async function submitInquiryAction(_prev: ActionState, form: FormData): Promise<ActionState> {
  return runAction(
    async () => {
      await submitInquiry(
        {
          name: formText(form, "name") ?? "",
          company: formText(form, "company"),
          email: formText(form, "email") ?? "",
          phone: formText(form, "phone"),
          topic: (formText(form, "topic") ?? "") as "other",
          message: formText(form, "message") ?? "",
          website: formText(form, "website") ?? "",
        },
        { ipAddress: await getClientIp() },
      );
    },
    "سپاسگزاریم — پیام شما به واحد فروش رسید. حداکثر تا یک روز کاری پاسخ می‌دهیم.",
  );
}
