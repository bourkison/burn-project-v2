<template>
    <v-container class="mainCont" fluid>
        <v-row>
            <v-spacer></v-spacer>
            <v-col cols="12" sm="3" xl="2"></v-col>
            <v-col cols="12" sm="6">
                <v-sheet class="mainSheet" rounded="lg">
                    <v-container v-if="!isLoading">
                        <div v-if="!workoutCommenced">
                            <h1>Recent Workouts</h1>
                            <v-list-item v-for="recentWorkout in userRecentWorkouts" :key="recentWorkout.id">
                                <v-list-item-content>
                                    <v-list-item-title>{{ recentWorkout.workoutName }}</v-list-item-title>
                                    <v-list-item-content><em>Completed on: {{ recentWorkout.createdAt }}</em></v-list-item-content>
                                </v-list-item-content>
                            </v-list-item>
                            <h1>Workouts</h1>
                            <v-list-item v-for="workout in userWorkouts" :key="workout.id">
                                <v-list-item-content>
                                    <v-list-item-title>{{ workout.name }}</v-list-item-title>
                                </v-list-item-content>
                            </v-list-item>
                        </div>
                        <div v-else>
                            <v-card outlined rounded="lg">
                                <WorkoutRecorder :workout="workoutData"></WorkoutRecorder>
                            </v-card>
                        </div>
                    </v-container>
                    <v-container v-else>
                        <div align="center"><v-progress-circular indeterminate centered></v-progress-circular></div>
                    </v-container>
                </v-sheet>
            </v-col>
            <v-col cols="12" sm="3" xl="2"></v-col>
            <v-spacer></v-spacer>
        </v-row>

        <v-dialog v-if="workoutData" v-model="startWorkoutDialogue" max-width="600">
            <v-card>
                <v-container>
                    <v-list-item v-for="exercise in workoutData.exercises" :key="exercise.id">
                        <v-list-item-content>
                            <v-list-item-title>{{ exercise.name }}</v-list-item-title>
                        </v-list-item-content>
                    </v-list-item>
                </v-container>
            </v-card>
            <v-card-actions>
                <v-spacer></v-spacer>
                <v-btn color="error" text @click="startWorkoutDialogue = false">Close</v-btn>
                <v-btn color="blue darken-1" text @click="startWorkout">Start</v-btn>
            </v-card-actions>
        </v-dialog>
    </v-container>
</template>

<script>
import { db } from '../firebase'

import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'

import WorkoutRecorder from '../components/WorkoutRecorder.vue'

export default {
    name: 'Burn',
    components: { WorkoutRecorder },
    data() {
        return {
            isLoading: true,
            isLoadingWorkouts: true,
            isLoadingRecentWorkouts: true,
            workoutData: {},
            userWorkouts: [],
            userRecentWorkouts: [],
            workoutCommenced: false,

            // Firebase:
            downloadedWorkouts: 0,
            workoutsToDownload: 0,

            // Vuetify:
            startWorkoutDialogue: false
        }
    },

    created: function() {
        dayjs.extend(relativeTime);

        db.collection("users").doc(this.$store.state.userProfile.data.uid).collection("workouts").orderBy("createdAt", "desc").get().then(workoutsSnapshot => {
            this.workoutsToDownload = workoutsSnapshot.size;

            workoutsSnapshot.forEach(workout => {
                db.collection("workouts").doc(workout.id).get().then(workoutDoc => {
                    this.userWorkouts.push(workoutDoc.data());

                    // Check if this is our route query workout. If so put in workoutData to avoid loading twice.
                    if (this.$route.query.w && this.$route.query.w === workoutDoc.id) {
                        this.workoutData = workoutDoc.data();
                    }

                    this.downloadedWorkouts ++;
                })
            })
        })

        // Download recent workouts.
        db.collection("users").doc(this.$store.state.userProfile.data.uid).collection("recentWorkouts").orderBy("createdAt", "desc").get().then(recentWorkoutsSnapshot => {
            // Only push most recent of each workout.
            let uniqueIds = [];
            recentWorkoutsSnapshot.forEach(recentWorkout => {
                let data = recentWorkout.data();
                if (!uniqueIds.includes(data.id)) {
                    data.createdAt = dayjs(dayjs.unix(data.createdAt.seconds)).fromNow();
                    this.userRecentWorkouts.push(data);
                    uniqueIds.push(data.id);
                    console.log(data.createdAt);
                }
            })

            this.isLoadingRecentWorkouts = false;
            console.log(this.userRecentWorkouts);
        })
    },

    methods: {
        startWorkout: function() {
            this.startWorkoutDialogue = false;
            this.workoutCommenced = true;
        }
    },

    watch: {
        downloadedWorkouts: function() {
            if (this.downloadedWorkouts >= this.workoutsToDownload) {
                if (this.$route.query.w) {
                    if (this.workoutData) {
                        this.isLoadingWorkouts = false;
                        this.startWorkoutDialogue = true;
                    } else {
                        db.collection("workouts").doc(this.$route.query.w).get().then(workoutDoc => {
                            if (workoutDoc.exists) {
                                this.workoutData = workoutDoc.data();
                                this.isLoadingWorkouts = false;
                                this.startWorkoutDialogue = true;
                            }
                        })
                    }
                } else {
                    this.isLoadingWorkouts = false;
                }
            }
        },

        isLoadingWorkouts: function(n) {
            if (!n && !this.isLoadingRecentWorkouts) {
                this.isLoading = false;
            }
        },

        isLoadingRecentWorkouts: function(n) {
            if (!n && !this.isLoadingWorkouts) {
                this.isLoading = false;
            }
        }
    }
}
</script>