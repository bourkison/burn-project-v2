<template>
    <v-sheet>
        <v-container v-if="!isLoading">
            <v-form @submit.prevent="updateWorkout">
                <h1>{{ newWorkoutData.name }}</h1>
                <v-text-field v-model="newWorkoutData.name" :rules=[rules.required] label="Workout Name"></v-text-field>
                <MarkdownInput :starting-text="oldWorkoutData.description" @update-text="updateDescription" />
                <ExerciseSelector class="exerciseSelector" :initExercises="oldWorkoutData.exercises" :createdExercises="userCreatedExercises" :followedExercises="userFollowedExercises" @selectedExercisesChange="updateSelectedExercises" @updateSets="updateSets" />
                <v-row justify="center" align="center">
                    <v-col cols="12" md="6">
                        <DifficultySelector class="difficultySelector" :initialDifficulty="oldWorkoutData.difficulty" @setDifficulty="setDifficulty" />
                    </v-col>
                    <v-col cols="12" md="6">
                        <v-card class="tagSelector" outlined>
                            <TagSelect @updateTags="updateTags" :initialTags="oldWorkoutData.tags" />
                        </v-card>
                    </v-col>
                </v-row>
                <div class="text-center submitButton">
                    <v-btn @click="$router.push('/workouts/' + $route.params.workoutid +'/')" color="error" style="margin-right:5px;">Close</v-btn>
                    <v-btn type="submit" :loading="isUpdating" :disabled="isUpdating" style="margin-left:5px;">Update Workout</v-btn>
                </div>
            </v-form>
        </v-container>
        <v-container v-else>
            <div align="center"><v-progress-circular indeterminate centered></v-progress-circular></div>
        </v-container>
    </v-sheet>
</template>

<script>
import { db } from '@/firebase'

import MarkdownInput from '@/components/Utility/MarkdownInput.vue'
import ExerciseSelector from '@/components/Exercise/ExerciseSelector.vue'
import DifficultySelector from '@/components/Utility/DifficultySelector.vue'
import TagSelect from '@/components/Utility/TagSelect.vue'
import { functions } from '../../firebase'

export default {
    name: 'WorkoutEdit',
    components: { MarkdownInput, ExerciseSelector, DifficultySelector, TagSelect },
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

    methods: {
        downloadWorkout: function() {
            // First download this workout information.
            db.collection("workouts").doc(this.$route.params.workoutid).get()
            .then(workoutDoc => {
                if (workoutDoc.exists) {
                    this.oldWorkoutData = workoutDoc.data();
                    this.newWorkoutData = workoutDoc.data();

                    // Then download user exercises for ExerciseSelector.
                    db.collection("users").doc(this.$store.state.userProfile.data.uid).collection("exercises").orderBy("createdAt", "desc").get()
                    .then(exercisesSnapshot => {
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
                    })
                    .catch(e => {
                        this.isLoading = false;
                        this.errorMessage = "Error downloading exercises " + e;
                        console.log(this.errorMessage);
                    })
                } else {
                    console.log("This workout does not exist.");
                    this.isLoading = false;
                }
            })
            .catch(e => {
                console.log("Error downloading workout.", e);
                this.isLoading = false;
            })
        },

        updateWorkout: function() {
            this.isUpdating = true;
            this.newWorkoutData.id = this.$route.params.workoutid;

            let updateAlgolia;

            if (this.newWorkoutData.name !== this.oldWorkoutData.name) {
                updateAlgolia = true;
            } else {
                updateAlgolia = false;
            }
            
            const editWorkout = functions.httpsCallable("editWorkout");

            editWorkout({ workoutForm: this.newWorkoutData, updateAlgolia: updateAlgolia })
            .then(result => {
                this.isUpdating = false;
                this.$router.push("/workouts/" + result.data.id);
            })
            .catch(e => {
                this.isUpdating = false;
                console.error("Error updating workout:", e);
            })
        },

        updateDescription: function(s) {
            this.newWorkoutData.description = s;
        },

        updateSelectedExercises: function(s) {
            let muscleGroups = [];
            this.newWorkoutData.exercises = [];

            // Push each exercises ID and Name to this Workout.
            s.forEach(exercise => {
                console.log(exercise);
                this.newWorkoutData.exercises.push({
                    id: exercise.id,
                    name: exercise.name,
                    sets: [{ measureBy: 'Reps', measureAmount: 0 }]
                })

                // Then push unique muscle groups to this array.
                exercise.muscleGroups.forEach(muscleGroup => {
                    if (!muscleGroups.includes(muscleGroup)) {
                        muscleGroups.push(muscleGroup)
                    }
                })
            })

            this.newWorkoutData.muscleGroups = muscleGroups;
        },

        updateSets: function(index, sets) {
            let s = [];
            sets.forEach(set => {
                delete set.id
                set.measureAmount = Number(set.measureAmount);
                s.push(set);
            })
            this.newWorkoutData.exercises[index].sets = sets;
        },

        updateTags: function(tags) {
            this.newWorkoutData.tags = tags;
        },
        
        setDifficulty: function(d) {
            this.newWorkoutData.difficulty = d;
        }
    }
}
</script>

<style scoped>
    .exerciseSelector,
    .difficultySelector,
    .tagSelector {
        margin-top: 20px;
        padding: 10px;
    }

    .submitButton {
        margin-top: 10px;
    }
</style>