<template>
    <v-sheet rounded="lg" min-height="70vh">
        <v-container>
            <h1 align="center">Workouts</h1>
            <v-container v-if="workouts.length > 0 && !isLoading">
            </v-container>
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
export default {
    name: 'ViewWorkouts',
    data() {
        return {
            isLoading: false
        }
    }
}
</script>