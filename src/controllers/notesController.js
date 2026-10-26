import { Note } from '../models/note.js';
import createError from 'http-errors';

export const getAllNotes = async (req, res, next) => {
  try {
    const notes = await Note.find();
    res.status(200).json(notes);
  } catch (error) {
    next(error);
  }
};

export const getNoteById = async (req, res, next) => {
  const { id } = req.params;
  const note = await Note.findById(id);
  if (!note) {
    throw createError(404, 'Note not found');
  }

  res.status(200).json({
    status: 200,
    message: `Successfully found note with id ${id}!`,
    data: note,
  });
};

export const createNote = async (req, res, next) => {
  const newNote = await Note.create(req.body);

  res.status(201).json({
    status: 201,
    message: `Successfully created a note!`,
    data: newNote,
  });
};

export const deleteNote = async (req, res, next) => {
  try {
    const { noteId } = req.params;
    const deletedNote = await Note.findByIdAndDelete(noteId);

    if (!deletedNote) {
      throw createError(404, 'Note not found');
    }

    res.status(200).json(deletedNote);
  } catch (error) {
    next(error);
  }
};

export const updateNote = async (req, res, next) => {
  const { id } = req.params;
  const updatedNote = await Note.findByIdAndUpdate(id, req.body, {
    returnDocument: 'after',
    runValidators: true,
  });

  if (!updatedNote) {
    throw createError(404, 'Note not found');
  }

  res.status(200).json({
    status: 200,
    message: `Successfully patched a note!`,
    data: updatedNote,
  });
};
