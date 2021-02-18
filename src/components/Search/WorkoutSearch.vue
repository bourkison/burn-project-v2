<template>
    <v-card>
        <v-container v-if="!isLoading">
            <v-text-field prepend-inner-icon="mdi-magnify" v-model="searchText" clearable label="Search workout..."></v-text-field>

            <div v-if="filteredUserWorkouts.length > 0">
                <h2>My Workouts</h2>
                <v-list>
                    <v-list-item v-for="workout in filteredUserWorkouts" :key="workout.id" @click="selectWorkout(workout)">
                        <v-list-item-title>{{ workout.name }}</v-list-item-title>
                    </v-list-item>
                </v-list>
            </div>

            <div v-if="filteredFollowedWorkouts.length > 0">
                <h2>Followed Workouts</h2>
                <v-list>
                    <v-list-item v-for="workout in filteredFollowedWorkouts" :key="workout.id" @click="selectWorkout(workout)">
                        <v-list-item-title>{{ workout.name }}</v-list-item-title>
                    </v-list-item>
                </v-list>
            </div>
        </v-container>
        <v-container v-else>
            <div align="center"><v-progress-circular indeterminate centered></v-progress-circular></div>
        </v-container>
    </v-card>
</template>

<script>
import { db } from '@/firebase'

export default {
    name: 'WorkoutSearch',
    data() {
        return {
            isLoading: true,
            searchText: '',
            userWorkouts: [],
            followedWorkouts: [],
            otherWorkouts: [],
            
            unsortedWorkouts: [],

            // Firebase
            workoutsToDownload: 0,
            downloadedWorkouts: 0
        }
    },

    mounted: function() {
        db.collection("users").doc(this.$store.state.userProfile.data.uid).collection("workouts").orderBy("createdAt", "desc").get().then(workoutsSnapshot => {
            let i = 0;
            this.workoutsToDownload = workoutsSnapshot.size;
            workoutsSnapshot.forEach(workout => {
                this.downloadWorkout(workout.id, i, workout.data().isFollow);
            })
        })
    },

    computed: {
        filteredUserWorkouts: function() {
            if (this.searchText) {
                return this.userWorkouts.filter(workout => {
                    return workout.name.toLowerCase().includes(this.searchText.toLowerCase());
                })
            } else {
                return this.userWorkouts;
            }
        },

        filteredFollowedWorkouts: function() {
            if (this.searchText) {
                return this.followedWorkouts.filter(workout => {
                    return workout.name.toLowerCase().includes(this.searchText.toLowerCase());
                })
            } else {
                return this.followedWorkouts;
            }
        }
    },

    methods: {
        downloadWorkout: function(id, i, isFollow) {
            db.collection("workouts").doc(id).get().then(workoutDoc => {
                this.unsortedWorkouts.push({ order: i, data: workoutDoc.data(), isFollow: isFollow });
                this.downloadedWorkouts ++;
            })
        },

        selectWorkout: function(workout) {
            this.$emit("selectWorkout", workout);
        }
    },

    watch: {
        downloadedWorkouts: function() {
            if (this.downloadedWorkouts >= this.workoutsToDownload) {
                let temp = this.unsortedWorkouts.sort(function(a, b) { return a.order - b.order });

                temp.forEach(workout => {
                    if (workout.isFollow) {
                        this.followedWorkouts.push(workout.data);
                    } else {
                        this.userWorkouts.push(workout.data);
                    }
                })

                this.unsortedWorkouts = [];
                this.isLoading = false;
            }
        }
    }
}
</script>