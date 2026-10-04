type LogoMarkProps = {
  className?: string;
  variant?: "color" | "mono";
};

export function LogoMark({ className = "size-8", variant = "color" }: LogoMarkProps) {
  const back = variant === "mono" ? "currentColor" : "#0B4038";
  const mid = variant === "mono" ? "currentColor" : "#0C584C";
  const check = variant === "mono" ? "currentColor" : "#0D675D";

  return (
    <svg aria-hidden className={className} fill="none" viewBox="0 0 525 525">
      <rect fill={back} height="525" opacity={variant === "mono" ? 0.42 : 1} rx="34" width="324.116" />
      <path
        d="M324.139 145.895C323.465 150.615 323.116 155.435 323.116 160.333C323.116 218.323 371.917 265.333 432.116 265.333C471.393 265.333 505.816 245.32 525 215.304V492C525 510.225 510.225 525 492 525H218.691C200.466 525 185.691 510.225 185.691 492V118C185.691 99.7746 200.466 85 218.691 85H324.139V145.895Z"
        fill={mid}
        opacity={variant === "mono" ? 0.72 : 1}
      />
      <path
        d="M410.359 187.72L354.209 131.571C350.836 128.198 350.836 122.728 354.209 119.355L366.425 107.138C369.799 103.764 375.269 103.764 378.642 107.138L416.467 144.963L497.483 63.9463C500.857 60.5729 506.327 60.5729 509.7 63.9463L521.916 76.1628C525.289 79.5361 525.289 85.0056 521.916 88.3793L422.575 187.721C419.201 191.094 413.732 191.094 410.359 187.72Z"
        fill={check}
      />
    </svg>
  );
}

export function Logo({
  className = "",
  markClassName = "size-16",
  showWordmark = true,
}: {
  className?: string;
  markClassName?: string;
  showWordmark?: boolean;
}) {
  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <span className="inline-flex">
        <LogoMark className={markClassName} />
      </span>
      {showWordmark ? (
        <span className="leading-none">
          <span className="block font-display text-2xl tracking-wide">Desparcele</span>
        </span>
      ) : null}
    </span>
  );
}
