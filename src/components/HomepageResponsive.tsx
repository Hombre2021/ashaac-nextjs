"use client";

import { useEffect, useRef, useState } from "react";
import HomepageDesktop from "./HomepageDesktop";
import HomepageMobile from "./HomepageMobile";
import styles from "./HomepageResponsive.module.css";

const DESKTOP_BASE = { width: 1920, height: 1080 };
const MOBILE_BASE = { width: 390, height: 844 };

type ScaleMode = "contain" | "fit-height" | "fit-width";

const clampScale = (scale: number, allowUpscale: boolean) =>
  allowUpscale ? scale : Math.min(scale, 1);

const getScale = (
  viewportWidth: number,
  viewportHeight: number,
  baseWidth: number,
  baseHeight: number,
  mode: ScaleMode
) => {
  if (!viewportWidth || !viewportHeight) {
    return 1;
  }

  if (mode === "fit-height") {
    return viewportHeight / baseHeight;
  }

  if (mode === "fit-width") {
    return viewportWidth / baseWidth;
  }

  return Math.min(viewportWidth / baseWidth, viewportHeight / baseHeight);
};

export default function HomepageResponsive() {
  const [viewport, setViewport] = useState({ width: 0, height: 0 });
  const [contentHeight, setContentHeight] = useState(0);
  const stageRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const updateViewport = () => {
      setViewport({ width: window.innerWidth, height: window.innerHeight });
    };

    updateViewport();
    window.addEventListener("resize", updateViewport);

    return () => window.removeEventListener("resize", updateViewport);
  }, []);

  const isPortrait = viewport.height >= viewport.width && viewport.width > 0;
  const isPortraitMobile = isPortrait && viewport.width <= 768;
  const isLandscapePhone =
    !isPortrait &&
    viewport.width > 0 &&
    viewport.height > 0 &&
    viewport.height <= 800 &&
    viewport.width / viewport.height >= 1.8;

  const layout = isPortraitMobile || isLandscapePhone ? "mobile" : "desktop";
  const isFullDesktop = layout === "desktop" && viewport.width >= 1200;
  const base = layout === "mobile" ? MOBILE_BASE : DESKTOP_BASE;
  const scaleMode: ScaleMode = layout === "mobile" ? "fit-width" : isLandscapePhone ? "fit-height" : "contain";

  const scale = clampScale(
    getScale(viewport.width, viewport.height, base.width, base.height, scaleMode),
    false
  );

  useEffect(() => {
    const ref = stageRef.current;
    if (!ref) {
      return;
    }

    try {
      const observer = new ResizeObserver((entries) => {
        const [entry] = entries;
        if (entry?.contentRect?.height) {
          setContentHeight(entry.contentRect.height);
        }
      });

      observer.observe(ref);

      return () => observer.disconnect();
    } catch (error) {
      console.error("ResizeObserver error:", error);
    }
  }, [layout]);

  const styleVars = {
    "--scale": scale.toString(),
    "--base-width": `${base.width}px`,
    "--base-height": `${base.height}px`,
    "--content-height": `${contentHeight || base.height}px`,
  } as React.CSSProperties;

  if (isFullDesktop) {
    return <HomepageDesktop />;
  }

  if (layout === "mobile") {
    return <HomepageMobile />;
  }

  return (
    <div className={styles.viewport} style={styleVars} data-layout={layout} data-scale={scaleMode}>
      <div className={styles.stageShell}>
        <div className={styles.stage} ref={stageRef}>
          <HomepageDesktop />
        </div>
      </div>
    </div>
  );
}
