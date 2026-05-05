/**
 * The user's profile shape and a default seed profile. The profile
 * is shared across every feature that needs personal context
 * (Companion greetings, alert recipients, MedView, etc.) and
 * persists in AsyncStorage via UserProfileProvider.
 */

// The full user profile.
export type UserProfile = {
  name: string;          // Full name; first word is used as the chat label.
  email: string;         // Primary email.
  phone: string;         // Primary phone number.
  dateOfBirth: string;   // Stored as a display string (DD/MM/YYYY).
  address: string;       // Postal address.
  language: string;      // Preferred language for AI replies.

  carers: Carer[];       // People who get alerts for this user.

  emergencyContact: EmergencyContact; // Single primary emergency contact.

  preferences: string;   // Free-text accessibility / style notes.
  interests: string;     // Free-text hobbies, used by Companion.
  notes: string;         // Free-text extra notes for context.
};

// A single carer entry. Multiple carers can be attached to a user.
export type Carer = {
  id: string;            // Stable identifier for list keys.
  name: string;          // Carer's full name.
  relationship: string;  // E.g. "Daughter", "Son", "Friend".
  phone: string;         // Contact phone.
  email: string;         // Contact email.
};

// Emergency contact details. Kept separate from carers because there's only one.
export type EmergencyContact = {
  name: string;
  relationship: string;
  phone: string;
};

// Seed profile used on first launch (and whenever the user clears their data).
export const DEFAULT_PROFILE: UserProfile = {
  name: "Margaret Thompson",
  email: "margaret.thompson@email.com",
  phone: "+61 412 345 678",
  dateOfBirth: "14/03/1952",
  address: "42 Rosewood Drive, Melbourne VIC 3000",
  language: "English (Australia)",
  carers: [
    {
      id: "1",
      name: "Sarah Thompson",
      relationship: "Daughter",
      phone: "+61 413 987 654",
      email: "sarah.thompson@email.com",
    },
  ],
  emergencyContact: {
    name: "Sarah Thompson",
    relationship: "Daughter",
    phone: "+61 413 987 654",
  },
  preferences: "Large text, simple language",
  interests: "Gardening, cooking, family",
  notes: "Prefers morning appointments. Hard of hearing in left ear.",
};
