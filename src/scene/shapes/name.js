import { MOBILE_AT_LOAD } from '../../state.js';
import { textShape } from './words.js';

export const name = () => textShape(MOBILE_AT_LOAD ? ['Victoria', 'Wachter'] : ['Victoria Wachter'], 'italic 500 180px "Bodoni Moda", "Cormorant Garamond", serif', MOBILE_AT_LOAD ? 3.3 : 6.8, { scatter: 0, depth: 0.03, stroke: 3 });
