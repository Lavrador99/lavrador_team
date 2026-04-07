import { ExerciseDto } from "@libs/types";
import { useEffect, useState } from "react";
import { ExerciseFilters, exercisesApi } from "../utils/api/exercises.api";

export const useExercises = (filters: ExerciseFilters = {}) => {
  const [exercises, setExercises] = useState<ExerciseDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Serializar os filtros para usar como dep do useEffect de forma estável
  const filtersKey = JSON.stringify(filters);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    exercisesApi
      .getAll(filters)
      .then((data) => {
        if (!cancelled) setExercises(data);
      })
      .catch(() => {
        if (!cancelled) setError("Erro ao carregar exercícios");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtersKey]);

  return { exercises, loading, error };
};
