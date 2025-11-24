import { serverPost } from "@/app/common/util/fetch";

export default async function checkout(factureId: number){
    return serverPost('checkout/session',{ factureId });
}