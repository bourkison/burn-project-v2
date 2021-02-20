<template>
    <v-container>
        <ExerciseComponent v-for="exercise in exercises" :userExerciseData="exercise" :key="exercise.id"/>
    </v-container>
</template>

<script>
import ExerciseComponent from '@/components/Exercise/ExerciseComponent.vue'

export default {
    name: 'ExerciseView',
    components: { ExerciseComponent },
    props: {
        exercises: {
            type: Array,
            required: true
        }
    },

    created: function() {
        console.log("Exercise Feed");
    }
}
</script>