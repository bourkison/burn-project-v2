<template>
    <v-card>
        <v-container v-if="!isLoading">
            <v-text-field prepend-inner-icon="mdi-magnify" v-model="searchText" clearable label="Search exercise..."></v-text-field>

            <div v-if="filteredUserExercises.length > 0">
                <h2>My Exercises</h2>
                <v-list>
                    <v-list-item v-for="exercise in filteredUserExercises" :key="exercise.id">
                        <v-list-item-title>{{ exercise.name }}</v-list-item-title>
                    </v-list-item>
                </v-list>
            </div>

            <div v-if="filteredFollowedExercises.length > 0">
                <h2>Followed Exercises</h2>
                <v-list>
                    <v-list-item v-for="exercise in filteredFollowedExercises" :key="exercise.id">
                        <v-list-item-title>{{ exercise.name }}</v-list-item-title>
                    </v-list-item>
                </v-list>
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
            unsortedExercises: [],

            // Firebase:
            exercisesToDownload: 0,
            downloadedExercises: 0,
        }
    },

    mounted: function() {
        db.collection("users").doc(this.$store.state.userProfile.data.uid).collection("exercises").orderBy("createdAt", "desc").get().then(exercisesSnapshot => {
            let i = 0;
            this.exercisesToDownload = exercisesSnapshot.size;
            exercisesSnapshot.forEach(exercise => {
                this.downloadExercise(exercise.id, i, exercise.data().isFollow);
                i ++;
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
        downloadExercise: function(id, i, isFollow) {
            db.collection("exercises").doc(id).get().then(exerciseDoc => {
                this.unsortedExercises.push({ order: i, data: exerciseDoc.data(), isFollow: isFollow });
                this.downloadedExercises ++;
            })
        }
    },

    watch: {
        downloadedExercises: function() {
            if (this.downloadedExercises >= this.exercisesToDownload) {
                let temp = this.unsortedExercises.sort(function(a, b) { return a.order - b.order })
                temp.forEach(exercise => {
                    if (exercise.isFollow === true) {
                        this.followedExercises.push(exercise.data);
                    } else {
                        this.userExercises.push(exercise.data)
                    }
                })

                this.unsortedExercises = [];
                this.isLoading = false;
                console.log("Followed", this.followedExercises);
                console.log("User", this.userExercises);
            }
        }
    }
}
</script>