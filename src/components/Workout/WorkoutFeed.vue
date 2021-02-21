<template>
    <v-container>
        <div v-if="workoutObjs">
            <WorkoutComponent v-for="workout in workoutObjs" :key="workout.id" :workoutObj="workout" />
        </div>
        <div v-if="workoutIds">
            <WorkoutComponent v-for="workout in workoutIds" :key="workout" :workoutId="workout" />
        </div>
    </v-container>
</template>

<script>
import WorkoutComponent from '@/components/Workout/WorkoutComponent.vue'

export default {
    name: 'WorkoutFeed',
    components: { WorkoutComponent },
    props: {
        workoutObjs: {
            type: Array,
            required: false
        },
        workoutIds: {
            type: Array,
            required: false
        }
    }
}
</script>