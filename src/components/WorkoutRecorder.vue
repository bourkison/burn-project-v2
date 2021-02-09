<template>
    <v-container>
        <v-row align="center" justify="center">
            <v-col cols="12" sm="10">
                <h1>{{ workout.name }}</h1>
            </v-col>
            <v-col cols="12" sm="2">
                <p class="timeString">{{ timeString }}</p>
            </v-col>
        </v-row>
        <v-list-group :value="true" active-class="activeListGroup" v-for="exercise in exercises" :key="exercise.id">
            <template v-slot:activator>
                <v-list-item-title>{{ exercise.name }}</v-list-item-title>
            </template>

            <v-list-item v-for="(set, index) in exercise.sets" :key="index">
                <v-row align="center" justify="center">
                    <v-col cols="12" sm="1">
                        <span><b>{{ index + 1 }}</b></span>
                    </v-col>
                    <v-col cols="12" sm="4">
                        <v-text-field :rules=[rules.isNumber] v-model="set.kg" label="kg"></v-text-field>
                    </v-col>
                    <v-col cols="12" sm="4">
                        <v-text-field :rules=[rules.isNumber] v-model="set.reps" :label="set.measureBy"></v-text-field>
                    </v-col>
                    <v-spacer/>
                    <v-col cols="12" sm="1">
                        <v-checkbox v-model="set.completed" color="success" value="Completed" />
                    </v-col>
                    <v-spacer/>
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
            exercises: [],
            startTime: 0,
            interval: null,
            timeString: '00:00',

            // Vuetify:
            rules: {
                isNumber: value => !isNaN(value) || 'Must be a number'
            }
        }
    },

    mounted: function() {
        let incrementor = 0;
        this.$props.workout.exercises.forEach(e => {
            let temp = [];

            e.suggestedSets.forEach(set => {
                let data = { reps: set.measureAmount, measureBy: set.measureBy, kg: null }
                temp.push(data);
            })

            this.exercises.push({ id: incrementor, sets: temp, name: e.name });
            incrementor ++;
        })

        this.startTime = new Date().getTime();

        // Set an interval to run every second.
        this.interval = setInterval(() => {
            this.timerCount();
        }, 1000);
    },

    methods: {
        timerCount: function() {
            let now = new Date().getTime();
            let distance = now - this.startTime;

            let hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 24));
            let minutes = (Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60))).toLocaleString('en-US', { minimumIntegerDigits: 2, useGrouping: false });
            let seconds = (Math.floor((distance % (1000 * 60)) / 1000)).toLocaleString('en-US', { minimumIntegerDigits: 2, useGrouping: false });

            if (!hours) {
                this.timeString = minutes + ":" + seconds;
            } else {
                this.timeString = hours + ":" + minutes + ":" + seconds;
            }
        }
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

    .timeString {
        vertical-align: middle;
        display: inline;
        line-height: 48px;
    }
</style>