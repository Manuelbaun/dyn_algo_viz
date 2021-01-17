import type { Svg } from '@svgdotjs/svg.js';
import type { PanZoom } from 'panzoom';

export async function autoZoom(panzoom: PanZoom, targetSVG: Svg) {
  const svg = targetSVG;

  const parent = svg.parent().node;

  const rectParent = parent.getBoundingClientRect();
  const rectScene = svg.node.getBoundingClientRect();

  console.log(rectParent, rectScene);

  const xys = panzoom.getTransform();
  const originWidth = rectScene.width / xys.scale;
  const originHeight = rectScene.height / xys.scale;
  const zoomX = (rectParent.width - 20) / originWidth;
  const zoomY = (rectParent.height - 20) / originHeight;

  let targetScale = zoomX < zoomY ? zoomX : zoomY;

  //when target scale is the same as currently, we reset back to 100%, so it acts as toggle.
  if (Math.abs(targetScale - xys.scale) < 0.005) {
    //reset to 100%
    targetScale = 1;
  }

  const targetWidth = originWidth * xys.scale;
  const targetHeight = originHeight * xys.scale;
  const newX =
    targetWidth > rectParent.width
      ? -(targetWidth / 2) + rectParent.width / 2
      : rectParent.width / 2 - targetWidth / 2;
  const newY =
    targetHeight > rectParent.height
      ? -(targetHeight / 2) + rectParent.height / 2
      : rectParent.height / 2 - targetHeight / 2;

  //we need to cancel current running animations
  panzoom.pause();
  panzoom.resume();

  const xDiff = Math.abs(newX - xys.x);
  const yDiff = Math.abs(newX - xys.x);

  if (xDiff > 5 || yDiff > 5) {
    //overything over 5px change will be animated
    panzoom.moveBy(newX - xys.x, newY - xys.y, true);
    // await sleep(0.25);
  } else {
    panzoom.moveBy(newX - xys.x, newY - xys.y, false);
  }

  //correct way to zoom with center of graph as origin when scaled
  panzoom.smoothZoomAbs(
    xys.x + (originWidth * xys.scale) / 2,
    xys.y + (originHeight * xys.scale) / 2,
    targetScale,
  );
}
