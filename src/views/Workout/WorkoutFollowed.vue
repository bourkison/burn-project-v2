<template>
    <v-sheet rounded="lg" min-height="70vh">
        <v-container>
            <h1 align="center">Workouts</h1>
            <!-- <v-container v-if="workouts.length > 0 && !isLoading">
                <ViewWorkoutMin v-for="workout in workouts" :key="workout.id" :userWorkoutData="workout"></ViewWorkoutMin>
            </v-container> -->
            <WorkoutFeed v-if="workouts.length > 0 && !isLoading" :workoutIds="workouts" />
            <v-container v-else-if="isLoading">
                <div align="center"><v-progress-circular indeterminate centered></v-progress-circular></div>
            </v-container>
            <v-container v-else>
                <p align="center"><em>Looks like you haven't followed or created any workouts.</em></p>
            </v-container>
        </v-container>
    </v-sheet>
</template>

<script>
import { db } from '@/firebase'
import WorkoutFeed from '@/components/Workout/WorkoutFeed.vue'

export default {
    name: 'WorkoutFollowed',
    components: { WorkoutFeed },
    data() {
        return {
            isLoading: true,
            workouts: [],
            errorMessage: ''
        }
    },

    created: function() {
        // Download relevant workout.
        db.collection("users").doc(this.$store.state.userProfile.data.uid).collection("workouts").orderBy("createdAt", "desc").get().then(workoutsSnapshot => {
            if (workoutsSnapshot.size > 0) {
                workoutsSnapshot.forEach(workout => {
                    this.workouts.push(workout.id);
                })
            }

            this.isLoading = false;
        }).catch(e => {
            this.isLoading = false;
            this.errorMessage = "Error downloading workout " + e;
            console.log(this.errorMessage);
        })
    }
}
</script>