<template>
    <v-sheet>
        <v-container v-if="!isLoading">
            <h1 align="center">{{ workoutForm.name ? workoutForm.name : 'New Workout' }}</h1>
            <ExerciseSelector :createdExercises="userCreatedExercises" :followedExercises="userFollowedExercises"></ExerciseSelector>
        </v-container>
        <v-container v-else>
            <div align="center"><v-progress-circular indeterminate centered></v-progress-circular></div>
        </v-container>
    </v-sheet>
</template>

<script>
import { db } from '../../firebase'
import ExerciseSelector from '../../components/ExerciseSelector.vue'

export default {
    name: 'NewWorkout',
    components: { ExerciseSelector },
    data() {
        return {
            isLoading: true,
            errorMessage: '',
            userCreatedExercises: [],
            userFollowedExercises: [],
            workoutForm: {
                name: '',
                description: '',
                exercises: []
            }
        }
    },

    created: function() {
        // Download user exercises.
        db.collection("users").doc(this.$store.state.userProfile.data.uid).collection("exercises").orderBy("createdAt", "desc").get().then(exercisesSnapshot => {
            if (exercisesSnapshot.size > 0) {
                exercisesSnapshot.forEach(exercise => {
                    if (exercise.data().isFollow) {
                        this.userFollowedExercises.push(exercise.id);
                    } else {
                        this.userCreatedExercises.push(exercise.id);
                    }

                    console.log("Created", this.userCreatedExercises);
                    console.log("Followed", this.userFollowedExercises);
                    this.isLoading = false;
                })
            }
        }).catch(e => {
            this.isLoading = false;
            this.errorMessage = "Error downloading exercises " + e;
            console.log(this.errorMessage);
        })
    }
}
</script>