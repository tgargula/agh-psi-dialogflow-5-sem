import { addMinutes } from 'date-fns';
import { WithId, Document } from 'mongodb';
import { getDb } from '../database';

type Meeting = {
  title: string;
  datetime: Date;
  endDate: Date;
  createdAt: Date;
};

const parseToEvent = (document: WithId<Document>): Meeting => ({
  title: document.title,
  datetime: document.datetime,
  endDate: document.endDate,
  createdAt: document.createdAt,
});

const meetingRepository = {
  isFree: async (datetime: Date, duration: number = 30): Promise<boolean> => {
    const end = addMinutes(datetime, duration).toISOString();
    const date = datetime.toISOString();
    const cursor = getDb()
      .collection('meeting')
      .find({
        $or: [
          { datetime: { $gte: date, $lte: end } },
          { endDate: { $gte: date, $lte: end } },
        ],
      });
    return (await cursor.count()) === 0;
  },
  create: async (params: Partial<Meeting>) => {
    return getDb().collection('meeting').insertOne(params);
  },
  findIncoming: async () => {
    const now = new Date().toISOString();
    const cursor = getDb()
      .collection('meeting')
      .find({ datetime: { $gt: now } });
    return cursor.map((meeting) => parseToEvent(meeting)).toArray();
  },
};

export default meetingRepository;
