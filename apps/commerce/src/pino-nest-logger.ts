import type {LoggerService} from '@nestjs/common';
import type {Logger} from 'pino';
export class PinoNestLogger implements LoggerService {
 constructor(private readonly logger:Logger){}
 log(message:unknown,...args:unknown[]){this.logger.info({context:args[0]},String(message));}
 error(message:unknown,...args:unknown[]){this.logger.error({context:args[0],trace:args[1]},String(message));}
 warn(message:unknown,...args:unknown[]){this.logger.warn({context:args[0]},String(message));}
 debug(message:unknown,...args:unknown[]){this.logger.debug({context:args[0]},String(message));}
 verbose(message:unknown,...args:unknown[]){this.logger.trace({context:args[0]},String(message));}
 fatal(message:unknown,...args:unknown[]){this.logger.fatal({context:args[0]},String(message));}
}
