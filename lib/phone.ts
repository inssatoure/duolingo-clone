// Clerk's native phone-number identifier requires a paid plan. Instead we
// store the phone number as a normalized "username" (digits only, no `+`),
// and keep the human-readable number in the user's metadata.
export const phoneToUsername = (countryCode: string, number: string) =>
  `wo${countryCode}${number}`.replace(/[^a-zA-Z0-9]/g, "");
