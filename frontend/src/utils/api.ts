const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

export class ApiError extends Error {
  constructor(
    public statusCode: number,
    public code: string,
    message: string,
    public details: any[] = []
  ) {
    super(message);
    Object.setPrototypeOf(this, ApiError.prototype);
  }
}

export const apiRequest = async (path: string, options: RequestInit = {}) => {
  const url = `${API_URL}${path}`;
  
  const headers = new Headers(options.headers);
  if (!(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(url, {
    ...options,
    headers,
    credentials: 'include'
  });

  const contentType = response.headers.get('content-type');
  const isJson = contentType && contentType.includes('application/json');
  const data = isJson ? await response.json() : null;

  if (!response.ok) {
    if (data && data.error) {
      throw new ApiError(
        response.status,
        data.error.code,
        data.error.message,
        data.error.details
      );
    }
    throw new ApiError(
      response.status,
      'API_ERROR',
      data?.message || response.statusText || 'An error occurred'
    );
  }

  return data;
};
