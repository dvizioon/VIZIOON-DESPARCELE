"use client";

import { useLayoutEffect, useRef } from "react";
import gsap from "gsap";
import { LogoMark } from "@/components/brand/logo";
import { AppIcon } from "@/components/ui/icon";

export type AuthStoryVariant = "login" | "register" | "recover";

export function AuthStory({ variant }: { variant: AuthStoryVariant }) {
  const rootRef = useRef<HTMLDivElement>(null);
  const sceneCount = variant === "register" ? 4 : variant === "login" ? 3 : 2;

  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root) {
      return;
    }

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const scenes = root.querySelectorAll<HTMLElement>("[data-scene]");
    const bits = root.querySelectorAll<HTMLElement>("[data-bit]");
    const orbs = root.querySelectorAll<HTMLElement>("[data-orb]");
    const dots = root.querySelectorAll<HTMLElement>("[data-dot]");
    const fills = root.querySelectorAll<HTMLElement>("[data-fill]");

    const ctx = gsap.context(() => {
      if (orbs[0]) {
        gsap.to(orbs[0], {
          x: 28,
          y: 22,
          scale: 1.08,
          duration: 7,
          yoyo: true,
          repeat: -1,
          ease: "sine.inOut",
        });
      }
      if (orbs[1]) {
        gsap.to(orbs[1], {
          x: -24,
          y: -18,
          scale: 1.12,
          duration: 8.5,
          yoyo: true,
          repeat: -1,
          ease: "sine.inOut",
        });
      }
      if (orbs[2]) {
        gsap.to(orbs[2], {
          x: 16,
          y: -26,
          duration: 6.2,
          yoyo: true,
          repeat: -1,
          ease: "sine.inOut",
        });
      }

      if (reduce) {
        gsap.set(scenes, { opacity: 0, clearProps: "transform,filter" });
        if (scenes[0]) {
          gsap.set(scenes[0], { opacity: 1 });
        }
        gsap.set(bits, { opacity: 1, clearProps: "transform,filter" });
        gsap.set(fills, { width: (_index, target) => (target as HTMLElement).dataset.fill ?? "100%" });
        if (dots[0]) {
          gsap.set(dots[0], { width: 28, opacity: 1 });
        }
        return;
      }

      gsap.set(scenes, { opacity: 0, y: 28, filter: "blur(12px)" });
      gsap.set(bits, { opacity: 0, y: 18, scale: 0.92, rotate: 1.4 });
      gsap.set(fills, { width: 0 });
      gsap.set(dots, { width: 8, opacity: 0.28 });

      const timeline = gsap.timeline({ repeat: -1, repeatDelay: 0.35 });
      const hold = variant === "register" ? 2.6 : 2.35;

      scenes.forEach((scene, index) => {
        const localBits = scene.querySelectorAll<HTMLElement>("[data-bit]");
        const localFills = scene.querySelectorAll<HTMLElement>("[data-fill]");
        const at = index === 0 ? 0 : ">";

        timeline.to(dots, { width: 8, opacity: 0.28, duration: 0.25, ease: "power2.out" }, at);
        if (dots[index]) {
          timeline.to(dots[index], { width: 28, opacity: 1, duration: 0.35, ease: "power3.out" }, "<");
        }
        timeline.to(
          scene,
          { opacity: 1, y: 0, filter: "blur(0px)", duration: 0.7, ease: "power3.out" },
          "<",
        );
        timeline.to(
          localBits,
          {
            opacity: 1,
            y: 0,
            scale: 1,
            rotate: 0,
            duration: 0.55,
            stagger: 0.1,
            ease: "back.out(1.4)",
          },
          "<0.12",
        );
        localFills.forEach((fill) => {
          timeline.to(
            fill,
            { width: fill.dataset.fill ?? "100%", duration: 0.9, ease: "power2.out" },
            "<0.18",
          );
        });
        timeline.to({}, { duration: hold });
        timeline.to(localBits, {
          opacity: 0,
          y: -16,
          scale: 0.96,
          duration: 0.32,
          stagger: 0.04,
          ease: "power2.in",
        });
        timeline.to(
          scene,
          { opacity: 0, y: -20, filter: "blur(8px)", duration: 0.4, ease: "power2.in" },
          "<0.06",
        );
      });
    }, root);

    return () => {
      ctx.revert();
    };
  }, [variant]);

  return (
    <div className="relative flex h-full min-h-[18rem] flex-col justify-between overflow-hidden px-6 py-8 sm:px-10 sm:py-12 lg:min-h-screen" ref={rootRef}>
      <div className="pointer-events-none absolute inset-0">
        <div
          className="absolute inset-0 opacity-[0.12]"
          style={{
            backgroundImage: gridBg,
            backgroundSize: "28px 28px",
          }}
        />
        <div
          className="absolute -left-24 -top-16 size-80 rounded-full bg-[#148576]/35 blur-3xl"
          data-orb
        />
        <div
          className="absolute -right-16 bottom-0 size-96 rounded-full bg-[#c05621]/18 blur-3xl"
          data-orb
        />
        <div
          className="absolute left-1/3 top-1/2 size-40 rounded-full bg-white/10 blur-2xl"
          data-orb
        />
      </div>

      <div className="relative flex items-center gap-3 text-[#F4EFE6]">
        <LogoMark className="size-14 shrink-0 sm:size-16" variant="mono" />
        <div>
          <p className="font-display text-3xl tracking-wide text-white">Desparcele</p>
          <p className="text-sm text-white/65">Parcelas no controle</p>
        </div>
      </div>

      <div className="relative mt-10 min-h-[16rem] flex-1 lg:mt-16">
        {variant === "register" ? <RegisterScenes /> : null}
        {variant === "login" ? <LoginScenes /> : null}
        {variant === "recover" ? <RecoverScenes /> : null}

        <div className="absolute bottom-0 left-0 flex items-center gap-1.5">
          {Array.from({ length: sceneCount }, (_, index) => (
            <span className="h-1.5 rounded-full bg-white" data-dot key={index} />
          ))}
        </div>
      </div>
    </div>
  );
}

const gridBg =
  "linear-gradient(rgba(255,255,255,0.09) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.09) 1px, transparent 1px)";

function RegisterScenes() {
  return (
    <>
      <Scene kicker="1 de 4" title="Você dá um nome">
        <Card>
          <p className="text-xs text-ink/45">Nova dívida</p>
          <p className="mt-1 font-display text-2xl">Curso</p>
          <p className="mt-3 text-sm text-ink/50">R$ 1.200 em 6x</p>
        </Card>
      </Scene>
      <Scene kicker="2 de 4" title="Parte em pedaços que cabem">
        <div className="flex gap-2">
          {["01", "02", "03"].map((item, index) => (
            <Card key={item}>
              <p className="text-[11px] uppercase tracking-wide text-ink/40">Parcela {item}</p>
              <p className="mt-1 font-display text-xl">R$ 200</p>
              <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-paper">
                <div className="h-full rounded-full bg-pine" data-fill={index === 0 ? "100%" : "0%"} />
              </div>
            </Card>
          ))}
        </div>
      </Scene>
      <Scene kicker="3 de 4" title="Marca o que já saiu">
        <Card>
          <div className="flex items-center gap-2 text-pine">
            <AppIcon name="tabler:circle-check" className="size-5" />
            <span className="text-sm font-medium">Parcela 1 paga</span>
          </div>
          <p className="mt-3 font-display text-3xl">33%</p>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-paper">
            <div className="h-full rounded-full bg-gradient-to-r from-pine to-moss" data-fill="33%" />
          </div>
        </Card>
      </Scene>
      <Scene kicker="4 de 4" title="Os dois no mesmo espaço">
        <div className="flex gap-2">
          <Card>
            <span className="flex size-9 items-center justify-center rounded-full bg-pine-soft text-pine-dark">
              <AppIcon name="tabler:user" className="size-4" />
            </span>
            <p className="mt-3 font-display text-xl">Você</p>
            <p className="text-sm text-ink/50">pagou hoje</p>
          </Card>
          <Card>
            <span className="flex size-9 items-center justify-center rounded-full bg-pine-soft text-pine-dark">
              <AppIcon name="tabler:user-heart" className="size-4" />
            </span>
            <p className="mt-3 font-display text-xl">Juntos</p>
            <p className="text-sm text-ink/50">vê na hora</p>
          </Card>
        </div>
      </Scene>
    </>
  );
}

function LoginScenes() {
  return (
    <>
      <Scene kicker="De volta" title="O que falta este mês">
        <Card>
          <p className="text-xs text-ink/45">Ainda aberto</p>
          <p className="mt-1 font-display text-4xl">R$ 480</p>
          <div className="mt-4 space-y-2">
            <MiniRow label="Cartão" value="R$ 220" fill="70%" />
            <MiniRow label="Faculdade" value="R$ 160" fill="45%" />
            <MiniRow label="Farmácia" value="R$ 100" fill="20%" />
          </div>
        </Card>
      </Scene>
      <Scene kicker="Foco" title="Qual pagar primeiro">
        <Card>
          <p className="flex items-center gap-2 text-sm text-pine">
            <AppIcon name="tabler:flag" className="size-4" />
            Bola de neve
          </p>
          <div className="mt-4 space-y-2">
            <PriorityRow rank="1" name="Farmácia" hint="menor saldo" />
            <PriorityRow rank="2" name="Cartão" hint="2 parcelas" />
            <PriorityRow rank="3" name="Curso" hint="sem atraso" />
          </div>
        </Card>
      </Scene>
      <Scene kicker="Leve" title="Sem planilha, sem briga">
        <div className="grid gap-2 sm:grid-cols-2">
          <Card>
            <AppIcon name="tabler:home-heart" className="size-6 text-pine" />
            <p className="mt-3 font-display text-2xl">Um espaço</p>
            <p className="mt-1 text-sm text-ink/55">Os dois vêem o mesmo combinado.</p>
          </Card>
          <Card>
            <AppIcon name="tabler:circle-check" className="size-6 text-pine" />
            <p className="mt-3 font-display text-2xl">Pronto</p>
            <p className="mt-1 text-sm text-ink/55">Entra e continua de onde parou.</p>
          </Card>
        </div>
      </Scene>
    </>
  );
}

function RecoverScenes() {
  return (
    <>
      <Scene kicker="Calma" title="Acontece de esquecer">
        <Card>
          <p className="flex items-center gap-2 text-sm">
            <AppIcon name="tabler:lock-open" className="size-5 text-pine" />
            A gente troca a chave
          </p>
          <div className="mt-4 h-2 overflow-hidden rounded-full bg-paper">
            <div className="h-full rounded-full bg-pine" data-fill="100%" />
          </div>
        </Card>
      </Scene>
      <Scene kicker="Simples" title="Um e-mail. Uma senha nova.">
        <Card>
          <p className="font-display text-2xl">Sem drama</p>
          <p className="mt-1 text-sm text-ink/55">Se a conta existir, o próximo passo sai.</p>
        </Card>
      </Scene>
    </>
  );
}

function Scene({
  kicker,
  title,
  children,
}: {
  kicker: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="absolute inset-x-0 top-0 pb-10" data-scene>
      <p className="text-xs uppercase tracking-[0.2em] text-white/50">{kicker}</p>
      <h2 className="mt-2 max-w-md font-display text-4xl leading-tight text-white sm:text-5xl">{title}</h2>
      <div className="mt-6" data-bit>
        {children}
      </div>
    </div>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-3xl bg-[#fffcf7] p-4 shadow-[0_24px_50px_-28px_rgba(0,0,0,0.55)] ring-1 ring-white/40">
      {children}
    </div>
  );
}

function MiniRow({ label, value, fill }: { label: string; value: string; fill: string }) {
  return (
    <div data-bit>
      <div className="flex items-center justify-between text-sm">
        <span className="text-ink/70">{label}</span>
        <span className="font-medium">{value}</span>
      </div>
      <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-paper">
        <div className="h-full rounded-full bg-pine" data-fill={fill} />
      </div>
    </div>
  );
}

function PriorityRow({ rank, name, hint }: { rank: string; name: string; hint: string }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl bg-paper px-3 py-2.5" data-bit>
      <span className="flex size-7 items-center justify-center rounded-full bg-pine text-xs font-semibold text-white">
        {rank}
      </span>
      <span className="min-w-0">
        <span className="block font-medium">{name}</span>
        <span className="block text-xs text-ink/45">{hint}</span>
      </span>
    </div>
  );
}
