import { appController } from "../service/app_controller";
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
  initTimeline = anime.timeline({
    easing: "easeInOutQuad",
    duration: 200,
    autoplay: false,
    shouldReset: false,
  });

  algoTimeline = anime.timeline({
    easing: "easeInOutQuad",
    duration: 200,
    autoplay: false,
    shouldReset: false,
    // update: (anim) => actions.setAnimationStatus("UPDATE"),
    // begin: (anim) => actions.setAnimationStatus("BEGIN"),
    // complete: (anim) => actions.setAnimationStatus("COMPLETE"),
  });

  constructor() {
    this.algoTimeline.update = async ({ progress }) => {
      appController.setProgress(progress);
    };
    const { progress, speed, state, event } = appController;

    speed.subscribe((data) => this.setSpeed(data));

    progress.subscribe((data) => this.setProgress(data));

    state.subscribe((data) => {
      if (data == "PAUSED") this.pause();
      if (data == "RUNNING") this.continue();
    });

    event.subscribe((data) => {
      if (data == "RESET") {
        // in theory should now reset! and clear all animation
      }

      if (data == "STEP") {
        this.algoTimeline.step();
      }
    });
  }

  /**
   * cleanup
   */
  dispose() {}

  play() {
    this.algoTimeline.play();
  }

  continue() {
    this.algoTimeline.continue();
  }

  pause() {
    this.algoTimeline.break();
  }

  reset() {
    this.algoTimeline.reset();
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
