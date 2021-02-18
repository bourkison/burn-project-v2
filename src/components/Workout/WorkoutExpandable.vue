<template>
    <v-card>
        <h3>{{ workoutData.name }}</h3>

        <v-expansion-panels>
            <ExerciseExpandable v-for="exercise in workoutData.exercises" :key="exercise.id" :exerciseToDownload="exercise"></ExerciseExpandable>
        </v-expansion-panels>
    </v-card>
</template>

<script>
import ExerciseExpandable from '@/components/Exercise/ExerciseExpandable.vue'

export default {
    name: 'WorkoutExpandable',
    components: { ExerciseExpandable },
    props: {
        workout: {
            type: Object,
            required: false
        }
    },

    data() {
        return {
            workoutData: {}
        }
    },

    mounted: function() {
        this.workoutData = this.$props.workout;

        
    },

    watch: {
        workout: function() {
            this.workoutData = this.$props.workout;
        }
    }
}
</script>