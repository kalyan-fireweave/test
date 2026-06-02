import { Pool } from 'pg';
import { v4 as uuidv4 } from 'uuid';
import { Note, CreateNoteInput, UpdateNoteInput } from '../../domain/entities/Note';
import { INoteRepository } from '../../domain/repositories/INoteRepository';

function rowToNote(row: Record<string, unknown>): Note {
  return {
    id: row.id as string,
    title: row.title as string,
    content: row.content as string,
    createdAt: row.created_at as Date,
    updatedAt: row.updated_at as Date,
  };
}

export class PostgresNoteRepository implements INoteRepository {
  constructor(private readonly pool: Pool) {}

  async findAll(): Promise<Note[]> {
    const { rows } = await this.pool.query(
      'SELECT * FROM notes ORDER BY created_at DESC'
    );
    return rows.map(rowToNote);
  }

  async findById(id: string): Promise<Note | null> {
    const { rows } = await this.pool.query(
      'SELECT * FROM notes WHERE id = $1',
      [id]
    );
    return rows.length > 0 ? rowToNote(rows[0]) : null;
  }

  async create(input: CreateNoteInput): Promise<Note> {
    const id = uuidv4();
    const { rows } = await this.pool.query(
      `INSERT INTO notes (id, title, content)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [id, input.title, input.content]
    );
    return rowToNote(rows[0]);
  }

  async update(id: string, input: UpdateNoteInput): Promise<Note | null> {
    const fields: string[] = [];
    const values: unknown[] = [];
    let paramIdx = 1;

    if (input.title !== undefined) {
      fields.push(`title = $${paramIdx++}`);
      values.push(input.title);
    }
    if (input.content !== undefined) {
      fields.push(`content = $${paramIdx++}`);
      values.push(input.content);
    }

    if (fields.length === 0) return this.findById(id);

    fields.push(`updated_at = NOW()`);
    values.push(id);

    const { rows } = await this.pool.query(
      `UPDATE notes SET ${fields.join(', ')} WHERE id = $${paramIdx} RETURNING *`,
      values
    );
    return rows.length > 0 ? rowToNote(rows[0]) : null;
  }

  async delete(id: string): Promise<boolean> {
    const { rowCount } = await this.pool.query(
      'DELETE FROM notes WHERE id = $1',
      [id]
    );
    return (rowCount ?? 0) > 0;
  }
}
