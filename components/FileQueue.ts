interface QueueItem {
  file: File;
  documentType: string;
  metadata: Record<string, any>;
  mimeType: string;
  documentName: string;
  fileData?: string;
}

export class FileQueue {
  addItem(arg0: {
    file: File;
    documentType: string;
    documentName: string;
    metadata: Record<string, any>;
  }) {
    throw new Error("Method not implemented.");
  }
  private items: QueueItem[];

  constructor(initialItems: QueueItem[] = []) {
    this.items = [...initialItems];
  }

  enqueue(item: QueueItem) {
    const fileData = {
      documentType: item.documentType,
      documentName: item.documentName || item.file.name,
      mimeType: item.mimeType || item.file.type || "application/pdf",
      metadata: item.metadata || {},
    };
    this.items.push({
      ...item,
      fileData: JSON.stringify(fileData),
    });
  }

  dequeue(): QueueItem | undefined {
    return this.items.shift();
  }

  peek(): QueueItem | undefined {
    return this.items[0];
  }

  isEmpty(): boolean {
    return this.items.length === 0;
  }

  getItems(): QueueItem[] {
    return [...this.items];
  }

  removeAt(index: number) {
    if (index >= 0 && index < this.items.length) {
      this.items.splice(index, 1);
    }
  }

  clear() {
    this.items = [];
  }
}
