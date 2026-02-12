import Image from "next/image";
import styles from "./BlueOverlayImage.module.css";
import { ReactNode } from "react";

interface BlueOverlayImageProps {
  src: string;
  alt: string;
  children?: ReactNode;
  height?: number | string;
  width?: number | string;
  style?: React.CSSProperties;
}

export default function BlueOverlayImage({ src, alt, children, height = 400, width = "100%", style }: BlueOverlayImageProps) {
  return (
    <div className={styles.container} style={{ height, width, ...style }}>
      <Image
        src={src}
        alt={alt}
        fill
        style={{ objectFit: "cover" }}
        className={styles.bgImage}
        priority
      />
      <div className={styles.overlay} />
      {children && <div className={styles.content}>{children}</div>}
    </div>
  );
}
