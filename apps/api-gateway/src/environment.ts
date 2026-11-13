import {config} from 'dotenv';
import {resolve} from 'node:path';
config({path:resolve(process.cwd(),'../../.env')});
import {z} from 'zod';
const EnvironmentSchema=z.object({NODE_ENV:z.enum(['development','test','production']).default('development'),PORT:z.coerce.number().int().min(1).max(65535).default(Number(process.env.SERVICE_PORT??3000)),DATABASE_URL:z.string().min(1).optional(),AMQP_URL:z.string().min(1),CORS_ORIGINS:z.string().default('http://localhost:5173').transform(v=>v.split(',').map(x=>x.trim())),LOG_LEVEL:z.enum(['fatal','error','warn','info','debug','trace']).default('info')});
export function loadEnvironment(){
  if(!process.env.DATABASE_URL && 'api-gateway' !== 'api-gateway'){const password=process.env['API-GATEWAY_DB_PASSWORD'];if(password){process.env.DATABASE_URL='postgresql://api-gateway_owner:'+encodeURIComponent(password)+'@localhost:'+(process.env.POSTGRES_PORT??'5432')+'/api-gateway_db?schema=public';}}
  const parsed=EnvironmentSchema.safeParse(process.env);if(!parsed.success)throw new Error('Invalid service environment: '+parsed.error.issues.map(i=>i.path.join('.')+' '+i.message).join('; '));return parsed.data;}
