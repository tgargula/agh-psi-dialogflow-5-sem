import { WebhookClient } from 'dialogflow-fulfillment';
import { addMinutes, format } from 'date-fns';
import meetingRepository from './repositories/meeting';
import eventRepository from './repositories/event';

type MeetingParams = {
  date: string;
  time: string;
};

const meeting = async (
  intentMap: Map<string, () => void>,
  agent: WebhookClient,
  { date, time }: MeetingParams
) => {
  const datetime = new Date(date);
  const endDate = addMinutes(datetime, 30);

  intentMap.set('Spotkanie', async () => {
    if (!(await meetingRepository.isFree(datetime))) {
      agent.add(
        'Niestety ten termin jest zajęty. Spróbuj umówić się na spotkanie ponownie'
      );
      return;
    }
    await meetingRepository.create({
      title: `Dialogflow Meeting: ${Math.random().toString().slice(2)}`,
      datetime,
      endDate,
      createdAt: new Date(),
    });
    agent.add(
      `Umówiłem spotkanie na ${format(datetime, 'yyyy-MM-dd')}, godz. ${format(
        datetime,
        'H:mm'
      )}`
    );
  });
};

const events = async (
  intentMap: Map<string, () => void>,
  agent: WebhookClient
) => {
  const results = await eventRepository.findIncoming();

  intentMap.set('Wydarzenie', async () => {
    if (!results.length) {
      agent.add(
        'Niestety nie ma nadchodzących wydarzeń w kalendarzu. Zapraszamy jednak do udziału w zajęciach prowadzonych przez studentów'
      );
      return;
    }

    const [{ title, date }] = results;
    agent.add(
      `Najbliższe wydarzenie to: ${title}. Odbędzie się ono: ${format(
        date,
        'yyyy-MM-dd'
      )} o godzinie ${format(date, 'H:mm')}`
    );

    if (results.length > 1) {
      const [, nextEvent] = results;
      agent.add(
        `Najbliższe wydarzenie to: ${title}. Odbędzie się ono: ${format(
          date,
          'yyyy-MM-dd'
        )} o godzinie ${format(date, 'H:mm')}. Następne wydarzenie to: ${
          nextEvent.title
        }, który jest zaplanowany na ${format(nextEvent.date, 'yyyy-MM-dd')}`
      );
    }
  });
};

const getIntentMap = async (agent: WebhookClient, req: any) => {
  const intentMap = new Map();

  await meeting(intentMap, agent, req.body.queryResult.parameters);
  await events(intentMap, agent);

  return intentMap;
};

export default getIntentMap;
