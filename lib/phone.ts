// Clerk's native phone-number identifier requires a paid plan. Instead we
// store the phone number as a normalized "username" (digits only, no `+`),
// and keep the human-readable number in the user's metadata.
export const phoneToUsername = (countryCode: string, number: string) =>
  `wo${countryCode}${number}`.replace(/[^a-zA-Z0-9]/g, "");

// Same normalization from a full E.164 number (e.g. "+221771234567"), used
// server-side where the country code and local part aren't split. The "+"
// and any separators are stripped, so this matches phoneToUsername exactly.
export const e164ToUsername = (phoneNumber: string) =>
  phoneToUsername("", phoneNumber);
