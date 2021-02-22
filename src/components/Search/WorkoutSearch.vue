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

            <div v-if="userWorkouts.length === 0 && followedWorkouts.length === 0">
                <v-container><em>Try following or creating some workouts first!</em></v-container>
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
        }
    },

    mounted: function() {
        let workoutPromises = [];

        // Retrieve all workouts from user.
        db.collection("users").doc(this.$store.state.userProfile.data.uid).collection("workouts").orderBy("createdAt", "desc").get()
        .then(workoutsSnapshot => { 
            // Download each workout and push to unsortedWorkouts array.    
            workoutsSnapshot.forEach(workout => {
                return workoutPromises.push(db.collection("workouts").doc(workout.id).get().then(workoutDoc => {
                    let data = workoutDoc.data();
                    data.id = workoutDoc.id;
                    this.unsortedWorkouts.push({ data: data, isFollow: workout.data().isFollow });
                }))
            })
        })
        .then(() => {
            // Once all workouts are downloaded, sort them.
            Promise.all(workoutPromises).then(() => {
                this.unsortedWorkouts.sort(function(a, b) { return a.order - b.order });

                this.unsortedWorkouts.forEach(workout => {
                    if (workout.isFollow) {
                        this.followedWorkouts.push(workout.data);
                    } else {
                        this.userWorkouts.push(workout.data);
                    }
                })

                this.unsortedWorkouts = [];
                this.isLoading = false;
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
        selectWorkout: function(workout) {
            this.$emit("selectWorkout", workout);
        }
    }
}
</script>