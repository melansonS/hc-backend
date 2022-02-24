import { MongoClient, Db } from 'mongodb';
import {NODE_ENV, MONGO_DEV_URI, MONGO_URI} from './config'

let db : Db;
async function connect () {
  await MongoClient.connect(NODE_ENV === 'development' ? MONGO_DEV_URI : MONGO_URI, (err, client) => {
    if(err) return console.error(err)
    console.log('Connected to Mongo DB')
    db = client.db('Habit-Calendar-Dev')
  });

}
connect()
export default db;