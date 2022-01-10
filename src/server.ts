import express from 'express';
import { WebhookClient } from 'dialogflow-fulfillment';
import getIntentMap from './intents';
import { connectToServer } from './database';
import meetingRepository from './repositories/meeting';
import eventRepository from './repositories/event';

const server = async () => {
  await connectToServer();
  const app = express();
  const port = process.env.PORT || 3000;

  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  app.post('/dialogflow', async (req, res) => {
    const agent = new WebhookClient({ request: req, response: res });
    const intentMap = await getIntentMap(agent, req);
    agent.handleRequest(intentMap);
  });

  app.get('/meetings', async (req, res) => {
    const meetings = await meetingRepository.findIncoming();
    res.json(meetings);
  });

  app.get('/events', async (req, res) => {
    const events = await eventRepository.findIncoming();
    res.json(events);
  });

  app.post('/events/add', async (req, res) => {
    const event = req.body;
    const result = await eventRepository.add(event);
    console.log(result);
    res.status(201).send('OK');
  });

  app.listen(port, () => {
    console.info(`The app is listening at http://localhost:${port}.`);
  });

  process.env.DEBUG = 'dialogflow:debug'; // enables lib debugging statements

  // export const dialogflowFirebaseFulfillment = functions.https.onRequest((request, response) => {
  //   const agent = new WebhookClient({ request, response });
  //   console.log('Dialogflow Request headers: ' + JSON.stringify(request.headers));
  //   console.log('Dialogflow Request body: ' + JSON.stringify(request.body));

  //   function welcome(agent) {
  //     agent.add(`Welcome to my agent!`);
  //   }

  //   function fallback(agent) {
  //     agent.add(`I didn't understand`);
  //     agent.add(`I'm sorry, can you try again?`);
  //   }

  //   // // Uncomment and edit to make your own intent handler
  //   // // uncomment `intentMap.set('your intent name here', yourFunctionHandler);`
  //   // // below to get this function to be run when a Dialogflow intent is matched
  //   // function yourFunctionHandler(agent) {
  //   //   agent.add(`This message is from Dialogflow's Cloud Functions for Firebase editor!`);
  //   //   agent.add(new Card({
  //   //       title: `Title: this is a card title`,
  //   //       imageUrl: 'https://developers.google.com/actions/images/badges/XPM_BADGING_GoogleAssistant_VER.png',
  // eslint-disable-next-line max-len
  //   //       text: `This is the body text of a card.  You can even use line\n  breaks and emoji! 💁`,
  //   //       buttonText: 'This is a button',
  //   //       buttonUrl: 'https://assistant.google.com/'
  //   //     })
  //   //   );
  //   //   agent.add(new Suggestion(`Quick Reply`));
  //   //   agent.add(new Suggestion(`Suggestion`));
  //   //   agent.setContext({ name: 'weather', lifespan: 2, parameters: { city: 'Rome' }});
  //   // }

  //   // // Uncomment and edit to make your own Google Assistant intent handler
  //   // // uncomment `intentMap.set('your intent name here', googleAssistantHandler);`
  //   // // below to get this function to be run when a Dialogflow intent is matched
  //   // function googleAssistantHandler(agent) {
  //   //   let conv = agent.conv(); // Get Actions on Google library conv instance
  // eslint-disable-next-line max-len
  //   //   conv.ask('Hello from the Actions on Google client library!') // Use Actions on Google library
  //   //   agent.add(conv); // Add Actions on Google library responses to your agent's response
  //   // }
  //   // // See https://github.com/dialogflow/fulfillment-actions-library-nodejs
  // eslint-disable-next-line max-len
  //   // // for a complete Dialogflow fulfillment library Actions on Google client library v2 integration sample

  //   // Run the proper function handler based on the matched Dialogflow intent name
  //   let intentMap = new Map();
  //   intentMap.set('Default Welcome Intent', welcome);
  //   intentMap.set('Default Fallback Intent', fallback);
  //   // intentMap.set('your intent name here', yourFunctionHandler);
  //   // intentMap.set('your intent name here', googleAssistantHandler);
  //   agent.handleRequest(intentMap);
  // });
};

export default server;
