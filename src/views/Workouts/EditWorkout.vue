<template>
    <v-sheet>
        <v-container v-if="!isLoading">
            <v-form @submit.prevent="updateWorkout">
                <h1>{{ newWorkoutData.name }}</h1>
                <v-text-field v-model="newWorkoutData.name" :rules=[rules.required] label="Workout Name"></v-text-field>
                <MarkdownInput :starting-text="oldWorkoutData.description" @update-text="updateDescription"></MarkdownInput>
                <ExerciseSelector :initExercises="oldWorkoutData.exercises" :createdExercises="userCreatedExercises" :followedExercises="userFollowedExercises" @selectedExercisesChange="updateSelectedExercises"></ExerciseSelector>
            </v-form>
        </v-container>
    </v-sheet>
</template>

<script>
import { db } from '../../firebase'
import MarkdownInput from '../../components/MarkdownInput.vue'
import ExerciseSelector from '../../components/Exercise/ExerciseSelector.vue'

export default {
    name: 'EditWorkout',
    components: { MarkdownInput, ExerciseSelector },
    data() {
        return {
            isLoading: true,
            isUpdating: false,
            oldWorkoutData: {},
            newWorkoutData: {},
            userCreatedExercises: [],
            userFollowedExercises: [],

            // Vuetify:
            rules: {
                required: value => !!value || 'Required.'
            }
        }
    },

    created: function() {
        this.downloadWorkout();
    },
    beforeRouteUpdate: function() {
        this.downloadWorkout();
    },

    methods: {
        downloadWorkout: function() {
            // First download this workout information.
            db.collection("workouts").doc(this.$route.params.workoutid).get().then(workoutDoc => {
                if (workoutDoc.exists) {
                    this.oldWorkoutData = workoutDoc.data();
                    this.newWorkoutData = workoutDoc.data();

                    // Then download user exercises for ExerciseSelector.
                    db.collection("users").doc(this.$store.state.userProfile.data.uid).collection("exercises").orderBy("createdAt", "desc").get().then(exercisesSnapshot => {
                        if (exercisesSnapshot.size > 0) {
                            exercisesSnapshot.forEach(exercise => {
                                if (exercise.data().isFollow) {
                                    this.userFollowedExercises.push(exercise.id);
                                } else {
                                    this.userCreatedExercises.push(exercise.id);
                                }

                                this.isLoading = false;
                            })
                        }
                    }).catch(e => {
                        this.isLoading = false;
                        this.errorMessage = "Error downloading exercises " + e;
                        console.log(this.errorMessage);
                    })
                } else {
                    console.log("This workout does not exist.");
                    this.isLoading = false;
                }
            }).catch(e => {
                console.log("Error downloading workout.", e);
                this.isLoading = false;
            })
        },

        updateDescription: function(s) {
            this.newWorkoutData.description = s;
        },

        updateSelectedExercises: function(s) {
            this.newWorkoutData.exercises = s;
        }
    }
}
</script>