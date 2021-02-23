<template>
    <v-menu v-model="menuModel" :open-on-click="false" :close-on-click="false" bottom offset-y left allow-overflow>
        <template v-slot:activator="{ on }">
            <v-responsive max-width="280">
                <v-text-field v-model="searchText" v-on="on" dense flat hide-details prepend-inner-icon="mdi-magnify" solo-inverted label="Search..." @focus="menuModel = true;" @blur="closeDialog"></v-text-field>
            </v-responsive>
        </template>

        <div style="width:400px;">
            <v-card v-if="searchText">
                <v-card-text>
                    <v-list v-if="!isLoading && userResponses.length > 0">
                        <h2>Users</h2>
                        <v-list-item v-for="user in userResponses" :key="user.username" :to="'/' + user.username">
                            <v-list-item-title>
                                <v-row align="center" justify="center">
                                    <v-col cols="12" sm="2">
                                        <v-avatar size="40"><v-img :src="user.profilePhotoUrl"></v-img></v-avatar>
                                    </v-col>
                                    <v-col cols="12" sm="10">
                                        <b>{{ user.username }}</b>
                                    </v-col>
                                </v-row>
                            </v-list-item-title>
                        </v-list-item>
                    </v-list>

                    <v-list v-if="!isLoading && exerciseResponses.length > 0">
                        <h2>Exercises</h2>
                        <v-list-item v-for="exercise in exerciseResponses" :key="exercise.objectID" :to="'/exercises/' + exercise.objectID">
                            <v-list-item-title>{{ exercise.name }}</v-list-item-title>
                        </v-list-item>
                    </v-list>

                    <v-list v-if="!isLoading && workoutResponses.length > 0">
                        <h2>Workouts</h2>
                        <v-list-item v-for="workout in workoutResponses" :key="workout.objectID" :to="'/workouts/' + workout.objectID">
                            <v-list-item-title>{{ workout.name }}</v-list-item-title>
                        </v-list-item>
                    </v-list>

                    <v-container v-if="isLoading">
                        <div align="center"><v-progress-circular indeterminate centered></v-progress-circular></div>
                    </v-container>
                </v-card-text>
            </v-card>
            <v-card v-else>
                <v-card-text>
                    <em>Search for users, exercises or workouts...</em>
                </v-card-text>
            </v-card>
        </div>
    </v-menu>
</template>

<script>
import algoliasearch from 'algoliasearch'
import _ from 'lodash'

export default {
    name: 'MainSearch',
    data() {
        return {
            isLoading: false,
            searchText: '',

            userResponses: [],
            exerciseResponses: [],
            workoutResponses: [],

            // Vuetify:
            menuModel: false,

            // Algolia
            searchClient: algoliasearch(
                "O9KO1L25CJ",
                "e6492bc28cfda8670d4981bb26e4bbbd"
            ),
            userIndex: null,
            exerciseIndex: null,
            workoutIndex: null,
        }
    },

    created: function() {
        this.userIndex = this.searchClient.initIndex("users");
        this.exerciseIndex = this.searchClient.initIndex("exercises");
        this.workoutIndex = this.searchClient.initIndex("workouts");
    },

    methods: {
        search: _.debounce(function() {
            let searchPromises = [];

            this.userResponses = [];
            this.exerciseResponses = [];
            this.workoutResponses = [];
            
            searchPromises.push(this.userIndex.search(this.searchText).then(responses => {
                responses.hits.forEach(hit => {
                    this.userResponses.push(hit);
                })
            }))

            searchPromises.push(this.exerciseIndex.search(this.searchText).then(responses => {
                responses.hits.forEach(hit => {
                    this.exerciseResponses.push(hit);
                })
            }))

            searchPromises.push(this.workoutIndex.search(this.searchText).then(responses => {
                responses.hits.forEach(hit => {
                    this.workoutResponses.push(hit);
                })
            }))

            Promise.all(searchPromises)
            .then(() => {
                console.log("USER RESPONSES:", this.userResponses, "EXERCISE RESPONSES:", this.exerciseResponses, "WORKOUT RESPONSES:", this.workoutResponses);
                this.isLoading = false;
            })
        }, 750),

        closeDialog: function() {
            // Must set a timeout, as if instant, we are not able to click on links.
            // This is gross and we should come back to this
            return setTimeout(() => {
                console.log("Timeout");
                this.menuModel = false;
            }, 1000)
        },

        searchClick: function(path) {
            this.$router.push("/exercises/" + path);
        }
    },

    watch: {
        searchText: function() {
            if (this.searchText) {
                this.isLoading = true;
            } else {
                this.isLoading = false;
            }

            this.search();
        }
    }
}
</script>