import { toast } from "sonner";

const BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api/v1";

const defaultOptions: RequestInit = {
  credentials: "include",
};

async function handleResponse(response: Response) {
  let res: any;

  try {
    res = await response.json();
  } catch {
    throw new Error("Invalid server response (HTML or malformed JSON).");
  }

  if (response.status === 401) {
    const error: any = new Error("Unauthorized");
    error.status = 401;
    throw error;
  }

  const message =
    res?.message ||
    res?.error ||
    res?.errors?.[0] ||
    "An unknown error occurred.";

  if (!response.ok || res?.success === false) {
    const err: any = new Error(message);
    err.status = response.status;
    throw err;
  }

  return res?.data ?? res;
}
export const api = {
  get: async (endpoint: string) => {
    try {
      const response = await fetch(`${BASE_URL}${endpoint}`, {
        ...defaultOptions,
        method: "GET",
      });
      return await handleResponse(response);
    } catch (error: any) {
      if (error?.status === 401 || error?.message === "Unauthorized") {
        return Promise.reject(error);
      }
      console.error("GET error:", error);
      throw error;
    }
  },

  post: async (endpoint: string, body?: unknown) => {
    try {
      const response = await fetch(`${BASE_URL}${endpoint}`, {
        ...defaultOptions,
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: body ? JSON.stringify(body) : undefined,
      });
      return await handleResponse(response);
    } catch (error: any) {
      if (error?.status === 401 || error?.message === "Unauthorized") {
        return Promise.reject(error);
      }
      console.error("POST error:", error);
      throw error;
    }
  },

  put: async (endpoint: string, body?: unknown) => {
    try {
      const response = await fetch(`${BASE_URL}${endpoint}`, {
        ...defaultOptions,
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: body ? JSON.stringify(body) : undefined,
      });
      return await handleResponse(response);
    } catch (error: any) {
      if (error?.response?.status === 401 || error?.message === "Unauthorized") {
        return Promise.reject(error);
      }
      console.error("PUT error:", error);
      throw error;
    }
  },

  delete: async (endpoint: string) => {
    try {
      const response = await fetch(`${BASE_URL}${endpoint}`, {
        ...defaultOptions,
        method: "DELETE",
      });
      return await handleResponse(response);
    } catch (error: any) {
      if (error?.response?.status === 401 || error?.message === "Unauthorized") {
        return Promise.reject(error);
      }
      console.error("DELETE error:", error);
      throw error;
    }
  },

  upload: async (endpoint: string, formData: FormData) => {
    try {
      const response = await fetch(`${BASE_URL}${endpoint}`, {
        ...defaultOptions,
        method: "POST",
        body: formData,
      });
      return await handleResponse(response);
    } catch (error: any) {
      if (error?.response?.status === 401 || error?.message === "Unauthorized") {
        return Promise.reject(error);
      }
      console.error("UPLOAD error:", error);
      throw error;
    }
  },

  handleApiError: (error: unknown) => {
    if (error instanceof Error && error.message === "Unauthorized") {
      toast.error("Session expired. Please log in again.");
    } else {
      console.error("API Error:", error);
      toast.error("Something went wrong. Please try again.");
    }
  },
};
