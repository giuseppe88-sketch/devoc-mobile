import { createClient } from '@supabase/supabase-js';
import axios, { AxiosRequestConfig, AxiosResponse, Method } from 'axios';
import * as SecureStore from 'expo-secure-store';
// import 'react-native-url-polyfill/auto'; // Temporarily commented out for testing
import { Platform } from 'react-native';
import Constants from 'expo-constants';

// Fetch Supabase URL and Anon Key from environment variables via expo-constants
const supabaseUrl = Constants.expoConfig?.extra?.EXPO_PUBLIC_SUPABASE_URL as string | undefined;
const supabaseAnonKey = Constants.expoConfig?.extra?.EXPO_PUBLIC_SUPABASE_ANON_KEY as string | undefined;

// const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
// const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error(
    'Supabase URL or Anon Key is missing. Make sure they are set in your .env file and app.json plugins.',
  );
  // Optionally throw an error or provide default values for development
  // throw new Error('Supabase config missing');
}

// Create a custom storage adapter that works on both web and native
const customStorageAdapter = {
  getItem: async (key: string): Promise<string | null> => {
    if (Platform.OS === 'web') {
      return localStorage.getItem(key);
    } else {
      return SecureStore.getItemAsync(key);
    }
  },
  setItem: async (key: string, value: string): Promise<void> => {
    if (Platform.OS === 'web') {
      localStorage.setItem(key, value);
      return;
    } else {
      return SecureStore.setItemAsync(key, value);
    }
  },
  removeItem: async (key: string): Promise<void> => {
    if (Platform.OS === 'web') {
      localStorage.removeItem(key);
      return;
    } else {
      return SecureStore.deleteItemAsync(key);
    }
  },
};

// Custom fetch implementation using axios
// Type parameters according to the standard Fetch API
const axiosFetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
  // Determine the URL string from the input parameter
  const urlString = typeof input === 'string'
    ? input
    : (input instanceof URL ? input.href : input.url);

  // Create a URL object. This 'requestUrl' will be available in the catch block.
  // Assumes urlString is an absolute URL, which is typical for Supabase client requests.
  const requestUrl = new URL(urlString);

  const requestOptions: AxiosRequestConfig = {
    method: (init?.method as Method) || 'GET',
    headers: (init?.headers as Record<string, string>) || {}, // Ensure headers is an object
    data: init?.body,
    timeout: 15000, // 15 second timeout
  };

  if (requestOptions.data) {
    if (typeof requestOptions.data === 'string' && requestOptions.data.length < 1000) {
    } else {
    }
  } else {
  }
  // For simplicity, not mapping all fetch RequestInit options to AxiosRequestConfig
  // e.g., cache, credentials, integrity, keepalive, mode, redirect, referrer, etc.

  try {
    const response: AxiosResponse = await axios(urlString, requestOptions);

    // Mimic Fetch API's Response object
    return {
      ok: response.status >= 200 && response.status < 300,
      status: response.status,
      statusText: response.statusText,
      headers: new Headers(response.headers as Record<string, string>),
      url: response.config.url || urlString,
      json: async () => response.data,
      text: async () => JSON.stringify(response.data), // Or handle non-JSON data appropriately
      blob: async () => new Blob([JSON.stringify(response.data)]), // Simplified blob creation
      clone: () => { throw new Error('Response.clone() not implemented in axiosFetch'); }, // Not implemented
      type: 'default', // Or determine based on response if possible
      redirected: false, // Axios handles redirects, this might need better mapping
      body: null, // ReadableStream not easily provided from Axios response data directly
      bodyUsed: false, // Simplified
      arrayBuffer: async () => { throw new Error('Response.arrayBuffer() not implemented in axiosFetch'); }, // Simplified
      formData: async () => { throw new Error('Response.formData() not implemented in axiosFetch'); }, // Simplified
    } as Response; // Our mimicked object should align with the Response interface
  } catch (error) {
    console.error('--- axiosFetch: AXIOS REQUEST FAILED ---');
    if (axios.isAxiosError(error)) {
      // error.toJSON() provides a comprehensive view of the error, including config.
      console.error('AxiosError Object:', JSON.stringify(error.toJSON(), null, 2));
      // The existing console.error lines for code, message, response status/data are also kept from the previous logic if they were there.
      // This will be hit if error.response exists:
      if (error.response) {
        console.error('Axios error response status:', error.response.status);
        console.error('Axios error response data:', JSON.stringify(error.response.data, null, 2));
      }
      console.error('Axios error code (if any):', error.code); // e.g., 'ECONNABORTED', 'ERR_NETWORK'
      console.error('Axios error message:', error.message);
    } else {
      console.error('Non-Axios Error in axiosFetch:', error);
    }
    console.error('------------------------------------');
    // The original error handling logic to mimic Fetch Response for errors or re-throw:
    if (axios.isAxiosError(error)) {
      // Try to create a Response-like object for Axios errors too, if appropriate
      // This part is crucial for Supabase client to handle errors somewhat gracefully
      if (error.response) {
        const errResponse = error.response;
        return {
          ok: false,
          status: errResponse.status,
          statusText: errResponse.statusText,
          headers: new Headers(errResponse.headers as Record<string, string>),
          url: errResponse.config.url || requestUrl.href,
          json: async () => errResponse.data, // Error data might be JSON
          text: async () => JSON.stringify(errResponse.data),
          blob: async () => new Blob([JSON.stringify(errResponse.data)]),
          clone: () => { throw new Error('Response.clone() not implemented in axiosFetch'); },
          type: 'default',
          redirected: false,
          body: null,
          bodyUsed: false,
          arrayBuffer: async () => { throw new Error('Response.arrayBuffer() not implemented in axiosFetch'); },
          formData: async () => { throw new Error('Response.formData() not implemented in axiosFetch'); },
        } as Response;
      }
      // If it's a network error without a response (e.g., timeout, DNS issue)
      console.error('Axios network error in axiosFetch:', error.message, error.code);
      // Re-throw a generic error that Supabase client might handle or log
      // Or, construct a Response-like object indicating network failure
      // Forcing a TypeError like fetch does for network errors:
      throw new TypeError(`Network request failed in axiosFetch: ${error.message}`);
    }
    // Non-Axios error
    console.error('Non-Axios error in axiosFetch:', error);
    throw error; // Re-throw
  }
};

export const supabase = createClient(supabaseUrl!, supabaseAnonKey!, {
  global: {
    fetch: axiosFetch,
  },
  auth: {
    storage: customStorageAdapter,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
