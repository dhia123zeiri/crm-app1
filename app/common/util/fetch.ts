// app/common/util/server-fetch.ts
"use server";

import { cookies } from "next/headers";
import { API_URL } from "../constants/api";



const getHeaders = async(includeContentType: boolean = true) => {
  const cookieStore = await cookies(); 
  const cookieHeader = cookieStore.toString();

  const headers: Record<string, string> = {};
  if (cookieHeader) {
    headers.Cookie = cookieHeader;
  }

  // Ne pas ajouter Content-Type pour FormData
  if (includeContentType) {
    headers["Content-Type"] = "application/json";
  }

  return headers;
};

export const serverGet = async (path: string) => {
  const headers = await getHeaders();
  const res = await fetch(`${API_URL}/${path}`, { 
    headers,
    credentials: 'include'
  });
  
  if (!res.ok) {
    throw new Error(`HTTP error! status: ${res.status}`);
  }
  
  return res.json();
};

export const serverPost = async (path: string, body: any) => {
  const headers = await getHeaders();

  const res = await fetch(`${API_URL}/${path}`, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
    credentials: 'include'
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(errorText || `HTTP error! status: ${res.status}`);
  }

  try {
    const parsedRes = await res.json();
    return parsedRes;
  } catch {
    return null;
  }
};

export const serverPut = async (path: string, body: any) => {
  const headers = await getHeaders();

  const res = await fetch(`${API_URL}/${path}`, {
    method: "PUT",
    headers,
    body: JSON.stringify(body),
    credentials: 'include'
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(errorText || `HTTP error! status: ${res.status}`);
  }

  try {
    const parsedRes = await res.json();
    return parsedRes;
  } catch {
    return null;
  }
};

// Méthode pour l'upload de fichiers (sans Content-Type)
export const serverUpload = async (path: string, formData: FormData) => {
  const headers = await getHeaders(false); // Ne pas inclure Content-Type

  const res = await fetch(`${API_URL}/${path}`, {
    method: "POST",
    headers,
    body: formData,
    credentials: 'include'
  });

  if (!res.ok) {
    const errorText = await res.text();
    
    // First try to parse as JSON
    let parsedError;
    try {
      parsedError = JSON.parse(errorText);
    } catch (jsonParseError) {
      // If JSON parsing fails, throw raw error text
      throw new Error(errorText || `HTTP error! status: ${res.status}`);
    }

    // JSON parsing succeeded, now extract the error message
    const errorMessage = parsedError.message || 
                        parsedError.error || 
                        parsedError.statusText || 
                        `HTTP error! status: ${res.status}`;
    
    throw new Error(errorMessage);
  }

  try {
    const parsedRes = await res.json();
    return parsedRes;
  } catch {
    return null;
  }
};

// Add to your server-fetch.ts
export const serverDelete = async (path: string) => {
  const headers = await getHeaders();

  const res = await fetch(`${API_URL}/${path}`, {
    method: "DELETE",
    headers,
    credentials: 'include'
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(errorText || `HTTP error! status: ${res.status}`);
  }

  try {
    const parsedRes = await res.json();
    return parsedRes;
  } catch {
    return null;
  }
};

// Fonction pour télécharger des fichiers (PDF, etc.)
export const serverDownload = async (path: string): Promise<Blob> => {
  const headers = await getHeaders(false);

  const res = await fetch(`${API_URL}/${path}`, {
    method: "GET",
    headers,
    credentials: 'include'
  });

  if (!res.ok) {
    throw new Error(`Erreur lors du téléchargement! status: ${res.status}`);
  }

  return res.blob();
};