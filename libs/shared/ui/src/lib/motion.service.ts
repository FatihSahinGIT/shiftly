import { isPlatformBrowser } from '@angular/common';
import { inject, Injectable, PLATFORM_ID } from '@angular/core';
import gsap from 'gsap';

@Injectable({ providedIn: 'root' })
export class MotionService {
  private readonly browser = isPlatformBrowser(inject(PLATFORM_ID));

  enter(element: Element | null | undefined): void {
    if (!element || this.reducedMotion()) return;
    gsap.fromTo(element, { autoAlpha: 0, y: 16 }, { autoAlpha: 1, y: 0, duration: 0.42, ease: 'power2.out' });
  }

  month(element: Element | null | undefined, direction: number): void {
    if (!element || this.reducedMotion()) return;
    gsap.fromTo(element, { autoAlpha: 0.55, x: direction * 18 }, { autoAlpha: 1, x: 0, duration: 0.24, ease: 'power1.out' });
  }

  drop(element: Element | null | undefined): void {
    if (!element || this.reducedMotion()) return;
    gsap.fromTo(element, { scale: 0.94 }, { scale: 1, duration: 0.3, ease: 'back.out(2)' });
  }

  exit(element: Element | null | undefined): Promise<void> {
    if (!element || this.reducedMotion()) return Promise.resolve();
    return new Promise((resolve) => {
      gsap.to(element, { autoAlpha: 0, y: -10, duration: 0.2, ease: 'power1.in', onComplete: resolve });
    });
  }

  private reducedMotion(): boolean {
    return this.browser && Boolean(globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches);
  }
}
