<template>
    <v-sheet rounded="lg" min-height="70vh">
        <v-container>
            <h1 align="center">Discover Workouts</h1>
            <WorkoutFeed :workouts="workouts" />
        </v-container>
    </v-sheet>
</template>

<script>
import { db } from '@/firebase'
import WorkoutFeed from '@/components/Workout/WorkoutFeed'

export default {
    name: 'WorkoutDiscover',
    components: { WorkoutFeed },
    data() {
        return {
            isLoading: true,
            workouts: []
        }
    },

    created: function() {
        db.collection("workouts").orderBy("createdAt", "desc").get().then(workoutsSnapshot => {
            workoutsSnapshot.forEach(workout => {
                let data = { createdAt: workout.data().createdAt, createdBy: workout.data().createdBy, id: workout.id }
                this.workouts.push(data);
            })
        })
    }
}
</script>