import type { ReactNode } from "react";

type KitchenIllustrationProps = {
  src: string;
  alt: string;
  width: number;
  height: number;
  className?: string;
};

/** Decorative SVG from public/illustrations — alt empty when aria-hidden wrapper is used. */
export function KitchenIllustration({
  src,
  alt,
  width,
  height,
  className,
}: KitchenIllustrationProps) {
  return (
    // eslint-disable-next-line @next/next/no-img-element -- lightweight local SVG decor
    <img
      src={src}
      alt={alt}
      width={width}
      height={height}
      className={className}
      decoding="async"
    />
  );
}

type AddIngredientPanelDecorProps = {
  children: ReactNode;
};

export function AddIngredientPanelDecor({ children }: AddIngredientPanelDecorProps) {
  return (
    <div className="relative mt-3">
      <div
        className="pointer-events-none absolute inset-0 overflow-visible"
        aria-hidden
      >
        <KitchenIllustration
          src="/illustrations/deco-tomato.svg"
          alt=""
          width={36}
          height={36}
          className="kitchen-illustration absolute -right-1 -top-2 h-8 w-8 sm:-right-2 sm:h-9 sm:w-9"
        />
        <KitchenIllustration
          src="/illustrations/deco-carrot.svg"
          alt=""
          width={32}
          height={32}
          className="kitchen-illustration absolute -bottom-1 -left-2 h-7 w-7 sm:-left-3 sm:h-8 sm:w-8"
        />
        <KitchenIllustration
          src="/illustrations/deco-egg.svg"
          alt=""
          width={28}
          height={28}
          className="kitchen-illustration absolute -left-1 top-8 h-6 w-6 opacity-80 sm:top-10 sm:h-7 sm:w-7"
        />
      </div>
      <div className="relative z-10">{children}</div>
    </div>
  );
}
