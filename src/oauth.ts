import pkceChallenge from "pkce-challenge";
import { openUrl } from "@tauri-apps/plugin-opener";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";

// OAuth Client credentials
// Note: For desktop apps, secrets can't be truly kept secret (they're bundled with the app)
// Google's Desktop app type is designed with this limitation in mind
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || "";
const GOOGLE_CLIENT_SECRET = import.meta.env.VITE_GOOGLE_CLIENT_SECRET || "";

// Google requires localhost for Desktop apps, not custom schemes
const REDIRECT_URI = "http://127.0.0.1:8080/oauth/callback";

export type OAuthProvider = "google";

interface PKCEChallenge {
  code_verifier: string;
  code_challenge: string;
}

interface UserInfo {
  id: string;
  email: string;
  name: string;
  avatar_url?: string;
  provider: OAuthProvider;
  access_token: string;
}

export async function startOAuthFlow(provider: OAuthProvider): Promise<void> {
  // Start local server to catch OAuth callback
  await invoke("start_oauth_listener");

  // Generate PKCE challenge
  const { code_verifier, code_challenge }: PKCEChallenge = await pkceChallenge();

  // Generate random state for CSRF protection
  const state = crypto.randomUUID();

  // Store for later verification
  localStorage.setItem("pkce_verifier", code_verifier);
  localStorage.setItem("oauth_state", state);
  localStorage.setItem("oauth_provider", provider);

  if (!GOOGLE_CLIENT_ID) {
    throw new Error("Google Client ID not configured");
  }

  const authUrl = buildGoogleAuthUrl(GOOGLE_CLIENT_ID, code_challenge, state);

  // Open system browser
  await openUrl(authUrl);
}

function buildGoogleAuthUrl(
  clientId: string,
  codeChallenge: string,
  state: string
): string {
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: REDIRECT_URI,
    response_type: "code",
    scope: "openid email profile",
    code_challenge: codeChallenge,
    code_challenge_method: "S256",
    state,
  });

  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

export async function handleOAuthCallback(url: string): Promise<UserInfo> {
  const parsedUrl = new URL(url);
  const code = parsedUrl.searchParams.get("code");
  const state = parsedUrl.searchParams.get("state");

  if (!code || !state) {
    throw new Error("Missing code or state in OAuth callback");
  }

  // Verify state
  const savedState = localStorage.getItem("oauth_state");
  if (state !== savedState) {
    throw new Error("Invalid OAuth state - possible CSRF attack");
  }

  const provider = localStorage.getItem("oauth_provider") as OAuthProvider;
  const codeVerifier = localStorage.getItem("pkce_verifier");

  if (!provider || !codeVerifier) {
    throw new Error("Missing OAuth session data");
  }

  // Clean up stored values
  localStorage.removeItem("oauth_state");
  localStorage.removeItem("pkce_verifier");
  localStorage.removeItem("oauth_provider");

  // Exchange code for tokens
  return await exchangeGoogleCode(code, codeVerifier);
}

async function exchangeGoogleCode(
  code: string,
  codeVerifier: string
): Promise<UserInfo> {
  // Exchange authorization code for access token
  const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      client_id: GOOGLE_CLIENT_ID,
      client_secret: GOOGLE_CLIENT_SECRET,
      code,
      code_verifier: codeVerifier,
      grant_type: "authorization_code",
      redirect_uri: REDIRECT_URI,
    }),
  });

  if (!tokenResponse.ok) {
    const error = await tokenResponse.text();
    throw new Error(`Token exchange failed: ${error}`);
  }

  const tokenData = await tokenResponse.json();
  const accessToken = tokenData.access_token;

  // Get user info
  const userResponse = await fetch(
    "https://www.googleapis.com/oauth2/v2/userinfo",
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  if (!userResponse.ok) {
    throw new Error("Failed to fetch user info");
  }

  const userData = await userResponse.json();

  return {
    id: userData.id,
    email: userData.email,
    name: userData.name,
    avatar_url: userData.picture,
    provider: "google",
    access_token: accessToken,
  };
}
