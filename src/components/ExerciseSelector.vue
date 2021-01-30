<template>
    <div>Exercise Selector</div>
</template>

<script>
export default {
    name: 'ExerciseSelector',
    props: {
        createdExercises: {
            type: Array,
            required: false
        },
        followedExercises: {
            type: Array,
            required: false
        }
    },
    data() {
        return {
            isLoading: false
        }
    },

    created: function() {
        
    }
}
</script>