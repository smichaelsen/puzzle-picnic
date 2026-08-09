import './style.css';
import { PuzzleApp } from './app';

const root = document.querySelector<HTMLElement>('#app');
if (!root) throw new Error('Missing application root.');

new PuzzleApp(root).start();
