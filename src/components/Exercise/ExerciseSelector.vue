<template>
    <v-card outlined>
        <v-container v-if="!isLoading">
            <v-row>
                <v-col cols="12" md="12" sm="12">
                    <h3>Exercises</h3>
                    <v-list flat>
                        <v-list-group v-if="createdExercisesData.length > 0" sub-group no-action>
                            <template v-slot:activator>
                                <v-list-item-content class="subgroup">
                                    <v-list-item-title>My Exercises</v-list-item-title>
                                </v-list-item-content>
                            </template>

                            <v-list-item-group multiple v-model="selectedCreatedExercises">
                                <v-list-item v-for="createdExercise in createdExercisesData" :key="createdExercise.id" :value="createdExercise.id">
                                    <v-list-item-content>
                                        <v-list-item-title>{{createdExercise.name}}</v-list-item-title>
                                    </v-list-item-content>
                                </v-list-item>
                            </v-list-item-group>
                        </v-list-group>

                        <v-list-group v-if="followedExercisesData.length > 0" sub-group no-action>
                            <template v-slot:activator>
                                <v-list-item-content class="subgroup">
                                    <v-list-item-title>Followed Exercises</v-list-item-title>
                                </v-list-item-content>
                            </template>

                            <v-list-item-group multiple v-model="selectedFollowedExercises">
                                <v-list-item v-for="followedExercise in followedExercisesData" :key="followedExercise.id" :value="followedExercise.id">
                                    <v-list-item-content>
                                        <v-list-item-title>{{followedExercise.name}}</v-list-item-title>
                                    </v-list-item-content>
                                </v-list-item>
                            </v-list-item-group>
                        </v-list-group>
                    </v-list>
                </v-col>

                <v-col cols="12" md="12" sm="12">
                    <h3>Selected Exercises</h3>
                    <v-expansion-panels ref="selectedContainer" id="selectedContainer">
                        <v-expansion-panel v-for="selectedExercise in selectedExercisesData" :key="selectedExercise.id">
                            <v-expansion-panel-header>
                                <span><h4>{{ selectedExercise.name }}</h4></span>
                                <span class="sortableHandle" style="text-align:right;">
                                    <v-icon>mdi-drag-horizontal-variant</v-icon>
                                </span>
                            </v-expansion-panel-header>
                            <v-expansion-panel-content>
                                <v-sheet class="mdOutput" v-html="compiledMarkdown(selectedExercise.description)"></v-sheet>
                                <v-card align="center"><SuggestedSetsSelector :id="selectedExercise.id" :initSuggestedSets="selectedExercise.suggestedSets" @updateSets="updateSets"></SuggestedSetsSelector></v-card>
                            </v-expansion-panel-content>    
                        </v-expansion-panel>
                    </v-expansion-panels>   
                </v-col>
            </v-row>
        </v-container>
        <v-container v-else>
            <div align="center"><v-progress-circular indeterminate centered></v-progress-circular></div>
        </v-container>
    </v-card>
</template>

<script>
import { db } from '../../firebase'
import Sortable from 'sortablejs'
import * as marked from 'marked'

import SuggestedSetsSelector from './SuggestedSetsSelector.vue'

export default {
    name: 'ExerciseSelector',
    components: { SuggestedSetsSelector },
    props: {
        createdExercises: {
            type: Array,
            required: false
        },
        followedExercises: {
            type: Array,
            required: false
        },
        initExercises: {
            type: Array,
            required: false
        }
    },
    data() {
        return {
            isLoading: true,
            createdExercisesData: [],
            followedExercisesData: [],
            selectedExercisesData: [],

            // Sortable: 
            sortable: null,
            sortableOptions: {
                handle: '.sortableHandle',
                animation: 300,
                onEnd: this.changeOrder
            },

            // Firebase:
            downloadedExercises: 0,

            // Vuetify:
            selectedCreatedExercises: [],
            selectedFollowedExercises: []
        }
    },

    mounted: function() {
        // Retrieve created exercises data.
        this.$props.createdExercises.forEach(exerciseId => {
            db.collection("exercises").doc(exerciseId).get().then(exerciseDoc => {
                let d = exerciseDoc.data();
                d.id = exerciseId;

                this.createdExercisesData.push(d);
                this.downloadedExercises ++;
            }).catch(e => {
                console.log("Error downloading created exercise data", e, exerciseId);
            })
        })

        // Then retrieve followed exercises data.
        this.$props.followedExercises.forEach(exerciseId => {
            db.collection("exercises").doc(exerciseId).get().then(exerciseDoc => {
                let d = exerciseDoc.data();
                d.id = exerciseId;

                this.followedExercisesData.push(d);
                this.downloadedExercises ++;
            }).catch(e => {
                console.log("Error downloading followed exercise data", e, exerciseId);
            })
        })
    },

    methods: {
        changeOrder: function(event) {
            // Changes order of this.selectedExercisesData after dragging and dropping.
            if (event.newIndex !== event.oldIndex) {
                this.selectedExercisesData.splice(event.newIndex, 0, this.selectedExercisesData.splice(event.oldIndex, 1)[0]);
            }
        },

        compiledMarkdown: function(description) {
            return marked(description);
        },

        updateSets: function(sets, id) {
            let index = this.selectedExercisesData.findIndex(x => x.id === id);
            this.selectedExercisesData[index].suggestedSets = sets;
        }
    },

    watch: {
        selectedCreatedExercises: function(n, o) {
            // Checks to see if array has been added or removed.
            // If added, then (as this array is an array of IDs),
            // Find the relevant object in createdExercisesData and
            // Push to our selectedExercisesData array.
            if (n.length > o.length) {
                const id = n[n.length - 1];
                this.selectedExercisesData.push(this.createdExercisesData.find(o => o.id === id))
            } else if (n.length < o.length) {
                const id = o.filter(x => !n.includes(x))[0];
                this.selectedExercisesData = this.selectedExercisesData.filter(o => o.id !== id);
            }

            if (o.length === 0 && this.selectedExercisesData.length === 1) {
                this.sortable = new Sortable(document.getElementById("selectedContainer"), this.sortableOptions);
            } else if (this.selectedExercisesData.length === 0) {
                this.sortable = null;
            }

            console.log("sel created", n, o);
        },

        selectedFollowedExercises: function(n, o) {
            console.log("sel followed", n, o)
            if (n.length > o.length) {
                const id = n[n.length - 1];
                this.selectedExercisesData.push(this.followedExercisesData.find(o => o.id === id))
            } else if (n.length < o.length) {
                const id = o.filter(x => !n.includes(x))[0];
                this.selectedExercisesData = this.selectedExercisesData.filter(o => o.id !== id);
            }

            if (o.length === 0 && this.selectedExercisesData.length === 1) {
                this.sortable = new Sortable(document.getElementById("selectedContainer"), this.sortableOptions);
            } else if (this.selectedExercisesData.length === 0) {
                this.sortable = null;
            }
        },

        downloadedExercises: function() {
            if (this.downloadedExercises == this.createdExercises.length + this.followedExercises.length) {
                
                // Push init exercises into selected exercises.
                if (this.$props.initExercises) {
                    this.$props.initExercises.forEach(initEx => {
                        let index;

                        index = this.createdExercisesData.findIndex(o => o.id === initEx.id);

                        if (index >= 0) {
                            this.selectedCreatedExercises.push(initEx.id);
                            this.selectedExercisesData.push(this.createdExercisesData.find(o => o.id === initEx.id))

                            console.log("created ex");
                        } else {
                            index = this.followedExercisesData.findIndex(o => o.id === initEx.id);

                            
                            if (index >= 0) {
                                this.selectedFollowedExercises.push(initEx.id);
                                this.selectedExercisesData.push(this.followedExercisesData.find(o => o.id === initEx.id))
                                
                                console.log("followed ex")
                            }
                        }
                    })
                }
                
                this.isLoading = false;
            }
        },

        isLoading: function(n, o) {
            if (!n && o && this.$props.initExercises) {
                // this.sortable = new Sortable(this.$refs.selectedContainer, this.sortableOptions);
                let waitInterval = setInterval(() => {
                    if (this.$refs.selectedContainer) {
                        this.sortable = new Sortable(document.getElementById("selectedContainer"), this.sortableOptions);
                        clearInterval(waitInterval);
                    }
                }, 250);
            }

            
        },

        selectedExercisesData: function() {
            this.$emit("selectedExercisesChange", this.selectedExercisesData);
        }
    }
}
</script>

<style scoped>
    .subgroup {
        padding-left: 0 !important;
    }

    .selectedExercise {
        height: 48px;
        border: 1px solid white;
    }

    .sortableHandle:hover {
        cursor: pointer;
    }

    .mdOutput h1,
    .mdOutput h2,
    .mdOutput h3,
    .mdOutput h4,
    .mdOutput h5,
    .mdOutput h6 {
        font-size: 12px;
    }

    .mdOutput {
        font-size: 10px;
    }

</style>