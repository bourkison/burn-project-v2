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
import { db } from '../../firebase'
import MarkdownInput from '../../components/MarkdownInput.vue'
import DifficultySelector from '../../components/DifficultySelector.vue'
import ExerciseSelector from '../../components/Exercise/ExerciseSelector.vue'

export default {
    name: 'NewWorkout',
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
        updateDescription: function(d) {
            this.workoutForm.description = d;
        },

        updateSelectedExercises: function(s) {
            this.workoutForm.exercises = s;
        },

        setDifficulty: function(d) {
            this.workoutForm.difficulty = d;
        },

        generateId(n) {
            let randomChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
            let id = '';
            // 7 random characters
            for (let i = 0; i < n; i++) {
                id += randomChars.charAt(Math.floor(Math.random() * randomChars.length));
            }
            return id;
        },

        createWorkout: function() {
            this.isCreating = true;
            this.workoutForm.createdAt = new Date();
            this.workoutForm.createdBy = { id: this.$store.state.userProfile.data.uid, username: this.$store.state.userProfile.docData.username, profilePhoto: this.$store.state.userProfile.docData.profilePhotoUrl }
            
            // Update the exercises to only include name, id, suggestedSets
            let i = 0;
            this.workoutForm.exercises.forEach(exercise => {
                this.workoutForm.exercises[i] = { name: exercise.name, id: exercise.id, suggestedSets: exercise.suggestedSets }
                i ++;
            })

            // Setting this to 1 will call the watcher, which begins the upload process.
            this.idAttempts = 1;
        }
    },

    watch: {
        // Upload begin:
        idAttempts: function() {
            let firstHalfId = this.workoutForm.name.replaceAll(/[^A-Za-z0-9]/g, "").substring(0, 8).toLowerCase();
            if (firstHalfId.length > 0) {
                firstHalfId += "-";
            }
            this.workoutForm.id = firstHalfId + "-" + this.generateId(15 - firstHalfId.length);
            this.workoutForm.likeCount = 0;
            this.workoutForm.recentComments = [];
            this.workoutForm.commentCount = 0;
            this.workoutForm.followCount = 0;
            
            db.collection("workouts").doc(this.workoutForm.id).get().then(idTestDoc => {
                if (!idTestDoc.exists) {
                    // If the ID doesn't exist, first set the workout document in workouts collection.
                    db.collection("workouts").doc(this.workoutForm.id).set(this.workoutForm).then(() => {
                        // Then in users collection
                        let workoutPayload = { createdAt: this.workoutForm.createdAt, isFollow: false }
                        db.collection("users").doc(this.$store.state.userProfile.data.uid).collection("workouts").doc(this.workoutForm.id).set(workoutPayload).then(() => {
                            this.isCreating = false;
                            this.$router.push("/workouts/" + this.workoutForm.id);
                        }).catch(e => {
                            this.errorMessage = "Error updating user: " + e;
                            console.log(this.errorMessage);
                        })
                    }).catch(e => {
                        this.errorMessage = "Error creating workout: " + e;
                        console.log(this.errorMessage);
                    })
                } else {
                    this.idAttempts++;
                }
            })
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