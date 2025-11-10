import { toast } from "sonner"; // ✅ Correct import

// Use your environment variable — or fallback to local backend
const BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api/v1";

// Default fetch config: always include cookies (for JWT/session)
const defaultOptions: RequestInit = {
  credentials: "include",
};

/**
 * ✅ Helper: safely parse response and throw meaningful errors.
 */
async function handleResponse(response: Response) {
  let res: any;

  try {
    res = await response.json();
  } catch {
    // if backend returns HTML or invalid JSON
    throw new Error("Invalid server response (HTML or malformed JSON).");
  }

  // ✅ Handle unauthorized — no toast spam
  if (response.status === 401) {
    const error: any = new Error("Unauthorized");
    error.response = { status: 401 };
    throw error;
  }

  // ✅ Extract meaningful message
  const message =
    res?.message ||
    res?.error ||
    res?.errors?.[0] ||
    "An unknown error occurred.";

  // ❌ Non-OK responses → show toast
  if (!response.ok || res?.success === false) {
    toast.error(message);
    throw new Error(message);
  }

  // ✅ Success → return payload data directly
  return res?.data ?? res;
}

/**
 * ✅ Universal Fetch Wrapper
 * Works like Axios but lighter & fully typed for your setup.
 */
export const api = {
  get: async (endpoint: string) => {
    try {
      const response = await fetch(`${BASE_URL}${endpoint}`, {
        ...defaultOptions,
        method: "GET",
      });
      return await handleResponse(response);
    } catch (error: any) {
      if (error?.response?.status === 401 || error?.message === "Unauthorized") {
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
      if (error?.response?.status === 401 || error?.message === "Unauthorized") {
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

  // ✅ For image/file uploads (multipart/form-data)
  upload: async (endpoint: string, formData: FormData) => {
    try {
      const response = await fetch(`${BASE_URL}${endpoint}`, {
        ...defaultOptions,
        method: "POST",
        body: formData, // No JSON stringify here
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

  // ✅ Unified error handler (used in AuthContext)
  handleApiError: (error: unknown) => {
    if (error instanceof Error && error.message === "Unauthorized") {
      toast.error("Session expired. Please log in again.");
    } else {
      console.error("API Error:", error);
      toast.error("Something went wrong. Please try again.");
    }
  },
};
