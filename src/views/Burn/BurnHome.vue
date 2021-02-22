<!--
    recentWorkout:
    {
        name: string,
        id: string, // Workout ID,
        workoutName: string, // Workout name,
        duration: integer,
        exercises: array of objects
    }

    exercises: 
    {
        name: string, // Exercise name
        id: string, // Exercise ID
        sets: array of objects
    }

    sets: 
    {
        kg: integer,
        measureAmount: integer,
        measureBy: string // Either Reps or Time
    }
-->

<template>
    <v-sheet rounded="lg">
        <v-container v-if="!isLoading">
            <div v-if="!workoutCommenced">
                <h1 align="center">Burn</h1>
                <v-text-field prepend-inner-icon="mdi-magnify" v-model="searchText" label="Search for a workout..." clearable></v-text-field>
                <div v-if="filteredBurns.length > 0">
                    <h2>Recent Workouts</h2>
                    <div class="recentWorkouts">
                        <v-container v-for="burn in filteredBurns" :key="'recent_' + burn.name">
                            <v-row justify="center" align="center" @click="startDialogue(burn, 'burn')" class="rowHover">
                                <v-col cols="12" sm="9">
                                    <div>{{ burn.name }}<br><span class="burnTime"><em>{{ recentWorkout.createdAtText }}</em></span></div>
                                </v-col>
                                <v-col cols="12" sm="3">
                                    <div align="right"><v-icon>mdi-chevron-right</v-icon></div>
                                </v-col>
                            </v-row>
                        </v-container>
                    </div>
                </div>
                <div v-if="filteredUserWorkouts.length > 0">
                    <h2>Workouts</h2>
                    <v-container v-for="workout in filteredUserWorkouts" :key="workout.id">
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
                <div v-if="userWorkouts.length === 0 && userRecentWorkouts.length === 0">
                    <v-container><em>Try following some <router-link to="/workouts">workouts</router-link> first, then come back here!</em></v-container>
                </div>
            </div>
            <div v-else>
                <v-card outlined rounded="lg">
                    <WorkoutRecorder :workoutObj="burnData" @cancelWorkout="cancelWorkout"></WorkoutRecorder>
                </v-card>
            </div>
        </v-container>
        <v-container v-else>
            <div align="center"><v-progress-circular indeterminate centered></v-progress-circular></div>
        </v-container>
        
        <div v-if="burnData">
            <v-dialog v-if="burnData && !workoutCommenced" v-model="startWorkoutDialogue" max-width="600">
                <v-card>
                    <v-container>
                        <v-list-item v-for="exercise in burnData.exercises" :key="exercise.id">
                            <v-list-item-content>
                                <v-list-item-title>{{ exercise.name }}</v-list-item-title>
                            </v-list-item-content>
                        </v-list-item>
                    </v-container>
                    <v-card-actions>
                        <v-spacer></v-spacer>
                        <v-btn color="error" text @click="cancelStart">Close</v-btn>
                        <v-btn color="blue darken-1" text @click="startWorkout">Start</v-btn>
                    </v-card-actions>
                </v-card>
            </v-dialog>
        </div>
    </v-sheet>
</template>

<script>
import { db } from '@/firebase'
import _ from 'lodash'

import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'

import WorkoutRecorder from '@/components/WorkoutRecorder.vue'

export default {
    name: 'BurnHome',
    components: { WorkoutRecorder },
    data() {
        return {
            isLoading: true,
            burnData: null,
            userWorkouts: [],
            userRecentWorkouts: [],
            workoutCommenced: false,

            // Search
            searchText: '',

            // Vuetify:
            startWorkoutDialogue: false
        }
    },

    created: function() {
        let workoutPromises = [];
        dayjs.extend(relativeTime);

        // Download user workouts.
        workoutPromises.push(db.collection("users").doc(this.$store.state.userProfile.data.uid).collection("workouts").orderBy("createdAt", "desc").get()
        .then(workoutsSnapshot => {
            this.workoutsToDownload = workoutsSnapshot.size;
            if (this.workoutsToDownload === 0) {
                this.isLoading = false;
            }

            workoutsSnapshot.forEach(workout => {
                db.collection("workouts").doc(workout.id).get().then(workoutDoc => {
                    let data = workoutDoc.data();
                    data.id = workoutDoc.id;
                    this.userWorkouts.push(data);

                    // Check if this is our route query workout. If so put in burnData to avoid loading twice.
                    if (this.$route.query.w && this.$route.query.w === workoutDoc.id) {
                        this.burnData = { type: 'workout', data: data };
                    }

                    this.downloadedWorkouts ++;
                })
            })
        }))

        // Download recent workouts.
        workoutPromises.push(db.collection("users").doc(this.$store.state.userProfile.data.uid).collection("burns").orderBy("createdAt", "desc").limit(10).get()
        .then(recentWorkoutsSnapshot => {
            // Only push most recent of each workout.
            let uniqueNames = [];
            recentWorkoutsSnapshot.forEach(recentWorkout => {
                let data = recentWorkout.data();
                if (!uniqueNames.includes(data.name)) {
                    data.createdAtText = dayjs(dayjs.unix(data.createdAt.seconds)).fromNow();
                    this.userRecentWorkouts.push(data);
                    uniqueNames.push(data.name);
                }

                if (this.$route.query.rw && this.$route.query.rw == recentWorkout.id) {
                    this.burnData = { type: 'burn', data: recentWorkout.data() };
                }
            })
        }))

        // Once everything is loaded, check that we have downloaded the query if there is one there.
        // If not, download it.
        Promise.all(workoutPromises)
        .then(() => {
            if (this.$route.query.w || this.$route.query.rw) {
                if (this.burnData) {
                    this.startWorkoutDialogue = true;
                    this.isLoading = false;
                } else {
                    console.log("Download");
                    db.collection("workouts").doc(this.$route.query.w).get()
                    .then(workout => {
                        this.burnData = { type: 'workout', data: workout.data() }
                        this.startWorkoutDialogue = true;
                        this.isLoading = false;
                    })
                }
            } else {
                this.isLoading = false;
            }
        })
    },

    methods: {
        startWorkout: function() {
            this.startWorkoutDialogue = false;
            this.workoutCommenced = true;
        },

        startDialogue: function(w, t) {
            if (t === "workout") {
                // Build to Burn format.
                this.burnData = {
                    exercises: w.exercises,
                    workout: {
                        id: w.id,
                        name: w.name 
                    },
                    name: w.name
                }

                console.log(this.burnData);
            } else {
                this.burnData = w;
            }
            this.startWorkoutDialogue =  true;
        },

        cancelWorkout: function() {
            this.workoutCommenced = false;
        },
        
        cancelStart: function() {
            this.startWorkoutDialogue = false;
            if (this.$route.query.w) {
                // Remove w from query
                this.$router.replace({ query: _.omit(this.$route.query, "w") });
            }
        }
    },

    computed: {
        filteredBurns: function() {
            if (this.searchText) {
                return this.userRecentWorkouts.filter(recentWorkout => {
                    return recentWorkout.name.toLowerCase().includes(this.searchText.toLowerCase());
                })
            } else {
                return this.userRecentWorkouts;
            }
        },

        filteredUserWorkouts: function() {
            if (this.searchText) {
                return this.userWorkouts.filter(workout => {
                    return workout.name.toLowerCase().includes(this.searchText.toLowerCase());
                })
            } else {
                return this.userWorkouts;
            }
        }
    }
}
</script>

<style scoped>
    .burnTime {
        font-size: 12px;
    }

    .rowHover:hover {
        cursor: pointer;
    }
</style>