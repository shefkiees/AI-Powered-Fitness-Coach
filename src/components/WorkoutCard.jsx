"use client";

import { useState } from "react";
import { CheckCircle2, Clock, Plus, Trash2 } from "lucide-react";
import ExerciseItem from "@/src/components/ExerciseItem";

const emptyExercise = {
  name: "",
  sets: "3",
  reps: "10",
  weight_kg: "",
  rest_seconds: "60",
  notes: "",
  order_index: "",
};

export default function WorkoutCard({
  workout,
  busy,
  onAddExercise,
  onCompleteWorkout,
  onDeleteExercise,
  onDeleteWorkout,
}) {
  const [exerciseForm, setExerciseForm] = useState(emptyExercise);
  const exercises = [...(workout.exercises || [])].sort(
    (a, b) => (a.order_index || 0) - (b.order_index || 0),
  );

  const setValue = (key, value) => {
    setExerciseForm((current) => ({ ...current, [key]: value }));
  };

  const submitExercise = async (event) => {
    event.preventDefault();
    if (exerciseForm.name.trim().length < 2) return;
    await onAddExercise(workout, exerciseForm);
    setExerciseForm(emptyExercise);
  };

  return (
    <article className="pulse-card rounded-[1.5rem] p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-[var(--fc-muted)]">
            <span className="rounded-full bg-[var(--fc-accent)]/12 px-3 py-1 text-[var(--fc-accent)]">
              {workout.day_of_week || "Training day"}
            </span>
            <span>{workout.difficulty || "Balanced"}</span>
            <span className="inline-flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              {workout.duration_minutes || 40} min
            </span>
          </div>
          <h3 className="mt-3 text-xl font-black text-white">{workout.title}</h3>
          {workout.description ? (
            <p className="mt-2 max-w-3xl text-sm leading-7 text-[var(--fc-muted)]">
              {workout.description}
            </p>
          ) : null}
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            disabled={busy}
            onClick={() => onCompleteWorkout(workout)}
            className="inline-flex items-center justify-center gap-2 rounded-full bg-[var(--fc-accent)] px-4 py-2.5 text-sm font-black text-[var(--fc-accent-ink)] transition hover:bg-[var(--fc-accent-strong)] disabled:opacity-60"
          >
            <CheckCircle2 className="h-4 w-4" />
            Complete
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => onDeleteWorkout(workout.id)}
            className="inline-flex items-center justify-center gap-2 rounded-full border border-red-400/20 bg-red-400/10 px-4 py-2.5 text-sm font-bold text-red-100 transition hover:bg-red-400/16 disabled:opacity-60"
          >
            <Trash2 className="h-4 w-4" />
            Delete
          </button>
        </div>
      </div>

      <ol className="mt-5 grid gap-3">
        {exercises.map((exercise) => (
          <li key={exercise.id} className="grid gap-2 sm:grid-cols-[1fr_auto] sm:items-center">
            <ExerciseItem exercise={exercise} />
            <button
              type="button"
              disabled={busy}
              onClick={() => onDeleteExercise(exercise.id)}
              className="inline-flex items-center justify-center rounded-xl border border-[var(--fc-border)] bg-white/[0.04] p-2 text-[var(--fc-muted)] transition hover:bg-white/[0.08] hover:text-white disabled:opacity-60"
              aria-label="Delete exercise"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </li>
        ))}
      </ol>

      <form onSubmit={submitExercise} className="mt-5 rounded-[1.35rem] border border-[var(--fc-border)] bg-black/20 p-4">
        <p className="text-sm font-black text-white">Add exercise</p>
        <div className="mt-3 grid gap-3 md:grid-cols-[1.2fr_0.6fr_0.7fr_0.7fr_auto]">
          <input
            value={exerciseForm.name}
            onChange={(event) => setValue("name", event.target.value)}
            className="pulse-input px-4 py-3"
            placeholder="Exercise name"
          />
          <input
            value={exerciseForm.sets}
            onChange={(event) => setValue("sets", event.target.value)}
            className="pulse-input px-4 py-3"
            type="number"
            min="1"
            placeholder="Sets"
          />
          <input
            value={exerciseForm.reps}
            onChange={(event) => setValue("reps", event.target.value)}
            className="pulse-input px-4 py-3"
            placeholder="Reps"
          />
          <input
            value={exerciseForm.weight_kg}
            onChange={(event) => setValue("weight_kg", event.target.value)}
            className="pulse-input px-4 py-3"
            type="number"
            min="0"
            step="0.5"
            placeholder="Kg"
          />
          <button
            type="submit"
            disabled={busy || exerciseForm.name.trim().length < 2}
            className="inline-flex items-center justify-center gap-2 rounded-full bg-[var(--fc-accent)] px-4 py-3 text-sm font-black text-[var(--fc-accent-ink)] transition hover:bg-[var(--fc-accent-strong)] disabled:opacity-60"
          >
            <Plus className="h-4 w-4" />
            Add
          </button>
        </div>
      </form>
    </article>
  );
}
