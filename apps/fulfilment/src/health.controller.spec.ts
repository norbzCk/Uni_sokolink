import {describe,expect,it,vi} from 'vitest';
import {HealthController} from './health.controller';
describe('HealthController',()=>{it('reports liveness without probing infrastructure',()=>{const controller=new HealthController({check:vi.fn()} as never);expect(controller.health()).toMatchObject({status:'ok',service:'fulfilment'});});});
