import Image, { type ImageLoaderProps } from 'next/image';
import type { ComponentProps } from 'react';

type PreviewImageProps = Omit<ComponentProps<typeof Image>, 'loader' | 'unoptimized' | 'alt'> & {
  alt: string;
};

function passthroughLoader({ src }: ImageLoaderProps): string {
  return src;
}

export default function PreviewImage({ alt, ...props }: PreviewImageProps) {
  return <Image {...props} alt={alt} loader={passthroughLoader} unoptimized />;
}
