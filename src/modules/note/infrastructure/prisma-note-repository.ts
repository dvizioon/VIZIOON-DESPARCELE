import { prisma } from "@/shared/infrastructure/prisma";
import type { CreateNoteInput, NoteRepository } from "../domain/note-repository";
import type { DebtNote } from "../domain/note";

export class PrismaNoteRepository implements NoteRepository {
  async create(input: CreateNoteInput): Promise<DebtNote> {
    const row = await prisma.debtNote.create({
      data: {
        debtId: input.debtId,
        authorId: input.authorId,
        content: input.content,
        attachments: {
          create: input.attachments.map((file) => ({
            url: file.url,
            filename: file.filename,
            mimeType: file.mimeType,
          })),
        },
      },
      include: noteInclude,
    });

    return mapNote(row);
  }

  async listByDebt(debtId: string): Promise<DebtNote[]> {
    const rows = await prisma.debtNote.findMany({
      where: { debtId },
      include: noteInclude,
      orderBy: { createdAt: "desc" },
    });

    return rows.map(mapNote);
  }

  async findById(id: string): Promise<DebtNote | null> {
    const row = await prisma.debtNote.findUnique({
      where: { id },
      include: noteInclude,
    });

    return row ? mapNote(row) : null;
  }

  async deleteById(id: string): Promise<void> {
    await prisma.debtNote.delete({ where: { id } });
  }
}

const noteInclude = {
  author: true,
  attachments: true,
};

function mapNote(row: {
  id: string;
  debtId: string;
  authorId: string;
  content: string;
  createdAt: Date;
  author: { name: string };
  attachments: Array<{ id: string; url: string; filename: string; mimeType: string }>;
}): DebtNote {
  return {
    id: row.id,
    debtId: row.debtId,
    authorId: row.authorId,
    authorName: row.author.name,
    content: row.content,
    createdAt: row.createdAt,
    attachments: row.attachments,
  };
}
