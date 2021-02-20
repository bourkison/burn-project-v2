<!--
    workout:
    {
        name: string,
        description: string,
        difficulty: integer,
        exercises: array of objects // { name, id, suggestedSets }
    }
-->

<template>
    <v-sheet>
        <v-container v-if="!isLoading">
            <h1 align="center">{{ workoutForm.name ? workoutForm.name : 'New Workout' }}</h1>
            <v-form @submit.prevent="createWorkout">
                <v-text-field v-model="workoutForm.name" label="Workout Name" :rules=[rules.required]></v-text-field>
                <MarkdownInput @update-text="updateDescription"></MarkdownInput>
                <ExerciseSelector class="exerciseSelector" :createdExercises="userCreatedExercises" :followedExercises="userFollowedExercises" @selectedExercisesChange="updateSelectedExercises"></ExerciseSelector>
                <DifficultySelector class="difficultySelector" @setDifficulty="setDifficulty"></DifficultySelector>
                <div class="text-center submitButton"><v-btn type="submit" :loading="isCreating" :disabled="isCreating">Create Workout</v-btn></div>
            </v-form>
        </v-container>
        <v-container v-else>
            <div align="center"><v-progress-circular indeterminate centered></v-progress-circular></div>
        </v-container>
    </v-sheet>
</template>

<script>
import { db, functions } from '@/firebase'
import MarkdownInput from '@/components/MarkdownInput.vue'
import DifficultySelector from '@/components/DifficultySelector.vue'
import ExerciseSelector from '@/components/Exercise/ExerciseSelector.vue'

export default {
    name: 'WorkoutNew',
    components: { MarkdownInput, ExerciseSelector, DifficultySelector },
    data() {
        return {
            isLoading: true,
            isCreating: false,
            errorMessage: '',
            userCreatedExercises: [],
            userFollowedExercises: [],
            workoutForm: {
                name: '',
                description: '',
                exercises: [],
                difficulty: 1
            },

            // Firebase:
            idAttempts: 0,

            // Vuetify:
            rules: {
                required: value => !!value || 'Required.'
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

                    this.isLoading = false;
                })
            }
        }).catch(e => {
            this.isLoading = false;
            this.errorMessage = "Error downloading exercises " + e;
            console.log(this.errorMessage);
        })
    },

    methods: {
        createWorkout: function() {
            this.isCreating = true;
            const createWorkout = functions.httpsCallable("createWorkout");
            const user = { username: this.$store.state.userProfile.docData.username, profilePhotoUrl: this.$store.state.userProfile.docData.profilePhotoUrl };

            createWorkout({ workoutForm: this.workoutForm, user: user })
            .then(result => {
                this.isCreating = false;
                this.$router.push("/workouts/" + result.data.id);
            })
            .catch(e => {
                console.log("ERROR:", e);
                this.isCreating = false;
            })

        },

        updateDescription: function(d) {
            this.workoutForm.description = d;
        },

        updateSelectedExercises: function(s) {
            this.workoutForm.exercises = s;
        },

        setDifficulty: function(d) {
            this.workoutForm.difficulty = d;
        }
    }
}
</script>

<style scoped>
    .difficultySelector,
    .exerciseSelector {
        margin-top: 20px;
        padding: 10px;
    }

    .submitButton {
        margin-top: 10px;
    }
</style>