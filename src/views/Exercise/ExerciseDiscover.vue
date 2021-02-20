<template>
    <v-sheet rounded="lg" min-height="70vh">
        <v-container>
            <h1 align="center">Discover Exercises</h1>
            <ExerciseFeed :exercises="exercises" />
        </v-container>
    </v-sheet>
</template>

<script>
import { db } from '@/firebase'
import ExerciseFeed from '@/components/Exercise/ExerciseFeed'

export default {
    name: 'ExerciseDiscover',
    components: { ExerciseFeed },
    data() {
        return {
            isLoading: true,
            exercises: [], // Exercises from user doc.
        }
    },

    created: function() {
        // Download relevant exercises.
        db.collection("exercises").get().then(exercisesSnapshot => {
            exercisesSnapshot.forEach(exercise => {
                let data = { createdAt: exercise.data().createdAt, createdBy: exercise.data().createdBy, id: exercise.id }
                this.exercises.push(data);
            })
        })
    }
}
</script>