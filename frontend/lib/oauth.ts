const GOOGLE_CLIENT_ID =
  process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ||
  "810195441268-g4omp08tl1eekburuf3m5hpvbnkorduo.apps.googleusercontent.com";

const GITHUB_CLIENT_ID =
  process.env.NEXT_PUBLIC_GITHUB_CLIENT_ID || "Ov23lifwQxx3ZuxlGNvB";

const FYDRY_PRODUCTION_ORIGINS = new Set([
  "https://fydry.vercel.app",
  "https://fydry-dary.vercel.app",
  "https://fydry-task.vercel.app",
  "https://fydry-task-dary.vercel.app",
]);

function getGoogleRedirectUri(): string {
  if (process.env.NEXT_PUBLIC_GOOGLE_REDIRECT_URI) {
    return process.env.NEXT_PUBLIC_GOOGLE_REDIRECT_URI;
  }

  const { hostname, port, origin } = window.location;
  if (hostname === "localhost" || hostname === "127.0.0.1") {
    return port === "3000"
      ? `${origin}/auth/callback/google`
      : "http://localhost:3000/auth/callback/google";
  }

  if (FYDRY_PRODUCTION_ORIGINS.has(origin)) {
    return "https://fydry.vercel.app/auth/callback/google";
  }

  return `${origin}/auth/callback/google`;
}

export function redirectToGoogleOAuth() {
  if (typeof window === "undefined") return;

  const redirectUri = getGoogleRedirectUri();
  const rootUrl = "https://accounts.google.com/o/oauth2/v2/auth";

  const options: Record<string, string> = {
    redirect_uri: redirectUri,
    client_id: GOOGLE_CLIENT_ID,
    access_type: "offline",
    response_type: "code",
    prompt: "consent",
    scope: [
      "https://www.googleapis.com/auth/userinfo.profile",
      "https://www.googleapis.com/auth/userinfo.email",
      "openid",
    ].join(" "),
  };

  try {
    const redirectOrigin = new URL(redirectUri).origin;
    if (window.location.origin !== redirectOrigin) {
      options.state = window.location.origin;
    }
  } catch {
    // Fallback sin state si la URL no es válida
  }

  const qs = new URLSearchParams(options);
  window.location.href = `${rootUrl}?${qs.toString()}`;
}

export function redirectToGitHubOAuth() {
  if (typeof window === "undefined") return;

  const redirectUri = `${window.location.origin}/auth/callback/github`;
  const rootUrl = "https://github.com/login/oauth/authorize";

  const options = {
    client_id: GITHUB_CLIENT_ID,
    redirect_uri: redirectUri,
    scope: "user:email",
  };

  const qs = new URLSearchParams(options);
  window.location.href = `${rootUrl}?${qs.toString()}`;
}
