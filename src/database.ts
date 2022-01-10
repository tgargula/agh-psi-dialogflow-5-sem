import { Db, MongoClient } from 'mongodb';

const connectionString = process.env.DATABASE_URI || '';
const client = new MongoClient(connectionString);

let dbConnection: Db;

export const connectToServer = async () => {
  return new Promise<Db>((resolve, reject) => {
    client.connect((err, db) => {
      if (err || !db) {
        return reject(err);
      }

      dbConnection = db.db('database');
      console.log('Successfully connected to MongoDB.');

      return resolve(dbConnection);
    });
  });
};

export const getDb = () => dbConnection;
