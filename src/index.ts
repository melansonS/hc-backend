import express, {NextFunction, Request, Response} from 'express'
const cors = require('cors')

const app = express()

app.use(cors())

declare module 'express-serve-static-core' {
    interface Request {
      token?: string
    }
  }

const authMiddleWare =function(req: Request, res: Response, next:NextFunction) {
    const bearerHeader = req.headers.authorization
    if (!bearerHeader) {
        return res.status(403).json({ error: 'No credentials sent!' });
    }
    const bearer = bearerHeader.split(' ');
    const bearerToken = bearer[1];
    req.token = bearerToken;
    next();
  };

app.use(authMiddleWare)

app.get('/', (req :Request, res: Response) => {
    console.log("/ hit!", req.token)
    res.send({msg:"Hello, world!"})

})

const PORT = 4040

app.listen(PORT, () => {console.log('listening on ', PORT)})