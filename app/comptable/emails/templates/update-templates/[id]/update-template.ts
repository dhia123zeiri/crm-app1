import { serverPut } from "@/app/common/util/fetch";

export async function updateTemplate(templateId: string, formData: any) {
  try {
    const response = await serverPut(`template-emails/${templateId}`, formData);
    return { template: response, error: null };
  } catch (error: any) {
    return { template: null, error: error.message };
  }
}