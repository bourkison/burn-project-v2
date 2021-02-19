<template>
    <v-card>
        <v-container v-if="!isLoading">
            <div v-if="filteredRecentWorkouts.length > 0">
                <h2>Recent Workouts</h2>
                <v-list>
                    <v-list-item v-for="recentWorkout in recentWorkouts" :key="recentWorkout.id" @click="selectRecentWorkout(recentWorkout)">
                        <v-list-item-title>{{ recentWorkout.name }}</v-list-item-title>
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
    name: 'BurnSearch',
    data() {
        return {
            isLoading: true,
            searchText: '',
            recentWorkouts: []
        }
    },

    mounted: function() {
        db.collection("users").doc(this.$store.state.userProfile.data.uid).collection("recentWorkouts").orderBy("createdAt", "desc").get()
        .then(recentWorkoutsSnapshot => {
            // Only push most recent of each workout.
            let uniqueNames = [];
            recentWorkoutsSnapshot.forEach(recentWorkout => {
                let data = recentWorkout.data();
                if (!uniqueNames.includes(data.name)) {
                    data.id = recentWorkout.id;
                    this.recentWorkouts.push(data);
                    uniqueNames.push(data.name)
                }
            })

            this.isLoading = false;
        })
    },

    computed: {
        filteredRecentWorkouts: function() {
            if (this.searchText) {
                return this.recentWorkouts;
            } else {
                return this.recentWorkouts;
            }
        }
    },

    methods: {
        selectRecentWorkout: function(id) {
            this.$emit("selectRecentWorkout", id);
        }
    }
}
</script>