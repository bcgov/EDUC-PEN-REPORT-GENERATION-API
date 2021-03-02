import {EVENTS_QUEUE, TOPICS} from '../constants/messaging';
import logger from '../components/logger';
import {Client} from 'nats';
import {EventHandlerService} from '../service/event-handler-service';
import {Event} from '../struct/v1/event';

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
      queue: EVENTS_QUEUE,
    };
    this._topics.forEach((topic: string) => {
      nats.subscribe(topic, opts, async (msg, reply, subject, sid) => {
        const event: Event = JSON.parse(msg);
        logger.info(`Received message, on ${subject} , Subscription Id :: [${sid}], :: Reply to :: [${reply}], Data ::`, event);
        const response: Event | any = await EventHandlerService.instance.handleEvent(event);
        if (response) {
          if (reply) {
            nats.publish(reply, JSON.stringify(response));
          } else if (event.replyTo) {
            nats.publish(event.replyTo, JSON.stringify(response));
          }
        }
      });

    });
  }
}
