import express, { Request, Response} from 'express'
import jwt from "express-jwt";
import jwks from "jwks-rsa";
import { getUser, updateUser } from './userData';
import { MongoClient, Db } from 'mongodb';
import {NODE_ENV, MONGO_DEV_URI, MONGO_URI} from './config'
const port = process.env.PORT || 8080;
const app = express();

export let db : Db;
MongoClient.connect(NODE_ENV === 'production' ? MONGO_URI : MONGO_DEV_URI, (err, client) => {
  if(err) return console.error(err)
  console.log('Connected to Mongo DB')
  db = client.db(NODE_ENV === 'development' ? 'Habit-Calendar-Dev' : 'Habit-Calendar')
});

const jwksCallback = jwks.expressJwtSecret({
  cache: true,
  rateLimit: true,
  jwksRequestsPerMinute: 5,
  // JWKS url from the Auth0 Tenant
  jwksUri: "https://dev-yjll6etc.us.auth0.com/.well-known/jwks.json",
});

const requireJWTAuthentication = jwt({
    secret: jwksCallback,
    // The same audience parameter needs to be used by the client to configure their Auth0 SDK
    audience: "hcAuth",
    // The Auth0 domain
    issuer: "https://dev-yjll6etc.us.auth0.com/",
    // Has to be RS256 because that's what Auth0 uses to sign it's tokens
    algorithms: ["RS256"],
  });

app.use(express.json())
app.use((req, res, next) => {
  // allow calling from different domains
  res.set("Access-Control-Allow-Origin", "*");
  // allow authorization header
  res.set("Access-Control-Allow-Headers", ['Content-Type', 'Authorization']);
  next();
});

app.get("/public", (req: Request, res: Response) =>
  res.json({ hello: "world" })
);

app.get(
    "/user",
    requireJWTAuthentication,
    async (req: any, res: Response) => {
      // requireJWTAuthentication adds a user property with the payload from a valid JWT
      const uid = req.user.sub
      console.log(uid)
      const userData = await getUser(uid)
      return res.json(
          {success:true, userData}
      );
    }
);

app.post('/user', requireJWTAuthentication, async (req: any, res: Response) => {
  const uid = req.user.sub
  updateUser(req.body, uid)
  const updatedUser = await db.collection('Users').updateOne({uid},{$set:{body:req.body, uid}}, {upsert: true})
  res.json({success: true, user: updatedUser})
})

app.listen(port, () => {
  console.log(`Listening on http://localhost:${port}`);
});
