import { EVENTS_QUEUE, TOPICS } from '../constants/messaging';
import logger from '../components/logger';
import { Client } from 'nats';
import { EventHandlerService } from '../service/event-handler-service';


export class NatsSubscriber {
  public static get instance(): NatsSubscriber {
    if (!this._instance) {
      this._instance = new NatsSubscriber();
    }
    return this._instance;
  }
  private static _instance: NatsSubscriber;
  private readonly _topics: readonly string[];
  private constructor() {
    this._topics = TOPICS;
  }
  public subscribe(nats: Client): void {
    const opts = {
      queue : EVENTS_QUEUE,
    };
    this._topics.forEach((topic: string) => {
      nats.subscribe(topic, opts, async (msg, reply, subject, sid) => {
        logger.info(`Received message, on ${subject} , Subscription Id :: [${sid}], :: Reply to :: [${reply}], Data ::`, JSON.parse(msg));
        await EventHandlerService.instance.handleEvent(msg, subject, reply, nats);
      });

    });
  }
}
