import {describe,it,expect} from 'vitest';
import {render,screen} from '@testing-library/react';
import {MemoryRouter} from 'react-router-dom';
import {App} from './app';
describe('web foundation',()=>{it('shows the SokoLink landing page',()=>{render(<MemoryRouter><App/></MemoryRouter>);expect(screen.getByRole('heading',{name:/good ideas deserve a place to grow/i})).toBeTruthy();});});
