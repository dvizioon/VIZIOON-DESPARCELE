import { LogoMark } from "@/components/brand/logo";

export function SplashScreen({ leaving = false }: { leaving?: boolean }) {
  return (
    <div
      aria-busy="true"
      aria-live="polite"
      className={`splash-screen ${leaving ? "splash-screen-out" : ""}`}
      role="status"
    >
      <div aria-hidden className="splash-glow splash-glow-a" />
      <div aria-hidden className="splash-glow splash-glow-b" />

      <div className="splash-core">
        <div className="splash-mark">
          <LogoMark className="size-[7.5rem] sm:size-36" />
        </div>
        <p className="splash-word">Desparcele</p>
        <p className="splash-kicker">Organizando suas parcelas</p>
        <div className="splash-track">
          <span className="splash-bar" />
        </div>
      </div>
    </div>
  );
}
