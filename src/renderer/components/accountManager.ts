import { DEFAULT_ACCOUNTS } from '../../shared/constants.js';
import type { LayoutMode } from '../../shared/types.js';
import { AccountCardComponent } from './accountCard.js';
import { LayoutSplitterComponent } from './splitter.js';

export class AccountManager {
  private cards: AccountCardComponent[] = [];
  private splitter!: LayoutSplitterComponent;
  private currentLayout: LayoutMode = 'grid-2x2';
  private previousLayout: LayoutMode = 'grid-2x2';
  private featuredCardIndex = 0;

  constructor(
    private readonly container: HTMLElement,
    private readonly onLayoutChanged?: (mode: LayoutMode) => void,
  ) {
    this.initAccounts();
  }

  private initAccounts(): void {
    this.container.innerHTML = '';
    this.cards = DEFAULT_ACCOUNTS.map((cfg, index) => {
      const card = new AccountCardComponent(
        cfg,
        // Ao clicar no card para foco (Modo 1x3)
        (clickedCard) => {
          if (this.currentLayout === 'layout-1x3') {
            this.setFeaturedCard(clickedCard);
          }
        },
        // Ao alternar maximização do card
        (cardComponent, isMaximized) => {
          this.handleCardMaximize(cardComponent, isMaximized);
        },
      );
      this.container.appendChild(card.element);
      return card;
    });

    // Instancia o divisor arrastável da barra lateral
    this.splitter = new LayoutSplitterComponent(this.container);
    this.container.appendChild(this.splitter.element);

    this.setLayout('grid-2x2');
  }

  public setLayout(mode: LayoutMode): void {
    if (this.currentLayout !== 'maximized') {
      this.previousLayout = this.currentLayout;
    }
    this.currentLayout = mode;
    this.container.setAttribute('data-layout', mode);

    if (mode === 'layout-1x3') {
      this.applyFeaturedCard();
    } else if (mode === 'grid-2x2') {
      // Remove a classe featured de todos no modo 2x2
      this.cards.forEach((c) => c.element.classList.remove('is-featured'));
    }

    this.onLayoutChanged?.(mode);
  }

  public getLayout(): LayoutMode {
    return this.currentLayout;
  }

  public setFeaturedCard(targetCard: AccountCardComponent): void {
    const index = this.cards.indexOf(targetCard);
    if (index === -1) return;

    this.featuredCardIndex = index;
    this.applyFeaturedCard();
  }

  private applyFeaturedCard(): void {
    this.cards.forEach((card, i) => {
      if (i === this.featuredCardIndex) {
        card.element.classList.add('is-featured');
      } else {
        card.element.classList.remove('is-featured');
      }
    });
  }

  private handleCardMaximize(targetCard: AccountCardComponent, isMaximized: boolean): void {
    if (isMaximized) {
      // Desmaximiza outros cards se houver
      this.cards.forEach((card) => {
        if (card !== targetCard) {
          card.setMaximized(false);
        }
      });
      this.setLayout('maximized');
    } else {
      // Restaura o layout anterior (grid-2x2 ou layout-1x3)
      this.setLayout(this.previousLayout);
    }
  }

  public emergencyStopAll(): number {
    let stoppedCount = 0;
    for (const card of this.cards) {
      if (card.isAutoClickActive()) {
        card.stopAutoClick();
        stoppedCount++;
      }
    }
    return stoppedCount;
  }

  public setAllIntervals(intervalMs: number): void {
    for (const card of this.cards) {
      card.setAutoClickInterval(intervalMs);
    }
  }

  public getCards(): readonly AccountCardComponent[] {
    return this.cards;
  }
}
