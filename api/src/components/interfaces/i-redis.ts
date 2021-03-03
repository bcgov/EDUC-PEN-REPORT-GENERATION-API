import IORedis from 'ioredis';

export interface IRedis {
  getRedisClient(): IORedis.Redis | IORedis.Cluster
  isConnectionClosed(): boolean
}
