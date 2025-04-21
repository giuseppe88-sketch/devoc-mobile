export interface DeveloperProfile {
  user_id: string; // Assuming this is the primary key / foreign key link
  username?: string; // Placeholder - adjust based on actual table schema
  // Add other fields from your 'developer_profiles' table here
  // e.g., website?: string;
  // e.g., bio?: string;
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