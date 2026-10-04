export interface NoteAttachment {
  id: string;
  url: string;
  filename: string;
  mimeType: string;
}

export interface DebtNote {
  id: string;
  debtId: string;
  authorId: string;
  authorName: string;
  content: string;
  createdAt: Date;
  attachments: NoteAttachment[];
}
