<template>
    <v-card>
        <v-container v-if="!isLoading">
            <v-text-field prepend-inner-icon="mdi-magnify" v-model="searchText" clearable label="Search exercise..."></v-text-field>

            <div v-if="filteredUserExercises.length > 0">
                <h2>My Exercises</h2>
                <v-list>
                    <v-list-item v-for="exercise in filteredUserExercises" :key="exercise.id" @click="selectExercise(exercise, true)">
                        <v-list-item-title>{{ exercise.name }}</v-list-item-title>
                    </v-list-item>
                </v-list>
            </div>

            <div v-if="filteredFollowedExercises.length > 0">
                <h2>Followed Exercises</h2>
                <v-list>
                    <v-list-item v-for="exercise in filteredFollowedExercises" :key="exercise.id" @click="selectExercise(exercise, true)">
                        <v-list-item-title>{{ exercise.name }}</v-list-item-title>
                    </v-list-item>
                </v-list>
            </div>

            <div v-if="userExercises.length === 0 && followedExercises.length === 0">
                <v-container><em>Try following or creating some exercises first!</em></v-container>
            </div>

            <div v-if="searchText">
                <h2>Other</h2>
                <v-list v-if="!isSearching">
                    <v-list-item v-for="exercise in otherExercises" :key="exercise.id" @click="selectExercise(exercise, false)">
                        <v-list-item-title>{{ exercise.name }}</v-list-item-title>
                    </v-list-item>
                </v-list>
                <div v-if="isSearching">
                    <div align="center"><v-progress-circular indeterminate centered></v-progress-circular></div>
                </div>
                <v-btn v-if="!exerciseIndex" @click="searchExercise">Search</v-btn>
            </div>
        </v-container>
        <v-container v-else>
            <div align="center"><v-progress-circular indeterminate centered></v-progress-circular></div>
        </v-container>
    </v-card>
</template>

<script>
import { db } from '@/firebase'
import algoliasearch from 'algoliasearch'
import _ from 'lodash'

export default {
    name: 'ExerciseSearch',
    data() {
        return {
            isLoading: true,
            isSearching: false,
            searchText: '',
            userExercises: [],
            followedExercises: [],
            otherExercises: [],

            unsortedExercises: [],

            // Firebase:
            exercisesToDownload: 0,
            downloadedExercises: 0,

            // Algolia
            searchClient: algoliasearch(
                "O9KO1L25CJ",
                "e6492bc28cfda8670d4981bb26e4bbbd"
            ),
            exerciseIndex: null,
        }
    },

    mounted: function() {
        let exercisePromises = [];

        db.collection("users").doc(this.$store.state.userProfile.data.uid).collection("exercises").orderBy("createdAt", "desc").get()
        .then(exercisesSnapshot => {
            exercisesSnapshot.forEach(exercise => {
                return exercisePromises.push(db.collection("exercises").doc(exercise.id).get().then(exerciseDoc => {
                    let data = exerciseDoc.data();
                    data.id = exerciseDoc.id;
                    this.unsortedExercises.push({ data: data, isFollow: exercise.data().isFollow });
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
        selectExercise: function(obj, loaded) {
            if (loaded) {
                this.$emit("selectExercise", obj);
            } else {
                this.isSearching = true;
                db.collection("exercises").doc(obj.id).get()
                .then(exerciseDoc => {
                    let data = exerciseDoc.data();
                    data.id = exerciseDoc.id;
                    this.$emit("selectExercise", data)
                })
            }
        },

        searchExercise: function() {
            this.exerciseIndex = this.searchClient.initIndex("exercises");
            this.isSearching = true;
            this.search();
        },

        search: _.debounce(function() {
            // If exerciseIndex is not null, then user has initiated it by clicking search button.
            this.otherExercises = [];
            this.exerciseIndex.search(this.searchText).then(responses => {
                responses.hits.forEach(hit => {
                    let d = hit;
                    d.id = d.objectID;
                    delete d.objectID;

                    this.otherExercises.push(d);
                    this.isSearching = false;
                })
            })
        })
    },

    watch: {
        searchText: function() {
            if (this.exerciseIndex) {
                this.isSearching = true;
                this.search();
            }
        }
    }
}
</script>