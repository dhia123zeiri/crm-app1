"use server";

import {FormResponse } from "@/app/common/interfaces/form-error.interface";
import { serverPost } from "@/app/common/util/fetch";

import { redirect } from "next/navigation";

export default async function createUser(_prevState: FormResponse, formData: FormData) {

  const { error } = await serverPost("comptables", formData);
  if(error){
    return { error } 
  }

  redirect("/");
}
