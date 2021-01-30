<template>
    <v-sheet rounded="lg" min-height="70vh">
        <v-container>
            <h1 align="center">Exercises</h1>
            <v-container v-if="exercises.length > 0 && !isLoading">
                <ViewExerciseMin v-for="exercise in exercises" :userExerciseData="exercise" :key="exercise.id"></ViewExerciseMin>
            </v-container>
            <v-container v-else-if="isLoading">
                <div align="center"><v-progress-circular indeterminate centered></v-progress-circular></div>
            </v-container>
            <v-container v-else>
                <p align="center"><em>Looks like you haven't followed or created any exercises.</em></p>
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
            errorMessage: ''
        }
    },

    created: function() {
        // Download relevant exercises.
        db.collection("users").doc(this.$store.state.userProfile.data.uid).collection("exercises").orderBy("createdAt", "desc").get().then(exercisesSnapshot => {
            if (exercisesSnapshot.size > 0) {
                exercisesSnapshot.forEach(exercise => {
                    let data = { createdAt: exercise.data().createdAt, createdBy: exercise.data().createdBy, id: exercise.id }
                    this.exercises.push(data);
                })
            }
            this.isLoading = false;
        }).catch(e => {
            this.isLoading = false;
            this.errorMessage = "Error downloading exercises" + e;
            console.log(this.errorMessage);
        })
    }
}
</script>