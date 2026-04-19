export type UserProfile = {
  name: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  address: string;
  language: string;

  carers: Carer[];

  emergencyContact: EmergencyContact;

  preferences: string;
  interests: string;
  notes: string;
};

export type Carer = {
  id: string;
  name: string;
  relationship: string;
  phone: string;
  email: string;
};

export type EmergencyContact = {
  name: string;
  relationship: string;
  phone: string;
};

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
