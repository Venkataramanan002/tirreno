export interface BehaviorEvent {
  type: 'mouse' | 'keyboard' | 'scroll' | 'session';
  data: any;
  timestamp: number;
  sessionId: string;
}

export interface MouseEvent {
  x: number;
  y: number;
  movementX: number;
  movementY: number;
  button?: number;
  type: 'mousemove' | 'mousedown' | 'mouseup' | 'click';
}

export interface KeyboardEvent {
  key: string;
  code: string;
  type: 'keydown' | 'keyup';
  inputValue?: string;
  inputLength?: number;
}

export interface ScrollEvent {
  scrollX: number;
  scrollY: number;
  deltaX: number;
  deltaY: number;
  direction: 'up' | 'down' | 'left' | 'right';
}

export interface SessionData {
  startTime: number;
  endTime?: number;
  duration: number;
  pageViews: number;
  actions: number;
  deviceInfo: {
    userAgent: string;
    platform: string;
    language: string;
    screenWidth: number;
    screenHeight: number;
    colorDepth: number;
    timezone: string;
  };
}

class BehaviorTrackingService {
  private static instance: BehaviorTrackingService;
  private sessionId: string;
  private sessionData: SessionData;
  private eventQueue: BehaviorEvent[] = [];
  private isTracking = false;
  private batchSize = 50;
  private batchTimeout = 5000; // 5 seconds
  private batchTimer?: NodeJS.Timeout;

  private constructor() {
    this.sessionId = this.generateSessionId();
    this.sessionData = this.initializeSessionData();
  }

  static getInstance(): BehaviorTrackingService {
    if (!BehaviorTrackingService.instance) {
      BehaviorTrackingService.instance = new BehaviorTrackingService();
    }
    return BehaviorTrackingService.instance;
  }

  startTracking(): void {
    if (this.isTracking) return;

    this.isTracking = true;
    this.setupEventListeners();
    this.startBatchTimer();
    
    console.log('🔍 Behavior tracking started for session:', this.sessionId);
  }

  stopTracking(): void {
    if (!this.isTracking) return;

    this.isTracking = false;
    this.removeEventListeners();
    this.stopBatchTimer();
    this.flushEvents();
    
    this.sessionData.endTime = Date.now();
    this.sessionData.duration = this.sessionData.endTime - this.sessionData.startTime;
    
    console.log('🛑 Behavior tracking stopped. Session duration:', this.sessionData.duration);
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substring(7)}`;
  }

  private initializeSessionData(): SessionData {
    return {
      startTime: Date.now(),
      duration: 0,
      pageViews: 1,
      actions: 0,
      deviceInfo: {
        userAgent: navigator.userAgent,
        platform: navigator.platform,
        language: navigator.language,
        screenWidth: screen.width,
        screenHeight: screen.height,
        colorDepth: screen.colorDepth,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
      }
    };
  }

  private setupEventListeners(): void {
    // Mouse events
    document.addEventListener('mousemove', this.handleMouseMove.bind(this), { passive: true });
    document.addEventListener('mousedown', this.handleMouseDown.bind(this), { passive: true });
    document.addEventListener('mouseup', this.handleMouseUp.bind(this), { passive: true });
    document.addEventListener('click', this.handleClick.bind(this), { passive: true });

    // Keyboard events (only on input elements)
    document.addEventListener('keydown', this.handleKeyDown.bind(this), { passive: true });
    document.addEventListener('keyup', this.handleKeyUp.bind(this), { passive: true });

    // Scroll events
    window.addEventListener('scroll', this.handleScroll.bind(this), { passive: true });

    // Page visibility changes
    document.addEventListener('visibilitychange', this.handleVisibilityChange.bind(this));
  }

  private removeEventListeners(): void {
    document.removeEventListener('mousemove', this.handleMouseMove.bind(this));
    document.removeEventListener('mousedown', this.handleMouseDown.bind(this));
    document.removeEventListener('mouseup', this.handleMouseUp.bind(this));
    document.removeEventListener('click', this.handleClick.bind(this));
    document.removeEventListener('keydown', this.handleKeyDown.bind(this));
    document.removeEventListener('keyup', this.handleKeyUp.bind(this));
    window.removeEventListener('scroll', this.handleScroll.bind(this));
    document.removeEventListener('visibilitychange', this.handleVisibilityChange.bind(this));
  }

  private handleMouseMove(event: MouseEvent): void {
    this.addEvent({
      type: 'mouse',
      data: {
        x: event.clientX,
        y: event.clientY,
        movementX: event.movementX,
        movementY: event.movementY,
        type: 'mousemove'
      } as MouseEvent,
      timestamp: Date.now(),
      sessionId: this.sessionId
    });
  }

  private handleMouseDown(event: MouseEvent): void {
    this.addEvent({
      type: 'mouse',
      data: {
        x: event.clientX,
        y: event.clientY,
        button: event.button,
        type: 'mousedown'
      } as MouseEvent,
      timestamp: Date.now(),
      sessionId: this.sessionId
    });
  }

  private handleMouseUp(event: MouseEvent): void {
    this.addEvent({
      type: 'mouse',
      data: {
        x: event.clientX,
        y: event.clientY,
        button: event.button,
        type: 'mouseup'
      } as MouseEvent,
      timestamp: Date.now(),
      sessionId: this.sessionId
    });
  }

  private handleClick(event: MouseEvent): void {
    this.addEvent({
      type: 'mouse',
      data: {
        x: event.clientX,
        y: event.clientY,
        button: event.button,
        type: 'click'
      } as MouseEvent,
      timestamp: Date.now(),
      sessionId: this.sessionId
    });
  }

  private handleKeyDown(event: KeyboardEvent): void {
    const target = event.target as HTMLElement;
    if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.contentEditable === 'true')) {
      this.addEvent({
        type: 'keyboard',
        data: {
          key: event.key,
          code: event.code,
          type: 'keydown',
          inputValue: (target as HTMLInputElement).value?.substring(0, 100), // Limit length
          inputLength: (target as HTMLInputElement).value?.length || 0
        } as KeyboardEvent,
        timestamp: Date.now(),
        sessionId: this.sessionId
      });
    }
  }

  private handleKeyUp(event: KeyboardEvent): void {
    const target = event.target as HTMLElement;
    if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.contentEditable === 'true')) {
      this.addEvent({
        type: 'keyboard',
        data: {
          key: event.key,
          code: event.code,
          type: 'keyup',
          inputValue: (target as HTMLInputElement).value?.substring(0, 100),
          inputLength: (target as HTMLInputElement).value?.length || 0
        } as KeyboardEvent,
        timestamp: Date.now(),
        sessionId: this.sessionId
      });
    }
  }

  private lastScrollX = 0;
  private lastScrollY = 0;

  private handleScroll(event: Event): void {
    const scrollX = window.scrollX;
    const scrollY = window.scrollY;
    const deltaX = scrollX - this.lastScrollX;
    const deltaY = scrollY - this.lastScrollY;

    this.addEvent({
      type: 'scroll',
      data: {
        scrollX,
        scrollY,
        deltaX,
        deltaY,
        direction: this.getScrollDirection(deltaX, deltaY)
      } as ScrollEvent,
      timestamp: Date.now(),
      sessionId: this.sessionId
    });

    this.lastScrollX = scrollX;
    this.lastScrollY = scrollY;
  }

  private getScrollDirection(deltaX: number, deltaY: number): 'up' | 'down' | 'left' | 'right' {
    if (Math.abs(deltaY) > Math.abs(deltaX)) {
      return deltaY > 0 ? 'down' : 'up';
    } else {
      return deltaX > 0 ? 'right' : 'left';
    }
  }

  private handleVisibilityChange(): void {
    if (document.hidden) {
      this.sessionData.endTime = Date.now();
    } else {
      this.sessionData.startTime = Date.now();
      this.sessionData.pageViews++;
    }
  }

  private addEvent(event: BehaviorEvent): void {
    this.eventQueue.push(event);
    this.sessionData.actions++;

    if (this.eventQueue.length >= this.batchSize) {
      this.flushEvents();
    }
  }

  private startBatchTimer(): void {
    this.batchTimer = setInterval(() => {
      if (this.eventQueue.length > 0) {
        this.flushEvents();
      }
    }, this.batchTimeout);
  }

  private stopBatchTimer(): void {
    if (this.batchTimer) {
      clearInterval(this.batchTimer);
      this.batchTimer = undefined;
    }
  }

  private flushEvents(): void {
    if (this.eventQueue.length === 0) return;

    const events = [...this.eventQueue];
    this.eventQueue = [];

    // Send to backend (implement actual API call)
    this.sendEventsToBackend(events);
  }

  private async sendEventsToBackend(events: BehaviorEvent[]): Promise<void> {
    try {
      // Compress events for efficient transmission
      const compressedEvents = this.compressEvents(events);
      
      // Send to Supabase or your backend
      console.log('📤 Sending behavior events to backend:', compressedEvents.length, 'events');
      
      // TODO: Implement actual backend storage
      // await supabase.from('behavior_events').insert(compressedEvents);
      
    } catch (error) {
      console.error('❌ Failed to send behavior events:', error);
    }
  }

  private compressEvents(events: BehaviorEvent[]): any[] {
    // Group events by type and compress similar events
    const compressed: any[] = [];
    const groups: { [key: string]: BehaviorEvent[] } = {};

    events.forEach(event => {
      const key = `${event.type}_${event.data.type || 'default'}`;
      if (!groups[key]) groups[key] = [];
      groups[key].push(event);
    });

    Object.entries(groups).forEach(([key, groupEvents]) => {
      if (groupEvents.length === 1) {
        compressed.push(groupEvents[0]);
      } else {
        // Compress multiple similar events
        compressed.push({
          type: groupEvents[0].type,
          data: {
            type: groupEvents[0].data.type,
            count: groupEvents.length,
            samples: groupEvents.slice(0, 3).map(e => e.data), // Keep first 3 as samples
            timeRange: {
              start: groupEvents[0].timestamp,
              end: groupEvents[groupEvents.length - 1].timestamp
            }
          },
          timestamp: groupEvents[0].timestamp,
          sessionId: this.sessionId
        });
      }
    });

    return compressed;
  }

  getSessionData(): SessionData {
    return { ...this.sessionData };
  }

  getSessionId(): string {
    return this.sessionId;
  }

  // Public method to manually track specific events
  trackCustomEvent(type: string, data: any): void {
    this.addEvent({
      type: 'session',
      data: { customType: type, ...data },
      timestamp: Date.now(),
      sessionId: this.sessionId
    });
  }
}

export const behaviorTrackingService = BehaviorTrackingService.getInstance();
