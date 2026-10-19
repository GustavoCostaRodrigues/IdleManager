export class LayoutSplitterComponent {
  public readonly element: HTMLElement;
  private isDragging = false;
  private currentWidth = 360;

  // Cache de dimensões para evitar Layout Thrashing
  private cachedRight = 0;
  private cachedMaxSidebarWidth = 360;
  private rafId: number | null = null;
  private pendingWidth: number | null = null;

  // Listeners vinculados para adicionar/remover sob demanda
  private readonly boundMouseMove = (e: MouseEvent) => this.handleMouseMove(e);
  private readonly boundMouseUp = () => this.handleMouseUp();

  private static readonly STORAGE_KEY = 'poke_idle_sidebar_width';
  private static readonly DEFAULT_WIDTH = 360;
  private static readonly MIN_WIDTH = 160;

  constructor(
    private readonly container: HTMLElement,
    private readonly onResize?: (newWidth: number) => void,
  ) {
    this.element = document.createElement('div');
    this.element.className = 'layout-splitter';
    this.element.id = 'layout-splitter';
    this.element.setAttribute('role', 'separator');
    this.element.setAttribute('aria-orientation', 'vertical');
    this.element.title = 'Arraste para ajustar a largura da lista lateral (Duplo clique para redefinir)';

    this.element.innerHTML = `
      <div class="splitter-handle">
        <div class="splitter-grip"></div>
      </div>
    `;

    this.loadInitialWidth();
    this.initEvents();
  }

  private loadInitialWidth(): void {
    const saved = localStorage.getItem(LayoutSplitterComponent.STORAGE_KEY);
    if (saved) {
      const parsed = parseInt(saved, 10);
      if (!isNaN(parsed) && parsed >= LayoutSplitterComponent.MIN_WIDTH) {
        this.currentWidth = parsed;
      }
    }
    this.applyWidth(this.currentWidth, false);
  }

  private applyWidth(width: number, save = false): void {
    this.currentWidth = width;
    this.container.style.setProperty('--sidebar-width', `${width}px`);
    if (save) {
      localStorage.setItem(LayoutSplitterComponent.STORAGE_KEY, String(width));
    }
    this.onResize?.(width);
  }

  public getWidth(): number {
    return this.currentWidth;
  }

  private initEvents(): void {
    this.element.addEventListener('mousedown', (e) => this.handleMouseDown(e));

    // Reset com duplo clique para a largura padrão
    this.element.addEventListener('dblclick', () => {
      this.applyWidth(LayoutSplitterComponent.DEFAULT_WIDTH, true);
    });
  }

  private handleMouseDown(e: MouseEvent): void {
    if (e.button !== 0) return; // apenas botão esquerdo
    e.preventDefault();
    e.stopPropagation();

    this.isDragging = true;

    // Cacheia as coordenadas da janela UMA ÚNICA VEZ para eliminar reflow durante o arraste
    const containerRect = this.container.getBoundingClientRect();
    this.cachedRight = containerRect.right;
    this.cachedMaxSidebarWidth = Math.max(
      LayoutSplitterComponent.MIN_WIDTH,
      Math.floor(containerRect.width - 320),
    );

    document.body.classList.add('is-resizing');

    // Registra listeners no window APENAS durante o arraste ativo
    window.addEventListener('mousemove', this.boundMouseMove, { passive: true });
    window.addEventListener('mouseup', this.boundMouseUp);
  }

  private handleMouseMove(e: MouseEvent): void {
    if (!this.isDragging) return;

    // Cálculo puro sem ler o DOM
    const rawWidth = Math.round(this.cachedRight - e.clientX);
    const clampedWidth = Math.max(
      LayoutSplitterComponent.MIN_WIDTH,
      Math.min(this.cachedMaxSidebarWidth, rawWidth),
    );

    this.pendingWidth = clampedWidth;

    // Sincroniza a escrita no DOM exclusivamente com o VSync da GPU via requestAnimationFrame
    if (this.rafId === null) {
      this.rafId = requestAnimationFrame(() => {
        if (this.pendingWidth !== null) {
          this.applyWidth(this.pendingWidth, false);
          this.pendingWidth = null;
        }
        this.rafId = null;
      });
    }
  }

  private handleMouseUp(): void {
    if (!this.isDragging) return;

    this.isDragging = false;

    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }

    if (this.pendingWidth !== null) {
      this.applyWidth(this.pendingWidth, false);
      this.pendingWidth = null;
    }

    // Remove imediatamente os listeners globais para liberar a main thread
    window.removeEventListener('mousemove', this.boundMouseMove);
    window.removeEventListener('mouseup', this.boundMouseUp);

    document.body.classList.remove('is-resizing');

    // Persiste no localStorage apenas no fim da interação
    localStorage.setItem(LayoutSplitterComponent.STORAGE_KEY, String(this.currentWidth));
  }
}
