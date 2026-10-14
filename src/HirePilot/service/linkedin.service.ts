import { PilotSettingModel } from '../../PilotSetting/model/pilotsetting.model.js';

export interface LinkedInPublishResult {
  published: boolean;
  postId?: string;
  shareUrl?: string;
  authRequired?: boolean;
  authUrl?: string;
  message: string;
}

export class LinkedInService {
  private static readonly DEFAULT_REDIRECT_URI =
    process.env.LINKEDIN_REDIRECT_URI || 'http://localhost:5000/api/hirepilot/linkedin/callback';

  /**
   * Get the redirect URI configured for this environment
   */
  public static getRedirectUri(): string {
    return this.DEFAULT_REDIRECT_URI;
  }

  /**
   * Generate LinkedIn OAuth 2.0 authorization URL
   */
  public static async getAuthUrl(companyId?: string | null): Promise<string> {
    const cred = await PilotSettingModel.findByPlatform('linkedin', companyId);
    if (!cred || !cred.clientId) {
      throw new Error(
        'LinkedIn Client ID not found. Please add LinkedIn credentials in Pilot Settings first.'
      );
    }

    const state = companyId || 'default';
    const redirectUri = this.getRedirectUri();
    // Request OpenID + w_member_social to enable member posting
    const scope = 'openid profile email w_member_social';

    const authUrl = `https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=${encodeURIComponent(
      cred.clientId
    )}&redirect_uri=${encodeURIComponent(redirectUri)}&state=${encodeURIComponent(
      state
    )}&scope=${encodeURIComponent(scope)}`;

    return authUrl;
  }

  /**
   * Exchange OAuth authorization code for Access Token & Author URN
   */
  public static async handleCallback(
    code: string,
    state: string
  ): Promise<{ success: boolean; authorName?: string; companyId?: string }> {
    const companyId = state && state !== 'default' ? state : null;
    const cred = await PilotSettingModel.findByPlatform('linkedin', companyId);

    if (!cred || !cred.clientId || !cred.clientSecret) {
      throw new Error('LinkedIn client credentials not found in Pilot Settings.');
    }

    const redirectUri = this.getRedirectUri();

    // 1. Exchange code for access token
    const tokenParams = new URLSearchParams({
      grant_type: 'authorization_code',
      code: code.trim(),
      redirect_uri: redirectUri,
      client_id: cred.clientId.trim(),
      client_secret: cred.clientSecret.trim()
    });

    const tokenRes = await fetch('https://www.linkedin.com/oauth/v2/accessToken', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: tokenParams.toString()
    });

    const tokenData = await tokenRes.json();
    if (!tokenRes.ok || !tokenData.access_token) {
      console.error('[LinkedIn OAuth] Token exchange error:', tokenData);
      throw new Error(
        tokenData.error_description || tokenData.error || 'Failed to exchange LinkedIn code for token.'
      );
    }

    const accessToken = tokenData.access_token as string;

    // 2. Fetch authenticated member profile URN via OpenID userinfo
    let authorUrn = '';
    let authorName = '';

    try {
      const userinfoRes = await fetch('https://api.linkedin.com/v2/userinfo', {
        headers: {
          Authorization: `Bearer ${accessToken}`
        }
      });

      if (userinfoRes.ok) {
        const userInfo = await userinfoRes.json();
        if (userInfo.sub) {
          authorUrn = `urn:li:person:${userInfo.sub}`;
          authorName = userInfo.name || `${userInfo.given_name || ''} ${userInfo.family_name || ''}`.trim();
        }
      }
    } catch (profileErr) {
      console.warn('[LinkedIn OAuth] Could not fetch userinfo via OpenID:', profileErr);
    }

    // Fallback to /v2/me if OpenID sub not found
    if (!authorUrn) {
      try {
        const meRes = await fetch('https://api.linkedin.com/v2/me', {
          headers: {
            Authorization: `Bearer ${accessToken}`
          }
        });
        if (meRes.ok) {
          const meData = await meRes.json();
          if (meData.id) {
            authorUrn = `urn:li:person:${meData.id}`;
            authorName = `${meData.localizedFirstName || ''} ${meData.localizedLastName || ''}`.trim();
          }
        }
      } catch (meErr) {
        console.warn('[LinkedIn OAuth] /v2/me failed:', meErr);
      }
    }

    // 3. Save accessToken & authorUrn into pilot_settings
    await PilotSettingModel.update(cred.id, {
      accessToken,
      authorUrn: authorUrn || undefined,
      authorName: authorName || 'Connected LinkedIn User'
    });

    return {
      success: true,
      authorName,
      companyId: companyId || undefined
    };
  }

  /**
   * Publish a post to LinkedIn feed
   */
  public static async publishJobPost(
    companyId: string | null | undefined,
    postText: string
  ): Promise<LinkedInPublishResult> {
    const cred = await PilotSettingModel.findByPlatform('linkedin', companyId);

    // Direct Web Share Intent fallback URL is always available
    const shareIntentUrl = `https://www.linkedin.com/feed/?shareActive=true&text=${encodeURIComponent(
      postText
    )}`;

    if (!cred || !cred.clientId) {
      return {
        published: false,
        shareUrl: shareIntentUrl,
        message: 'LinkedIn credentials not configured. Opening LinkedIn share dialog.'
      };
    }

    // If access token and author URN are present, publish directly via LinkedIn UGC API
    if (cred.accessToken && cred.authorUrn) {
      try {
        const ugcPayload = {
          author: cred.authorUrn,
          lifecycleState: 'PUBLISHED',
          specificContent: {
            'com.linkedin.ugc.ShareContent': {
              shareCommentary: {
                text: postText
              },
              shareMediaCategory: 'NONE'
            }
          },
          visibility: {
            'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC'
          }
        };

        const postRes = await fetch('https://api.linkedin.com/v2/ugcPosts', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${cred.accessToken}`,
            'X-Restli-Protocol-Version': '2.0.0',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(ugcPayload)
        });

        const postData = await postRes.json();

        if (postRes.ok && postData.id) {
          return {
            published: true,
            postId: postData.id,
            message: 'Successfully published to LinkedIn feed!'
          };
        } else {
          console.warn('[LinkedIn API] Direct UGC post returned error:', postData);
        }
      } catch (postErr) {
        console.error('[LinkedIn API] Failed calling UGC post API:', postErr);
      }
    }

    // If OAuth token not yet authenticated, provide authUrl and instant shareUrl
    let authUrl = '';
    try {
      authUrl = await this.getAuthUrl(companyId);
    } catch {
      // Ignored
    }

    return {
      published: false,
      authRequired: !cred.accessToken,
      authUrl,
      shareUrl: shareIntentUrl,
      message: 'Opening LinkedIn broadcast window to publish your post.'
    };
  }
}
