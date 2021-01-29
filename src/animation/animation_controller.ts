import type { AppState } from "../service/app_state";
import anime from "./animejs/anime";

/**
 * The animation Controller
 * call dispose, when the animation should be cleared up
 */
export default class AnimationController {
  /**
   * The initial timeline is used, to setup the start states of the algorithm
   * You be advised, that animejs uses the internally `requestAnimationFrame` browser api
   * the update the animation.
   * When a timeline is created, the the startpoint is set
   */
  initTimeline = anime.timeline(
    {
      easing: "easeInOutQuad",
      duration: 200,
      autoplay: false,
      shouldReset: false,
    },
    false
  );

  algoTimeline = anime.timeline(
    {
      easing: "easeInOutQuad",
      duration: 200,
      autoplay: false,
      shouldReset: false,
      useDeltaTime: true,
    },
    true
  );

  constructor(appState: AppState) {
    this.algoTimeline.update = async (timeline) => {
      appState.progress.set(timeline.progress);
      appState.currentTime.set(timeline.currentTime);
      appState.currentDuration.set(timeline.duration);
    };

    this.unsubscriber.push(
      appState.animationSpeed.subscribe((data) => this.setSpeed(data))
    );

    this.unsubscriber.push(
      appState.progress.subscribe((data) => this.setProgress(data))
    );

    this.unsubscriber.push(
      appState.event.subscribe((event) => {
        if (event == "RESET") {
          // in theory should now reset! and clear all animation
        } else if (event == "PAUSE") {
          this.pause();
        } else if (event == "CONTINUE") {
          this.continue();
        } else if (event == "STEP") {
          this.algoTimeline.step();
        }
      })
    );
  }

  /**
   * cleanup
   */
  unsubscriber: Function[] = [];
  dispose() {
    this.unsubscriber.forEach((unsub) => unsub());
  }

  play() {
    this.algoTimeline.play();
  }

  continue() {
    this.algoTimeline.continue();
  }

  pause() {
    this.algoTimeline.pause();
  }

  reset() {
    this.algoTimeline.reset();
  }

  clear() {
    /// todo: need to delete all animation children!
    /// to acutally reset completly, since the reset method on the timelines
    /// only resets the timing, and will start from the beginning.
  }

  getProgress() {
    return this.algoTimeline.progress;
  }

  getSpeed() {
    return anime.speed;
  }

  /**
   * @param {number} speed (0.1-10)
   */
  setSpeed(speed: number) {
    anime.speed = speed;
  }

  /**
   * @param {number} value  (0-100)
   *      * Needs to prevent to set the seek time to 100, because,
   * the finished promise will be fulfilled and the animation
   * continues, without that the continue button beeing pressed
   */
  setProgress(value: number) {
    const seekTime = (value / 100) * this.algoTimeline.duration;
    this.algoTimeline.seek(seekTime);
  }
}
