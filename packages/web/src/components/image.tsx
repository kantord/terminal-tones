"use client";

import OriginalImage, { type ImageProps, type StaticImageData } from "next/image";
import { forwardRef } from "react";
import { BASE_PATH } from "../../next.config";

export type BasePathImageProps = Omit<ImageProps, "src"> & {
  src: string | StaticImageData;
};
const Image = forwardRef<HTMLImageElement, BasePathImageProps>(
  ({ src, ...rest }, ref) => {
    const finalSrc =
      typeof src === "string" &&
      !src.startsWith("http") &&
      !src.startsWith(BASE_PATH)
        ? `${BASE_PATH}${src.startsWith("/") ? "" : "/"}${src}`
        : src;

    return <OriginalImage ref={ref} src={finalSrc} {...rest} />;
  }
);

Image.displayName = "Image";

export default Image;
