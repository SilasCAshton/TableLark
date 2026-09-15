"use client";

import { useEffect } from "react";

const DEFAULT_DURATION = 320;
const DEFAULT_EASING = "cubic-bezier(0.22, 1, 0.36, 1)";

export function useAnimatedHeight(elementRef, options = {}) {
  const {
    duration = DEFAULT_DURATION,
    easing = DEFAULT_EASING,
  } = options;

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return undefined;

    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    );
    let animation = null;
    let frame = null;
    let scheduledStartHeight = null;
    let settledHeight = element.getBoundingClientRect().height;

    function scheduleAnimation() {
      if (scheduledStartHeight === null) {
        scheduledStartHeight = animation
          ? element.getBoundingClientRect().height
          : settledHeight;
      }

      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        frame = null;
        const startHeight = animation
          ? element.getBoundingClientRect().height
          : scheduledStartHeight;

        animation?.cancel();
        animation = null;
        element.style.height = "";

        const targetHeight = element.getBoundingClientRect().height;
        scheduledStartHeight = null;

        if (
          reducedMotion.matches ||
          Math.abs(targetHeight - startHeight) < 0.5
        ) {
          settledHeight = targetHeight;
          return;
        }

        element.style.height = `${startHeight}px`;
        animation = element.animate(
          [
            { height: `${startHeight}px` },
            { height: `${targetHeight}px` },
          ],
          { duration, easing },
        );

        animation.onfinish = () => {
          animation = null;
          element.style.height = "";
          settledHeight = element.getBoundingClientRect().height;
        };
      });
    }

    const mutationObserver = new MutationObserver(scheduleAnimation);
    mutationObserver.observe(element, {
      attributes: true,
      attributeFilter: ["class", "hidden", "open"],
      childList: true,
      characterData: true,
      subtree: true,
    });

    const resizeObserver = new ResizeObserver(() => {
      if (animation || frame !== null) return;

      const currentHeight = element.getBoundingClientRect().height;
      if (Math.abs(currentHeight - settledHeight) >= 0.5) {
        scheduleAnimation();
      }
    });
    resizeObserver.observe(element);

    return () => {
      cancelAnimationFrame(frame);
      animation?.cancel();
      mutationObserver.disconnect();
      resizeObserver.disconnect();
      element.style.height = "";
    };
  }, [duration, easing, elementRef]);
}
