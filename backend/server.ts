import express, { Request, Response } from 'express';
import fetch from 'node-fetch';

const app = express();
const port = 8080;

const COGNITO_DOMAIN = 'https://grafana-test-0617.auth.ap-northeast-1.amazoncognito.com';
const CLIENT_ID = '72btnvjii5f272agv6h0vvjft9';
const CLIENT_SECRET = '18sbm8ujf1fl322gsi12el4tbrahd6ss508rkb2pav8b80majbdu';
const REDIRECT_URI = 'http://localhost:8080/callback';

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

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
