// src/utils/fetchRetry.ts

export async function fetchWithRetry(
  url: string,
  options: RequestInit = {},
  retries = 3,
  delay = 1000,
  backoffFactor = 2
): Promise<Response> {
  try {
    const response = await fetch(url, options);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response;
  } catch (error) {
    if (retries > 0) {
      console.warn(
        `Fetch failed, retrying in ${delay}ms... (${retries} retries left). Error:`,
        error
      );
      await new Promise((resolve) => setTimeout(resolve, delay));
      return fetchWithRetry(
        url,
        options,
        retries - 1,
        delay * backoffFactor,
        backoffFactor
      );
    }
    throw error;
  }
}
