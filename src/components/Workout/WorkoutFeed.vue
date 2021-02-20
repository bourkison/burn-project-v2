<template>
    <v-container>
        <WorkoutComponent v-for="workout in workouts" :key="workout.id" :userWorkoutData="workout" />
    </v-container>
</template>

<script>
import WorkoutComponent from '@/components/Workout/WorkoutComponent.vue'

export default {
    name: 'WorkoutFeed',
    components: { WorkoutComponent },
    props: {
        workouts: {
            type: Array,
            required: true
        }
    },

    created: function() {
        console.log("Workout feed");
    }
}
</script>