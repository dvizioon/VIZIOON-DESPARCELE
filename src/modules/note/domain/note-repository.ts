import type { DebtNote, NoteAttachment } from "./note";

export interface CreateNoteInput {
  debtId: string;
  authorId: string;
  content: string;
  attachments: Array<Omit<NoteAttachment, "id">>;
}

export interface NoteRepository {
  create(input: CreateNoteInput): Promise<DebtNote>;
  listByDebt(debtId: string): Promise<DebtNote[]>;
  findById(id: string): Promise<DebtNote | null>;
  deleteById(id: string): Promise<void>;
}
