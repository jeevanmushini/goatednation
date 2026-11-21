export interface BaseEmailLayoutOptions {
  title: string;
  preheader?: string;
  content: string;
}

/**
 * GOATED NATION Zenin Tokyo Streetwear Base Email Template
 * Precision brutalist layout optimized for universal client compatibility (Gmail, Outlook, iOS Mail)
 */
export function renderEmailLayout({ title, preheader, content }: BaseEmailLayoutOptions): string {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.SITE_URL || 'https://goatednation.com';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>${title}</title>
  <!--[if mso]>
  <style type="text/css">
    body, table, td, a { font-family: 'Courier New', Courier, monospace !important; }
  </style>
  <![endif]-->
  <style type="text/css">
    body {
      margin: 0;
      padding: 0;
      background-color: #0F0F0F;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Courier New', monospace;
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
      color: #111111;
    }
    table {
      border-collapse: collapse;
      mso-table-lspace: 0pt;
      mso-table-rspace: 0pt;
    }
    img {
      border: 0;
      line-height: 100%;
      outline: none;
      text-decoration: none;
      -ms-interpolation-mode: bicubic;
    }
    a {
      color: #000000;
      text-decoration: none;
    }
    @media only screen and (max-width: 620px) {
      .email-container {
        width: 100% !important;
        max-width: 100% !important;
        border-radius: 0 !important;
      }
      .mobile-padding {
        padding: 24px 18px !important;
      }
      .mobile-stack {
        display: block !important;
        width: 100% !important;
      }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: #0C0C0C;">
  ${
    preheader
      ? `<div style="display: none; font-size: 1px; color: #0C0C0C; line-height: 1px; max-height: 0px; max-width: 0px; opacity: 0; overflow: hidden;">
          ${preheader}
        </div>`
      : ''
  }

  <!-- Background Wrapper -->
  <table width="100%" border="0" cellpadding="0" cellspacing="0" bgcolor="#0C0C0C" style="background-color: #0C0C0C; min-height: 100vh; padding: 32px 12px;">
    <tr>
      <td align="center" valign="top">
        
        <!-- Main Card Container (600px Max) -->
        <table class="email-container" width="600" border="0" cellpadding="0" cellspacing="0" style="max-width: 600px; width: 100%; background-color: #FFFFFF; border: 1px solid #222222; border-radius: 4px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.5);">
          
          <!-- Top Pitch-Black Header Bar -->
          <tr>
            <td bgcolor="#000000" style="background-color: #000000; padding: 20px 28px; border-bottom: 2px solid #FF4D00;">
              <table width="100%" border="0" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="left" valign="middle">
                    <a href="${appUrl}" style="color: #FFFFFF; text-decoration: none;">
                      <span style="font-family: 'Courier New', Courier, monospace; font-size: 15px; font-weight: 900; letter-spacing: 0.22em; color: #FFFFFF; text-transform: uppercase;">
                        GOATED NATION
                      </span>
                      <span style="font-family: sans-serif; font-size: 11px; letter-spacing: 0.15em; color: #FF4D00; margin-left: 6px; font-weight: 700;">
                        // 東京
                      </span>
                    </a>
                  </td>
                  <td align="right" valign="middle">
                    <span style="font-family: 'Courier New', Courier, monospace; font-size: 9px; letter-spacing: 0.18em; color: #888888; text-transform: uppercase;">
                      ARCHIVE // 2026
                    </span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Dynamic Content Body -->
          <tr>
            <td class="mobile-padding" style="padding: 36px 32px; background-color: #FFFFFF;">
              ${content}
            </td>
          </tr>

          <!-- Pitch-Black Minimalist Footer -->
          <tr>
            <td bgcolor="#0A0A0A" style="background-color: #0A0A0A; padding: 28px 32px; border-top: 1px solid #1E1E1E;">
              <table width="100%" border="0" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="font-family: 'Courier New', Courier, monospace; font-size: 10px; letter-spacing: 0.25em; text-transform: uppercase; color: #777777; padding-bottom: 12px;">
                    GOATED NATION SYNDICATE &bull; TOKYO STREETWEAR ARCHIVE
                  </td>
                </tr>
                <tr>
                  <td align="center" style="font-family: -apple-system, BlinkMacSystemFont, sans-serif; font-size: 11px; color: #555555; line-height: 1.6; padding-bottom: 16px;">
                    Raw Japanese silhouettes &bull; Heavyweight aesthetics &bull; Precision logistics<br>
                    Need assistance? Contact <a href="mailto:goatednation@gmail.com" style="color: #888888; text-decoration: underline;">goatednation@gmail.com</a>
                  </td>
                </tr>
                <tr>
                  <td align="center" style="border-top: 1px solid #1A1A1A; padding-top: 14px;">
                    <span style="font-family: 'Courier New', Courier, monospace; font-size: 9px; color: #444444; letter-spacing: 0.12em;">
                      &copy; 2026 GOATED NATION. ALL RIGHTS RESERVED. AUTOMATED TRANSACTION DISPATCH.
                    </span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

        </table>
        
      </td>
    </tr>
  </table>
</body>
</html>`;
}
