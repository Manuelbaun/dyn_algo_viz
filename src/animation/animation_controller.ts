import type { AppState } from "../service/app_state";
import anime from "./animejs/anime";

/**
 * The animation Controller
 * call dispose, when the animation should be cleared up
 *
 * There are two timelines used:
 * The initial timeline is used, to setup the start states of the algorithm
 * You be advised, that animejs uses the internally `requestAnimationFrame` browser api
 * the update the animation.
 * When a timeline is created, the the startpoint is set
 *
 */
export default class AnimationController {
  private _initTimeline = anime.timeline({
    easing: "easeInOutQuad",
    duration: 200,
    autoplay: false,
    shouldReset: false,
  });

  get initTimeline() {
    return this._initTimeline;
  }

  private _algoTimeline = anime.timeline({
    easing: "easeInOutQuad",
    duration: 200,
    autoplay: false,
    shouldReset: false,
    useDeltaTime: true,
  });

  get algoTimeline() {
    return this._algoTimeline;
  }

  constructor(appState: AppState) {
    // update appstate with progress, current time and duration
    this.algoTimeline.update = (timeline) => {
      appState.progress.set(timeline.progress);
      appState.currentTime.set(timeline.currentTime);
      appState.duration.set(timeline.duration);
    };

    // update speed from state
    this.unsubscriber.push(
      appState.animationSpeed.subscribe((data) => this.setSpeed(data))
    );

    // update progress from state
    this.unsubscriber.push(
      appState.progress.subscribe((data) => this.setProgress(data))
    );

    // subscribe to state events
    this.unsubscriber.push(
      appState.event.subscribe((event) => {
        if (event == "reset") {
          // in theory should now reset! and clear all animation
          // but will be handled via dispose for now!
        } else if (event == "pause") {
          this.algoTimeline.pause();
        } else if (event == "continue") {
          this.algoTimeline.continue();
        } else if (event == "step") {
          this.algoTimeline.step();
        }
      })
    );
  }

  /**
   * cleanup
   */
  private unsubscriber: Function[] = [];
  public dispose() {
    console.log("Dispose Animation Controller");
    this._initTimeline.pause();
    this._algoTimeline.pause();
    // unsubscribe
    this.unsubscriber.forEach((unsub) => unsub());
    /// so help the garbage collector
    // @ts-ignore
    this._initTimeline = undefined;
    // @ts-ignore
    this._algoTimeline = undefined;
  }

  /** (0.1-10) */
  private setSpeed(value: number) {
    if (value < 0.1) value = 0.1;
    if (value > 10) value = 10;

    anime.speed = value;
  }

  /**
   * @param {number} value  (0-100)
   */
  private setProgress(value: number) {
    const seekTime = (value / 100) * this.algoTimeline.duration;
    this.algoTimeline.seek(seekTime);
  }
}
