import express, { Request, Response } from 'express';
import fetch from 'node-fetch';

const app = express();
const port = 8080;
const GRAFANA_URL = 'http://127.0.0.1:3000'
const COGNITO_DOMAIN = 'https://grafana-test-0617.auth.ap-northeast-1.amazoncognito.com';
const CLIENT_ID = '72btnvjii5f272agv6h0vvjft9';
const CLIENT_SECRET = '18sbm8ujf1fl322gsi12el4tbrahd6ss508rkb2pav8b80majbdu';
const REDIRECT_URI = 'http://localhost:8080/callback';

const DASHBOARD_UID = 'bdp4ulf0c15vke';
const ID_TOKEN = "eyJraWQiOiJ6MVAyTW9OVXo3Y3gyY2N1MkFxdUVyWFJmQ0drdlpRMWV3eTN1SnZyYW9RPSIsImFsZyI6IlJTMjU2In0.eyJhdF9oYXNoIjoiWEJqS2hOV1RGZTRhRm1HdW5xeGVBZyIsInN1YiI6Ijk3NjRhYWI4LTAwYzEtNzA3ZC03OGZjLTdkMjY2ZjcyMDQ5ZiIsImlzcyI6Imh0dHBzOlwvXC9jb2duaXRvLWlkcC5hcC1ub3J0aGVhc3QtMS5hbWF6b25hd3MuY29tXC9hcC1ub3J0aGVhc3QtMV9hTWZuMHRUNk8iLCJjb2duaXRvOnVzZXJuYW1lIjoia3lvIiwib3JpZ2luX2p0aSI6IjgwZTdhYWY5LWQxMDEtNDFlMy05OTFiLWE3MmU5Nzc5ODI3YSIsImF1ZCI6IjcyYnRudmppaTVmMjcyYWd2NmgwdnZqZnQ5IiwiZXZlbnRfaWQiOiJhZjNhMWJkYi1hYzMxLTQyYzYtYTZiMi02YzY3NTZhOTgyZWQiLCJ0b2tlbl91c2UiOiJpZCIsImF1dGhfdGltZSI6MTcxODY5ODM2MSwibmFtZSI6Imt5byIsImV4cCI6MTcxODcwMTk2MSwiaWF0IjoxNzE4Njk4MzYxLCJqdGkiOiI5MmIzNjQxZi03ZjM4LTRjYjktYmVjOC1hYTRlZDY3YjQwZDAiLCJlbWFpbCI6InNhaWtpLmt5b2hlaUBjbGFzc21ldGhvZC5qcCJ9.DS2Ki_Shh8hNWLVt9tV6vAvF3JnAjHFQq0XgZuYGcnDcDDNcRdVuSL0ky6cs7Afv3XC23-ExWPI-MkfuPy2Kzxh6jZM4QBQJKvdDSmKEFU-U102UXe_omIdNk8wxKG_CIkvzlpjAWrZmV5UtSBCDIWgMZhpyoDfg6WXDtDJBu1j5XdblDJk_WbllIc1ioELyujB8BhrhUjOfP4PCHlV03IU07kcGa-ea7xC0i3pjh1eFg10z30E5F9dIuDZgWbG_DzUsHUI9m3eoFjJzGBLy90V5Zwrh_dTukSEp5mAzw28eF06k1ELTBXMO3YP5E6STmciG1ilYBzF6KvB4oUraww"

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
