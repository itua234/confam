const { createClient } = require("redis");

let client = null;
const redisHost = process.env.REDIS_HOST || 'YOUR-REDIS-HOST';
const redisPort = process.env.REDIS_PORT || 6379;
const redisPassword = process.env.REDIS_PASSWORD || 'YOUR-REDIS-PASSWORD';
const redisUser = process.env.REDIS_USER || '';
const redisTls = process.env.REDIS_TLS === 'true';

function initializeRedisClient() {
    if (!client) {
        // Build connection string
        const protocol = redisTls ? 'rediss' : 'redis';
        // Format the credentials part if credentials exist
        const credentials = redisPassword 
            ? (redisUser ? `${redisUser}:${redisPassword}@` : `:${redisPassword}@`) 
            : '';
            
        const connectionString = `${protocol}://${credentials}${redisHost}:${redisPort}`;
        console.log(`Connecting to Redis with: ${connectionString.replace(/:[^:@]*@/, ':***@')}`); // Log with hidden password
        
        client = createClient({
            url: connectionString,
            // socket: {
            //     tls: true,
            //     rejectUnauthorized: redisTls === true ? false : undefined,
            // },
            // retryStrategy: (times) => {
            //     const delay = Math.min(times * 50, 2000);
            //     console.log(`Retrying Redis connection in ${delay}ms...`);
            //     return delay;
            // }
        });
        client.on("error", (error) => {
            console.error(error);
        });
        // Connect to Redis
        (async () => {
            try {
                await client.connect();
                console.log('Redis client connected successfully');
            } catch (error) {
                console.error('Failed to connect to Redis:', error);
            }
        })();
    }
    return client;
}

// Create and export the singleton instance
const redisClient = initializeRedisClient();

module.exports = redisClient;