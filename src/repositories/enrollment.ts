import { ObjectId } from 'mongodb';
import { getDb } from '../database';

const enrollmentRepository = {
  enrollToNextEvent: async (eventId: ObjectId, person: string, email: string) => {
    await getDb()
      .collection('enrollment')
      .insertOne({ eventId, person, email });
  },
};

export default enrollmentRepository;
