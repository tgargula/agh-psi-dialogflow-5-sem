import { WithId, Document, ObjectId } from 'mongodb';
import { getDb } from '../database';

type Event = {
  id: ObjectId;
  title: string;
  description: string;
  date: Date;
  durationInMinutes: number;
};

const parseToEvent = (document: WithId<Document>): Event => ({
  // eslint-disable-next-line no-underscore-dangle
  id: document._id,
  title: document.title,
  description: document.description,
  date: new Date(document.date),
  durationInMinutes: document.durationInMinutes,
});

const eventRepository = {
  findIncoming: async (): Promise<Event[]> => {
    const now = new Date().toISOString();
    const cursor = getDb()
      .collection('event')
      .find({ date: { $gt: now } });
    return cursor.map((document) => parseToEvent(document)).toArray();
  },
  add: async (body: Partial<Event>) => {
    return getDb()
      .collection('event')
      .insertOne(body);
  },
};

export default eventRepository;
