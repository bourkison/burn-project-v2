<template>
    <v-menu v-model="menuModel" :open-on-click="false" :close-on-click="false" bottom offset-y left allow-overflow>
        <template v-slot:activator="{ on }">
            <v-response max-width="280">
                <v-text-field v-model="searchText" v-on="on" dense flat hide-details rounded solo-inverted label="Search..." @focus="menuModel = true;" @blur="menuModel = false;"></v-text-field>
            </v-response>
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

    <!-- <v-autocomplete
        v-model="model"
        :items="responses"
        :loading="isLoading"
        :search-input.sync="searchText"
        clearable
        solo
    >
        <template v-slot:no-data>
            <v-list-item>
                <v-list-item-title>Search for a user, exercise or workout...</v-list-item-title>
            </v-list-item>
        </template>

        <template v-slot:item="{ item }" v-if="item.type == 'exercise'">
            <v-list-item-content>
                <v-list-item-title v-text="item.name"></v-list-item-title>
            </v-list-item-content>
        </template>
    </v-autocomplete> -->
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
            userIndex: null,
            exerciseIndex: null,

            responses: [],
            userResponses: [],
            exerciseResponses: [],

            // Vuetify:
            menuModel: false,

            // Algolia
            searchClient: algoliasearch(
                "O9KO1L25CJ",
                "e6492bc28cfda8670d4981bb26e4bbbd"
            )
        }
    },

    created: function() {
        this.userIndex = this.searchClient.initIndex("users");
        this.exerciseIndex = this.searchClient.initIndex("exercises");
    },

    methods: {
        search: _.debounce(function() {
            let searchPromises = [];

            this.responses = [];
            this.userResponses = [];
            this.exerciseResponses = [];
            
            searchPromises.push(this.userIndex.search(this.searchText).then(responses => {
                responses.hits.forEach(hit => {
                    this.userResponses.push(hit);
                    let d = hit;
                    d.type = "user";
                    this.responses.push(d);
                })
            }))

            searchPromises.push(this.exerciseIndex.search(this.searchText).then(responses => {
                responses.hits.forEach(hit => {
                    this.exerciseResponses.push(hit);
                    let d = hit;
                    d.type = "exercise";
                    this.responses.push(d);
                })
            }))

            Promise.all(searchPromises)
            .then(() => {
                console.log("USER RESPONSES:", this.userResponses, "EXERCISE RESPONSES:", this.exerciseResponses);
                this.isLoading = false;
            })
        }, 500)
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