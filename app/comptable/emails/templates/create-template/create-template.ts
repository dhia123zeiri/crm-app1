import { serverGet, serverPost, serverPut } from "@/app/common/util/fetch";
import { error } from "console";
import { redirect } from "next/navigation";

export default async function createTemplate(formData: any) {
    
  return await serverPost("template-emails", formData);

} 



export const getClients = async function () {
  try {
    const data = await serverGet("clients");

    // si ton API retourne déjà un tableau de clients
    if (Array.isArray(data)) {
      return { clients: data, error: null };
    }

    // sinon erreur de format
    return { clients: [], error: "Format de données invalide" };
  } catch (err) {
    console.error("Erreur dans getClients:", err);
    return { clients: [], error: "Impossible de récupérer les clients" };
  }
};

