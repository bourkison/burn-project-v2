<template>
    <v-card outlined>
        <v-container v-if="!isLoading">
            <v-row>
                <v-col cols="12" sm="6">
                    <v-list flat subheader>
                        <v-subheader>Exercises</v-subheader>
                        <v-list-group sub-group no-action>
                            <template v-slot:activator>
                                <v-list-item-content class="subgroup">
                                    <v-list-item-title>My Exercises</v-list-item-title>
                                </v-list-item-content>
                            </template>

                            <v-list-item-group multiple v-model="selectedCreatedExercises">
                                <v-list-item v-for="createdExercise in createdExercisesData" :key="createdExercise.id">
                                    <v-list-item-content>
                                        <v-list-item-title>{{createdExercise.name}}</v-list-item-title>
                                    </v-list-item-content>
                                </v-list-item>
                            </v-list-item-group>
                        </v-list-group>

                        <v-list-group sub-group no-action>
                            <template v-slot:activator>
                                <v-list-item-content class="subgroup">
                                    <v-list-item-title>Followed Exercises</v-list-item-title>
                                </v-list-item-content>
                            </template>

                            <v-list-item-group multiple v-model="selectedFollowedExercises">
                                <v-list-item value="test1">
                                    <v-list-item-content>
                                        <v-list-item-title>Test 1</v-list-item-title>
                                    </v-list-item-content>
                                </v-list-item>

                                <v-list-item value="test2">
                                    <v-list-item-content>
                                        <v-list-item-title>Test 2</v-list-item-title>
                                    </v-list-item-content>
                                </v-list-item>

                                <v-list-item value="test3">
                                    <v-list-item-content>
                                        <v-list-item-title>Test 3</v-list-item-title>
                                    </v-list-item-content>
                                </v-list-item>
                            </v-list-item-group>
                        </v-list-group>
                    </v-list>

                    <div v-if="followedExercises.length > 0">
                        <h3>Followed Exercises</h3>
                    </div>
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
        selectedCreatedExercises: function() {
            console.log(this.selectedCreatedExercises);
        },

        selectedFollowedExercises: function() {
            console.log(this.selectedFollowedExercises);
        },

        downloadedExercises: function() {
            console.log(this.downloadedExercises);
            console.log(this.createdExercises.length + this.followedExercises.length);
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