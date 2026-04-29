export {};

declare global {
  interface Window {
    handleSignInWithGoogle?: (response: {
      credential: string;
    }) => Promise<void>;
    handleApplySignIn?: (response: { credential: string }) => Promise<void>;
  }
}
