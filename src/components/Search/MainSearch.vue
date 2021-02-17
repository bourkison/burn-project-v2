<template>
    <v-menu bottom offset-y left allow-overflow>
        <template v-slot:activator="{ on, attrs }">
            <v-responsive max-width="280">
                <v-text-field v-model="searchText" v-bind="attrs" v-on="on" @input="initSearch" dense flat hide-details rounded solo-inverted label="Search..."></v-text-field>
            </v-responsive>
        </template>

        <div style="width:400px;">
            <v-card v-if="searchText">
                <v-card-text>
                    <v-list v-if="!isLoading">
                        <v-list-item v-for="user in userResponses" :key="user.username" :to="'/' + user.username">
                            <v-row align="center" justify="center">
                                <v-col cols="12" sm="2">
                                    <v-avatar size="40"><v-img :src="user.profilePhotoUrl"></v-img></v-avatar>
                                </v-col>
                                <v-col cols="12" sm="10">
                                    <b>{{ user.username }}</b>
                                </v-col>
                            </v-row>
                        </v-list-item>
                    </v-list>
                    <v-container v-if="isLoading">
                        <div align="center"><v-progress-circular indeterminate centered></v-progress-circular></div>
                    </v-container>
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
            userIndex: {},

            userResponses: [],

            // Algolia
            searchClient: algoliasearch(
                "O9KO1L25CJ",
                "e6492bc28cfda8670d4981bb26e4bbbd"
            )
        }
    },

    created: function() {
        this.userIndex = this.searchClient.initIndex("users");
    },

    methods: {
        initSearch: function() {
            this.isLoading = true;
            this.search();
        },  

        search: _.debounce(function() {
            this.userResponses = [];
            
            this.userIndex.search(this.searchText).then(responses => {
                responses.hits.forEach(hit => {
                    this.userResponses.push(hit);
                })

                this.isLoading = false;
            })
        }, 500)
    }
}
</script>