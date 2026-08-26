from typing import Optional, Dict, Any
import httpx
from app.core.config import settings


async def exchange_google_code_or_token(code_or_token: str, redirect_uri: Optional[str] = None) -> Optional[Dict[str, Any]]:
    """
    Handles both Google authorization codes and Google ID tokens.
    Exchanges code for user info or verifies ID token.
    """
    async with httpx.AsyncClient() as client:
        # If it looks like an authorization code and we have client credentials
        if (len(code_or_token) < 100 or code_or_token.startswith("4/")) and settings.GOOGLE_CLIENT_ID and settings.GOOGLE_CLIENT_SECRET:
            token_url = "https://oauth2.googleapis.com/token"
            data = {
                "code": code_or_token,
                "client_id": settings.GOOGLE_CLIENT_ID,
                "client_secret": settings.GOOGLE_CLIENT_SECRET,
                "redirect_uri": redirect_uri or f"{settings.FRONTEND_URL}/auth/callback/google",
                "grant_type": "authorization_code",
            }
            try:
                res = await client.post(token_url, data=data, timeout=10.0)
                if res.status_code == 200:
                    token_data = res.json()
                    id_token = token_data.get("id_token")
                    if id_token:
                        return await verify_google_id_token(id_token)
                    access_token = token_data.get("access_token")
                    if access_token:
                        user_info_res = await client.get(
                            "https://www.googleapis.com/oauth2/v3/userinfo",
                            headers={"Authorization": f"Bearer {access_token}"},
                            timeout=10.0,
                        )
                        if user_info_res.status_code == 200:
                            u_data = user_info_res.json()
                            return {
                                "provider_id": u_data.get("sub"),
                                "email": u_data.get("email"),
                                "full_name": u_data.get("name", "Usuario Google"),
                                "avatar_url": u_data.get("picture"),
                                "email_verified": u_data.get("email_verified", True),
                            }
            except Exception as e:
                print(f"[GOOGLE OAUTH ERROR]: {e}")

        # Fallback to direct ID token verification
        return await verify_google_id_token(code_or_token)


async def verify_google_id_token(id_token: str) -> Optional[Dict[str, Any]]:
    """Verifies Google ID Token against Google OAuth2 tokeninfo endpoint."""
    url = f"https://oauth2.googleapis.com/tokeninfo?id_token={id_token}"
    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(url, timeout=10.0)
            if response.status_code == 200:
                data = response.json()
                return {
                    "provider_id": data.get("sub"),
                    "email": data.get("email"),
                    "full_name": data.get("name", "Usuario Google"),
                    "avatar_url": data.get("picture"),
                    "email_verified": data.get("email_verified", True),
                }
            return None
        except Exception as exc:
            print(f"[GOOGLE TOKEN ERROR]: {exc}")
            return None


async def get_github_user_profile(token_or_code: str) -> Optional[Dict[str, Any]]:
    """
    Exchanges GitHub authorization code for access token and retrieves user profile.
    """
    async with httpx.AsyncClient() as client:
        access_token = token_or_code

        # If it's an authorization code, exchange it for access token
        if not token_or_code.startswith("gho_") and not token_or_code.startswith("ghp_") and settings.GITHUB_CLIENT_ID and settings.GITHUB_CLIENT_SECRET:
            token_url = "https://github.com/login/oauth/access_token"
            headers = {"Accept": "application/json"}
            payload = {
                "client_id": settings.GITHUB_CLIENT_ID,
                "client_secret": settings.GITHUB_CLIENT_SECRET,
                "code": token_or_code,
            }
            try:
                res = await client.post(token_url, json=payload, headers=headers, timeout=10.0)
                if res.status_code == 200:
                    res_data = res.json()
                    access_token = res_data.get("access_token", token_or_code)
            except Exception as e:
                print(f"[GITHUB TOKEN EXCHANGE ERROR]: {e}")

        # Query GitHub user API
        headers = {
            "Authorization": f"Bearer {access_token}",
            "Accept": "application/vnd.github.v3+json",
            "User-Agent": "FyDry-OAuth",
        }
        try:
            user_res = await client.get("https://api.github.com/user", headers=headers, timeout=10.0)
            if user_res.status_code == 200:
                user_data = user_res.json()
                email = user_data.get("email")

                # If primary email is private in GitHub, query user/emails endpoint
                if not email:
                    email_res = await client.get("https://api.github.com/user/emails", headers=headers, timeout=10.0)
                    if email_res.status_code == 200:
                        emails_list = email_res.json()
                        primary_email = next((e["email"] for e in emails_list if e.get("primary")), None)
                        email = primary_email or (emails_list[0]["email"] if emails_list else None)

                return {
                    "provider_id": str(user_data.get("id")),
                    "email": email or f"{user_data.get('login')}@github.local",
                    "full_name": user_data.get("name") or user_data.get("login") or "Usuario GitHub",
                    "avatar_url": user_data.get("avatar_url"),
                    "email_verified": True,
                }
            return None
        except Exception as exc:
            print(f"[GITHUB PROFILE ERROR]: {exc}")
            return None
