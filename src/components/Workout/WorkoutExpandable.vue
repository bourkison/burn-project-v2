<template>
    <v-card>

    </v-card>
</template>

<script>
export default {
    name: 'WorkoutExpandable',
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
    }
}
</script>