import { WebhookClient } from 'dialogflow-fulfillment';
import { addMinutes, format, setHours } from 'date-fns';
import meetingRepository from './repositories/meeting';
import eventRepository from './repositories/event';
import enrollmentRepository from './repositories/enrollment';

type MeetingParams = {
  date: string;
  time: string;
};

type EnrollmentParams = {
  person: { name: string };
  email: string;
};

const meeting = async (
  intentMap: Map<string, () => void>,
  agent: WebhookClient,
  { date, time }: MeetingParams
) => {
  const datetime = setHours(new Date(date), new Date(time).getHours());
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

  intentMap.set('Wydarzenie', () => {
    if (!results.length) {
      agent.add(
        'Niestety nie ma nadchodzących wydarzeń w kalendarzu. Zapraszamy jednak do udziału w zajęciach prowadzonych przez studentów'
      );
      return;
    }

    const [{ title, date }] = results;
    agent.contexts.push({
      name: 'Wydarzenie-followup',
      lifespan: 3,
      parameters: { title },
    });

    if (results.length > 1) {
      const [, nextEvent] = results;
      agent.add(
        `Najbliższe wydarzenie to: ${title}. Odbędzie się ono: ${format(
          date,
          'yyyy-MM-dd'
        )} o godzinie ${format(date, 'H:mm')}. Następne wydarzenie to: ${
          nextEvent.title
        }, który jest zaplanowany na ${format(
          nextEvent.date,
          'yyyy-MM-dd'
        )}. Czy chciał(a)byś się zapisać na ${title}?`
      );
      return;
    }

    agent.add(
      `Najbliższe wydarzenie to: ${title}. Odbędzie się ono: ${format(
        date,
        'yyyy-MM-dd'
      )} o godzinie ${format(
        date,
        'H:mm'
      )} Czy chciał(a)byś się zapisać na ${title}?`
    );
  });
};

const enrollment = async (
  intentMap: Map<string, () => void>,
  agent: WebhookClient,
  { person, email }: EnrollmentParams
) => {
  const name = person?.name;

  intentMap.set('Wydarzenie-yes', async () => {
    const result = await eventRepository.findIncoming();
    if (result?.length) {
      const [{ id: eventId, title }] = result;
      await enrollmentRepository.enrollToNextEvent(eventId, name, email);
      agent.add(
        `Potwierdzam zapis: ${name} <${email}> na wydarzenie: ${title}. Dziękujemy za skorzystanie z bota BIT-u do zapisu na wydarzenie! Do zobaczenia wkrótce!`
      );
    }
  });
};

const getIntentMap = async (agent: WebhookClient, req: any) => {
  const intentMap = new Map();

  await meeting(intentMap, agent, req.body.queryResult.parameters);
  await events(intentMap, agent);
  await enrollment(intentMap, agent, req.body.queryResult.parameters);

  return intentMap;
};

export default getIntentMap;
