import express, {Request, Response} from 'express';
import {NatsClient} from '../components/nats';
import {Redis} from '../components/redis';

export class HealthCheckController {
  private _redis: Redis;
  private _nats: NatsClient;

  public get Router(): any {
    return this._router;
  }

  private readonly _router: any;

  public constructor(nats: NatsClient, redis: Redis) {
    this._redis = redis;
    this._nats = nats;
    this._router = express.Router();
    this._router.get('/api/health', (req: Request, res: Response) => this.healthCheck(req, res));
  }

  private healthCheck(_req: Request, res: Response): void {
    if (this._redis.isConnectionClosed() || this._nats.isConnectionClosed()) {
      res.sendStatus(503);
    } else {
      res.sendStatus(200);
    }
  }
}

