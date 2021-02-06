<template>
    <v-container>
        <h1>{{ workout.name }}</h1>
        <v-list-group :value="true" active-class="activeListGroup" v-for="exercise in exercises" :key="exercise.id">
            <template v-slot:activator>
                <v-list-item-title>{{ exercise.name }}</v-list-item-title>
            </template>

            <v-list-item v-for="(set, index) in exercise.sets" :key="index">
                <v-row>
                    <v-col cols="12" sm="4">
                        <v-text-field type="number" v-model="set.kg" label="kg"></v-text-field>
                    </v-col>
                    <v-col cols="12" sm="4">
                        <v-text-field type="number" v-model="set.reps" label="Reps"></v-text-field>
                    </v-col>
                </v-row>
            </v-list-item>
        </v-list-group>
    </v-container>
</template>

<script>
export default {
    name: 'WorkoutRecorder',
    props: {
        workout: {
            type: Object,
            required: true
        }
    },

    data() {
        return {
            exercises: []
        }
    },

    mounted: function() {
        let incrementor = 0;
        this.$props.workout.exercises.forEach(e => {
            let temp = [];

            e.suggestedSets.forEach(set => {
                let data = { reps: set.measureAmount, kg: null }
                temp.push(data);
            })

            this.exercises.push({ id: incrementor, sets: temp, name: e.name });
            incrementor ++;
        })
    }
}
</script>

<style scoped>
    .v-list-item .activeListGroup {
        color: #FFF !important;
        display: none !important;
    }

    .v-list-item .v-list-item--active {
        color: #fff;
    }
</style>