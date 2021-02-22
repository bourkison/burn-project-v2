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
                        <v-expansion-panel v-for="(selectedExercise, index) in selectedExercisesData" :key="selectedExercise.id">
                            <v-expansion-panel-header>
                                <span><h4>{{ selectedExercise.name }}</h4></span>
                                <span style="text-align:right;">
                                    <span class="sortableHandle">
                                        <v-icon>mdi-drag-horizontal-variant</v-icon>
                                    </span>
                                </span>
                            </v-expansion-panel-header>
                            <v-expansion-panel-content>
                                <div align="right"><v-icon @click="removeSet(index)">mdi-close</v-icon></div>
                                <v-sheet class="mdOutput" v-html="compiledMarkdown(selectedExercise.description)"></v-sheet>
                                <v-card align="center"><SuggestedSetsSelector class="suggestedSets" :id="selectedExercise.id" @updateSets="updateSets"></SuggestedSetsSelector></v-card>
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
import { db } from '@/firebase'
import Sortable from 'sortablejs'
import * as marked from 'marked'

import SuggestedSetsSelector from '@/components/Exercise/SuggestedSetsSelector.vue'

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
        let exercisePromises = [];

        // Retrieve created exercises data.
        this.$props.createdExercises.forEach(exerciseId => {
            exercisePromises.push(db.collection("exercises").doc(exerciseId).get()
            .then(exerciseDoc => {
                let d = exerciseDoc.data();
                d.id = exerciseDoc.id;

                this.createdExercisesData.push(d);
            })
            .catch(e => {
                console.log("Error downloading created exercise data", e, exerciseId);
            }))
        })

        // Then retrieve followed exercises data.
        this.$props.followedExercises.forEach(exerciseId => {
            exercisePromises.push(db.collection("exercises").doc(exerciseId).get()
            .then(exerciseDoc => {
                let d = exerciseDoc.data();
                d.id = exerciseDoc.id;

                this.followedExercisesData.push(d);
            })
            .catch(e => {
                console.log("Error downloading followed exercise data", e, exerciseId);
            }))
        })


        Promise.all(exercisePromises)
        .then(() => {
            if (this.$props.initExercises) {
                console.log("Init", this.$props.initExercises);

                this.$props.initExercises.forEach(exercise => {
                    // For each exercise in init exercise, we check that we haven't already downloaded.
                    // If we haven't, download and push into selected exercise data.
                    // If we have, push from relevant array.
                    let cIndex = this.createdExercisesData.findIndex(x => x.id === exercise.id);
                    let fIndex = this.followedExercisesData.findIndex(x => x.id === exercise.id);

                    console.log(exercise.id, cIndex, fIndex);


                    if (cIndex < 0 && fIndex < 0) {
                        return db.collection("exercises").doc(exercise.id).get()
                        .then(exerciseDoc => {
                            this.selectedExercisesData.push(exerciseDoc.data);
                            this.selectedFollowedExercises.push(exercise.id);
                        })
                    } else if (cIndex >= 0) {
                        this.selectedCreatedExercises.push(exercise.id);
                        this.selectedExercisesData.push(this.createdExercisesData[cIndex]);
                    } else if (fIndex >= 0) {
                        this.selectedFollowedExercises.push(exercise.id);
                        this.selectedExercisesData.push(this.followedExercisesData[fIndex]);
                    }
                })
            }
        })
        .then(() => {
            this.isLoading = false;
        })
        .catch(e => {
            console.error("Error setting up exercise selector", e);
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
            this.$emit("updateSets", index, sets);
        },

        removeSet: function(index) {
            // this.selectedExercisesData.splice(index, 1);
            console.log(index);
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
        },

        selectedFollowedExercises: function(n, o) {
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

        isLoading: function(n, o) {
            if (!n && o && this.$props.initExercises) {
                // This interval is set as #selectedContainer isn't rendered yet when this is called.                
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

    .suggestedSets {
        box-shadow: unset;
    }

</style>