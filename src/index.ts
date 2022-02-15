import express, {NextFunction, Request, Response} from 'express'
import jwt from "express-jwt";
import jwks from "jwks-rsa";
import { getUser } from './userData';

const port = process.env.PORT || 8080;
const app = express();

const jwksCallback = jwks.expressJwtSecret({
    cache: true,
    rateLimit: true,
    jwksRequestsPerMinute: 5,
    // JWKS url from the Auth0 Tenant
    jwksUri: "https://dev-yjll6etc.us.auth0.com/.well-known/jwks.json",
  });
  
  var requireJWTAuthentication = jwt({
    secret: jwksCallback,
    // The same audience parameter needs to be used by the client to configure their Auth0 SDK
    audience: "hcAuth",
    // The Auth0 domain
    issuer: "https://dev-yjll6etc.us.auth0.com/",
    // Has to be RS256 because that's what Auth0 uses to sign it's tokens
    algorithms: ["RS256"],
  });
  
app.use((req, res, next) => {
  // allow calling from different domains
  res.set("Access-Control-Allow-Origin", "*");
  // allow authorization header
  res.set("Access-Control-Allow-Headers", "authorization");
  next();
});

app.get("/public", (req: Request, res: Response) =>
  res.json({ hello: "world" })
);

app.get(
    "/private",
    requireJWTAuthentication,
    (req: any, res: Response) => {
      // requireJWTAuthentication adds a user property with the payload from a valid JWT
      console.log(req.user.sub)
      const userData = getUser(req?.user?.sub)
      return res.json({
        secrets: [
          {userData}
        ],
      });
    }
  );
  
app.listen(port, () => {
  console.log(`Listening on http://localhost:${port}`);
});
