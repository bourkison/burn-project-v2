<template>
    <v-card>
        <v-container v-if="!isLoading">
            <v-text-field prepend-inner-icon="mdi-magnify" v-model="searchText" clearable label="Search exercise..."></v-text-field>

            <div v-if="filteredUserExercises.length > 0">
                <h2>My Exercises</h2>
                <v-list>
                    <v-list-item v-for="exercise in filteredUserExercises" :key="exercise.id" @click="selectExercise(exercise)">
                        <v-list-item-title>{{ exercise.name }}</v-list-item-title>
                    </v-list-item>
                </v-list>
            </div>

            <div v-if="filteredFollowedExercises.length > 0">
                <h2>Followed Exercises</h2>
                <v-list>
                    <v-list-item v-for="exercise in filteredFollowedExercises" :key="exercise.id" @click="selectExercise(exercise)">
                        <v-list-item-title>{{ exercise.name }}</v-list-item-title>
                    </v-list-item>
                </v-list>
            </div>

            <div v-if="userExercises.length === 0 && followedExercises.length === 0">
                <v-container><em>Try following or creating some exercises first!</em></v-container>
            </div>

            <div v-if="searchText">
                <h2>Other</h2>
                <v-list>
                    <v-list-item v-for="exercise in otherExercises" :key="exercise.id" @click="selectExercise(exercise)">
                        <v-list-item-title>{{ exercise.name }}</v-list-item-title>
                    </v-list-item>
                </v-list>
                <v-btn @click="searchExercise">Search</v-btn>
            </div>
        </v-container>
        <v-container v-else>
            <div align="center"><v-progress-circular indeterminate centered></v-progress-circular></div>
        </v-container>
    </v-card>
</template>

<script>
import { db } from '@/firebase'

export default {
    name: 'ExerciseSearch',
    data() {
        return {
            isLoading: true,
            searchText: '',
            userExercises: [],
            followedExercises: [],
            otherExercises: [],

            unsortedExercises: [],

            // Firebase:
            exercisesToDownload: 0,
            downloadedExercises: 0,
        }
    },

    mounted: function() {
        let exercisePromises = [];

        db.collection("users").doc(this.$store.state.userProfile.data.uid).collection("exercises").orderBy("createdAt", "desc").get()
        .then(exercisesSnapshot => {
            exercisesSnapshot.forEach(exercise => {
                return exercisePromises.push(db.collection("exercises").doc(exercise.id).get().then(exerciseDoc => {
                    this.unsortedExercises.push({ data: exerciseDoc.data(), isFollow: exercise.data().isFollow });
                }))

            })
        })
        .then(() => {
            Promise.all(exercisePromises).then(() => {
                this.unsortedExercises.sort(function(a, b) { return a.order - b.order });

                this.unsortedExercises.forEach(exercise => {
                    if (exercise.isFollow) {
                        this.followedExercises.push(exercise.data);
                    } else {
                        this.userExercises.push(exercise.data)
                    }
                })

                this.unsortedExercises = [];
                this.isLoading = false;
            })
        })
    },

    computed: {
        filteredUserExercises: function() {
            if (this.searchText) {
                return this.userExercises.filter(exercise => {
                    return exercise.name.toLowerCase().includes(this.searchText.toLowerCase());
                })
            } else {
                return this.userExercises;
            }
        },

        filteredFollowedExercises: function() {
            if (this.searchText) {
                return this.followedExercises.filter(exercise => {
                    return exercise.name.toLowerCase().includes(this.searchText.toLowerCase());
                })
            } else {
                return this.followedExercises;
            }
        }
    },

    methods: {
        selectExercise: function(obj) {
            this.$emit("selectExercise", obj);
        },

        searchExercise: function() {
            console.log("Search");
        }
    }
}
</script>