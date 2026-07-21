"use client";

import { AuthFlow } from "@/components/auth-flow";

// Sign-up and sign-in are now the same single page/flow: enter a phone
// number and the server decides whether to show the "create account" or
// "enter your PIN" branch. Both routes render it so existing links keep
// working.
const SignInPage = () => <AuthFlow />;

export default SignInPage;
