<template>
    <v-sheet rounded="lg">
        <v-container v-if="!isLoading">
            <div v-if="!workoutCommenced">
                <h1 align="center">Burn</h1>
                <v-text-field prepend-inner-icon="mdi-magnify" v-model="searchText" label="Search Workout"></v-text-field>
                <h2>Recent Workouts</h2>
                <v-container v-for="recentWorkout in userRecentWorkouts" :key="'recent_' + recentWorkout.workoutId">
                    <v-row justify="center" align="center" @click="startDialogue(recentWorkout, 'recentWorkout')" class="rowHover">
                        <v-col cols="12" sm="9">
                            <div>{{ recentWorkout.workoutName }}<br><span class="recentWorkoutTime"><em>{{ recentWorkout.createdAtText }}</em></span></div>
                        </v-col>
                        <v-col cols="12" sm="3">
                            <div align="right"><v-icon>mdi-chevron-right</v-icon></div>
                        </v-col>
                    </v-row>
                </v-container>
                <h2>Workouts</h2>
                <v-container v-for="workout in userWorkouts" :key="workout.id">
                    <v-row justify="center" align="center" @click="startDialogue(workout, 'workout')" class="rowHover">
                        <v-col cols="12" sm="9">
                            <div>{{ workout.name }}</div>
                        </v-col>
                        <v-col cols="12" sm="3">
                            <div align="right"><v-icon>mdi-chevron-right</v-icon></div>
                        </v-col>
                    </v-row>
                </v-container>
            </div>
            <div v-else>
                <v-card outlined rounded="lg">
                    <WorkoutRecorder :workoutObj="workoutData"></WorkoutRecorder>
                </v-card>
            </div>
        </v-container>
        <v-container v-else>
            <div align="center"><v-progress-circular indeterminate centered></v-progress-circular></div>
        </v-container>

        <v-dialog v-if="workoutData.data" v-model="startWorkoutDialogue" max-width="600">
            <v-card>
                <v-container>
                    <v-list-item v-for="exercise in workoutData.data.exercises" :key="exercise.id">
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
    </v-sheet>
</template>

<script>
import { db } from '../../firebase'

import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'

import WorkoutRecorder from '../../components/WorkoutRecorder.vue'

export default {
    name: 'BurnHome',
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

            // Search
            searchText: '',

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
                        this.workoutData = {type: 'workout', data: workoutDoc.data()};
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
                if (!uniqueIds.includes(data.workoutId)) {
                    data.createdAtText = dayjs(dayjs.unix(data.createdAt.seconds)).fromNow();
                    this.userRecentWorkouts.push(data);
                    uniqueIds.push(data.workoutId);
                    console.log(data.createdAt);
                }
            })

            this.isLoadingRecentWorkouts = false;
            console.log(this.userRecentWorkouts);
            console.log("w", this.workoutData);
        })
    },

    methods: {
        startWorkout: function() {
            this.startWorkoutDialogue = false;
            this.workoutCommenced = true;
        },

        startDialogue: function(w, t) {
            this.workoutData = {type: t, data: w};
            this.startWorkoutDialogue =  true;
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
                                this.workoutData = {type: 'workout', data: workoutDoc.data()};
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

<style scoped>
    .recentWorkoutTime {
        font-size: 12px;
    }

    .rowHover:hover {
        cursor: pointer;
    }
</style>