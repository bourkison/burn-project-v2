<template>
    <v-card>
        <div v-if="!isLoading">
            <h3>{{ workout.name }}</h3>

            <v-expansion-panels>
                <ExerciseExpandable v-for="exercise in workout.exercises" :key="exercise.id" :exerciseToDownload="exercise"/>
            </v-expansion-panels>
        </div>
        <div v-else align="center"><v-progress-circular indeterminate centered></v-progress-circular></div>
    </v-card>
</template>

<script>
import { db } from '@/firebase'

import ExerciseExpandable from '@/components/Exercise/ExerciseExpandable.vue'

export default {
    name: 'WorkoutShare',
    components: { ExerciseExpandable },
    props: {
        workoutId: {
            type: String,
            required: false
        },
        workoutObj: {
            type: Object,
            required: false
        }
    },

    data() {
        return {
            isLoading: true,
            workout: {}
        }
    },

    mounted: function() {
        if (this.$props.workoutId) {
            db.collection("workouts").doc(this.$props.workoutId).get()
            .then(workoutDoc => {
                let data = workoutDoc.data();
                data.id = workoutDoc.id;
                this.workout = data;
                this.isLoading = false;
            })
        } else if (this.$props.workoutObj) {
            this.workout = this.$props.workoutObj;
            this.isLoading = false;
        }
    }
}
</script>