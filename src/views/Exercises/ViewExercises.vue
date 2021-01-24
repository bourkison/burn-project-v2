<template>
    <v-sheet rounded="lg" min-height="70vh">
        <v-container>
            <h1 align="center">Exercises</h1>
            <v-container>
                <ViewExerciseMin v-for="exercise in exercises" :userExerciseData="exercise" :key="exercise.id"></ViewExerciseMin>
            </v-container>
        </v-container>
    </v-sheet>
</template>

<script>
import { db } from '../../firebase'
import ViewExerciseMin from './ViewExerciseMin'

export default {
    name: 'ViewExercises',
    components: { ViewExerciseMin },
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
        db.collection("users").doc(this.$store.state.userProfile.data.uid).collection("exercises").get().then(exercisesSnapshot => {
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