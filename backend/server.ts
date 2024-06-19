import express, { Request, Response } from 'express';
import fetch from 'node-fetch';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const port = 8080;

// cognito settings
const COGNITO_DOMAIN = process.env.COGNITO_DOMAIN!;
const CLIENT_ID = process.env.CLIENT_ID!;
const CLIENT_SECRET = process.env.CLIENT_SECRET!;
const REDIRECT_URI = process.env.REDIRECT_URI!;

// grafana settings
const GRAFANA_URL = process.env.GRAFANA_URL!;
const DASHBOARD_UID = process.env.DASHBOARD_UID!;

const ID_TOKEN = process.env.ID_TOKEN!;

app.get('/', (req: Request, res: Response) => {
  res.send("Hello Express");
});

app.get('/signin', (req: Request, res: Response) => {
  const authUrl = `${COGNITO_DOMAIN}/login?response_type=code&client_id=${CLIENT_ID}&redirect_uri=${REDIRECT_URI}&scope=openid%20email%20profile%20aws.cognito.signin.user.admin`;
  res.redirect(authUrl);
});

app.get('/callback', async (req: Request, res: Response) => {
  console.log('start callback');
  const code = req.query.code as string;
  const tokenUrl = `${COGNITO_DOMAIN}/oauth2/token`;

  console.log('Authorization code:', code);

  const params = new URLSearchParams();
  params.append('grant_type', 'authorization_code');
  params.append('client_id', CLIENT_ID);
  params.append('client_secret', CLIENT_SECRET);
  params.append('redirect_uri', REDIRECT_URI);
  params.append('code', code);

  console.log('Request parameters:', params.toString());

  try {
    const response = await fetch(tokenUrl, {
      method: 'POST',
      body: params,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });

    if (!response.ok) {
      throw new Error('Failed to fetch tokens');
    }

    const data = await response.json() as any;

    console.log(`end callback`, data);

    const formattedResponse = {
      idToken: data.id_token,
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiresIn: data.expires_in,
      tokenType: data.token_type
    };

    res.json(formattedResponse);

  } catch (error) {
    console.error('Error obtaining tokens:', error);
    res.status(500).send('Error obtaining tokens');
  }
});

app.get('/grafana', async (req: Request, res: Response) => {
  // const idToken = req.headers['authorization'];
  // if (!idToken) {
  //   return res.status(401).send('Unauthorized: No JWT token provided');
  // }

  try {
    // Grafanaにリクエストを送信してダッシュボード情報を取得
    const grafanaResponse = await fetch(`${GRAFANA_URL}/api/dashboards/uid/${DASHBOARD_UID}`, {
      headers: {
        'Authorization': `Bearer ${ID_TOKEN}`
      }
    });

    if (!grafanaResponse.ok) {
      const errorText = await grafanaResponse.text();
      console.error('Failed to fetch Grafana data:', errorText);
      throw new Error(`Failed to fetch Grafana data: ${grafanaResponse.status} ${grafanaResponse.statusText} - ${errorText}`);
    }

    const grafanaData: any = await grafanaResponse.json();

    // パネルのURLを組み立てる
    const panelUrl = `${GRAFANA_URL}/d-solo/${grafanaData.dashboard.uid}/${grafanaData.meta.slug}?orgId=1&from=now-6h&to=now&panelId=1`;

    // 結果のHTMLを組み立ててiframeに表示
    res.send(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Grafana Iframe</title>
        </head>
        <body>
          <iframe 
            src="${panelUrl}" 
            width="450" 
            height="200" 
            frameborder="0"
            sandbox="allow-scripts allow-same-origin"
          ></iframe>
        </body>
      </html>
    `);
  } catch (error) {
    console.error('Error fetching Grafana data:', error);
    res.status(500).send(`Error fetching Grafana data`);
  }
});


app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
