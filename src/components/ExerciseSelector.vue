<template>
    <v-card outlined>
        <v-container v-if="!isLoading">
            <v-row>
                <v-col cols="12" sm="6">
                    <h4>Exercises</h4>
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

                <v-col cols="12" sm="6">
                    <h4>Selected Exercises</h4>
                    <p v-for="selectedExercise in selectedExercisesData" :key="selectedExercise.id">{{selectedExercise.name}}</p>
                </v-col>
            </v-row>
        </v-container>
        <v-container v-else>
            <div align="center"><v-progress-circular indeterminate centered></v-progress-circular></div>
        </v-container>
    </v-card>
</template>

<script>
import { db } from '../firebase'

export default {
    name: 'ExerciseSelector',
    props: {
        createdExercises: {
            type: Array,
            required: false
        },
        followedExercises: {
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

            // Firebase:
            downloadedExercises: 0,

            // Vuetify:
            selectedCreatedExercises: [],
            selectedFollowedExercises: []
        }
    },

    created: function() {
        // Retrieve created exercises data.
        this.$props.createdExercises.forEach(exerciseId => {
            console.log("within foreach")
            db.collection("exercises").doc(exerciseId).get().then(exerciseDoc => {
                let d = exerciseDoc.data();
                d.id = exerciseId;

                this.createdExercisesData.push(d);
                this.downloadedExercises ++;
                console.log(this.createdExercisesData, this.downloadedExercises);
            }).catch(e => {
                console.log("Error downloading created exercise data", e, exerciseId);
            })
        })

        // Then retrieve followed exercises data.
        this.$props.followedExercises.forEach(exerciseId => {
            db.collection("exercises").doc(exerciseId).get().then(exerciseDoc => {
                let d = exerciseDoc.data();
                d.id = exerciseId;

                this.downloadedExercises ++;
                this.followedExercisesData.push(d);
            }).catch(e => {
                console.log("Error downloading followed exercise data", e, exerciseId);
            })
        })
    },

    methods: {

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
            } else {
                const id = o.filter(x => !n.includes(x))[0];
                this.selectedExercisesData = this.selectedExercisesData.filter(o => o.id !== id);
                console.log("Selected Exercises Data", this.selectedExercisesData);
            }
        },

        selectedFollowedExercises: function(n, o) {
            if (n.length > o.length) {
                const id = n[n.length - 1];
                this.selectedExercisesData.push(this.followedExercisesData.find(o => o.id === id))
            } else {
                const id = o.filter(x => !n.includes(x))[0];
                this.selectedExercisesData = this.selectedExercisesData.filter(o => o.id !== id);
            }

            console.log("n", n, "o", o);
            console.log("Selected Exercises Data", this.selectedExercisesData);
        },

        downloadedExercises: function() {
            if (this.downloadedExercises == this.createdExercises.length + this.followedExercises.length) {
                this.isLoading = false;
            }
        }
    }
}
</script>

<style scoped>
    .subgroup {
        padding-left: 0 !important;
    }
</style>