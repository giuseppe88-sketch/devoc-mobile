export interface DeveloperProfile {
  user_id: string; // Foreign key link
  // Fields based on usage in profile/edit screens - align with your actual DB columns
  username?: string; // Keep if used, or replace/add 'name' or 'full_name'
  name?: string; // Assuming 'name' or 'full_name' exists for display
  avatar_url?: string;
  bio?: string;
  phone_number?: string;
  skills?: string[];
  focus_areas?: string[];
  portfolio_url?: string;
  github_url?: string;
  hourly_rate?: number;
  location?: string;
  years_of_experience?: number;
}

// Type for the navigation parameters for EditDeveloperProfile screen
export type EditDeveloperProfileRouteParams = {
  profileData?: {
    email?: string;
    name?: string;
    avatar_url?: string;
    bio?: string;
    phone_number?: string;
    skills?: string[];
    focus_areas?: string[];
    portfolio_url?: string;
    github_url?: string;
    hourly_rate?: number;
    location?: string;
    years_of_experience?: number;
  };
};

// Define Param Lists for Stacks
export type ProfileStackParamList = {
  DeveloperProfile: undefined; // Profile screen takes no params initially
  EditDeveloperProfile: EditDeveloperProfileRouteParams; // Edit screen uses the params we defined
};

export {};