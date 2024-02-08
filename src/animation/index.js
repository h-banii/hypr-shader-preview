import { Stopwatch } from './stopwatch.js';

export class Animation {
  constructor(render) {
    this.render = render;
    this.stopwatch = new Stopwatch;
    this.isRunning = false;
  }

  start() {
    this.isRunning = true;
    this.update();
  }

  stop() {
    this.isRunning = false;
  }

  update() {
    if (!this.isRunning) return;
    const time = this.stopwatch.check();
    this.render(time);
    requestAnimationFrame(() => this.update());
  }
}
