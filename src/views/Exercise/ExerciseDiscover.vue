<template>
    <v-sheet rounded="lg" min-height="70vh">
        <v-container>
            <h1 align="center">Top Exercises</h1>
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
            
            // Firebase:
            loadedImages: 0
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
    },

    watch: {
        loadedExercises: function() {
            if (this.loadedExercises >= this.userExercises.length) {
                console.log("Exercises loaded!", this.exercises);
            }
        }
    }
}
</script>