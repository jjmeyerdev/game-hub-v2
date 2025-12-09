// Simple event emitter for library updates
// This allows settings pages to notify the library when data changes

type LibraryEventCallback = () => void;

class LibraryEventEmitter {
  private listeners: Set<LibraryEventCallback> = new Set();

  subscribe(callback: LibraryEventCallback): () => void {
    this.listeners.add(callback);
    return () => {
      this.listeners.delete(callback);
    };
  }

  emit(): void {
    this.listeners.forEach((callback) => {
      try {
        callback();
      } catch (error) {
        console.error('Error in library event listener:', error);
      }
    });
  }
}

// Singleton instance
export const libraryEvents = new LibraryEventEmitter();

// Helper function to trigger a library refresh
export function triggerLibraryRefresh(): void {
  libraryEvents.emit();
}
