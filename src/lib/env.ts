export const env = {
  apiUrl: process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000",
};

export const isProduction = process.env.NODE_ENV === "production";
