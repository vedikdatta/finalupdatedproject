import { MongoClient } from 'mongodb';

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/FactoryPulse';

async function main() {
  const client = new MongoClient(MONGO_URI);
  try {
    await client.connect();
    const db = client.db();
    const col = db.collection('Login User');
    const docs = await col.find({}).sort({ timestamp: -1 }).limit(10).toArray();
    console.log('Recent Login Events:');
    console.dir(docs, { depth: 4 });
  } catch (err) {
    console.error('Error querying login events:', err);
  } finally {
    await client.close();
  }
}

main();
